// js/auth.js
// Gestión de autenticación y familias.
// Flujo: Login → ¿tiene familiaID? → Sí: cargar app / No: Crear o Unirse a familia

import { app } from './firebase.js';
import { db } from './firebase.js';
import {
    getAuth,
    onAuthStateChanged,
    signInWithPopup,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    GoogleAuthProvider,
    signOut
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-auth.js";
import {
    doc,
    getDoc,
    setDoc,
    updateDoc,
    arrayUnion,
    collection,
    query,
    where,
    getDocs
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

export const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Cache local del familiaID activo
const CACHE_KEY_FAMILIA = 'locallist_familiaID';

// ─── ESTADO GLOBAL DE AUTH ────────────────────────────────────────────────────

let _onReadyCallback = null;

/**
 * Punto de entrada principal. Llama a `callback(user, familiaID)` cuando
 * el estado de auth esté resuelto y el usuario tenga familia asignada.
 * Llama a `callback(null, null)` si no hay sesión.
 */
export function iniciarAuth(callback) {
    _onReadyCallback = callback;
    onAuthStateChanged(auth, async (user) => {
        if (!user) {
            callback(null, null);
            return;
        }
        // Usuario autenticado → buscar su familiaID
        const familiaID = await obtenerFamiliaDeUsuario(user.uid);
        callback(user, familiaID);
    });
}

// ─── LOGIN ────────────────────────────────────────────────────────────────────

export async function loginConGoogle() {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
}

export async function loginConEmail(email, password) {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return result.user;
}

export async function registrarConEmail(email, password, nombre) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    const user = result.user;
    // Crear perfil de usuario en Firestore
    await setDoc(doc(db, "users", user.uid), {
        nombre: nombre || email.split('@')[0],
        email: email,
        familiaID: null,
        creadoEn: new Date()
    });
    return user;
}

export async function cerrarSesion() {
    localStorage.removeItem(CACHE_KEY_FAMILIA);
    await signOut(auth);
}

// ─── FAMILIAS ─────────────────────────────────────────────────────────────────

/**
 * Devuelve el familiaID del usuario, o null si no tiene familia.
 * Usa localStorage como caché para evitar lecturas innecesarias.
 */
export async function obtenerFamiliaDeUsuario(uid) {
    const cached = localStorage.getItem(CACHE_KEY_FAMILIA);
    if (cached) return cached;

    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists() && userDoc.data().familiaID) {
        const familiaID = userDoc.data().familiaID;
        localStorage.setItem(CACHE_KEY_FAMILIA, familiaID);
        return familiaID;
    }
    return null;
}

/**
 * Crea una nueva familia. Devuelve { familiaID, codigo }.
 */
export async function crearFamilia(user, nombreFamilia) {
    const codigo = _generarCodigo();
    const familiaID = `fam_${user.uid.slice(0, 8)}_${Date.now()}`;

    await setDoc(doc(db, "families", familiaID), {
        nombre: nombreFamilia,
        codigo: codigo.toUpperCase(),
        creadoPor: user.uid,
        miembros: [user.uid],
        creadoEn: new Date()
    });

    await _vincularUsuarioAFamilia(user, familiaID);
    return { familiaID, codigo: codigo.toUpperCase() };
}

/**
 * Une al usuario a una familia existente por código.
 * Devuelve familiaID o lanza error si el código no existe.
 */
export async function unirseAFamilia(user, codigoIntroducido) {
    const codigo = codigoIntroducido.trim().toUpperCase();

    const q = query(
        collection(db, "families"),
        where("codigo", "==", codigo)
    );
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
        throw new Error("Código de familia no encontrado. Comprueba que está bien escrito.");
    }

    const familiaDoc = snapshot.docs[0];
    const familiaID = familiaDoc.id;

    // Añadir al usuario como miembro
    await updateDoc(doc(db, "families", familiaID), {
        miembros: arrayUnion(user.uid)
    });

    await _vincularUsuarioAFamilia(user, familiaID);
    return familiaID;
}

async function _vincularUsuarioAFamilia(user, familiaID) {
    // Asegurar que el perfil del usuario existe y tiene familiaID
    await setDoc(doc(db, "users", user.uid), {
        familiaID,
        nombre: user.displayName || user.email?.split('@')[0] || 'Usuario',
        email: user.email || ''
    }, { merge: true });

    localStorage.setItem(CACHE_KEY_FAMILIA, familiaID);
}

// ─── UTILS ────────────────────────────────────────────────────────────────────

function _generarCodigo() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Sin caracteres confusos (0/O, 1/I)
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
}
