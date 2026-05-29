// js/db.js
import { db } from './firebase.js';
import {
    collection, doc, getDoc, getDocs, setDoc, addDoc,
    updateDoc, deleteDoc, onSnapshot, serverTimestamp, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const _ref = {
    familia:       (fid)      => doc(db, "families", fid),
    supermercados: (fid)      => collection(db, "families", fid, "supermercados"),
    supermercado:  (fid, sid) => doc(db, "families", fid, "supermercados", sid),
    listaGlobal:   (fid)      => collection(db, "families", fid, "lista_global"),
    producto:      (fid, pid) => doc(db, "families", fid, "lista_global", pid),
    memory:        (fid)      => collection(db, "families", fid, "product_memory"),
    memoryDoc:     (fid, key) => doc(db, "families", fid, "product_memory", key),
};

// ── SUPERMERCADOS ──────────────────────────────────────────────────────────────

export async function obtenerSupermercados(familiaID) {
    const snap = await getDocs(_ref.supermercados(familiaID));
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function crearSupermercado(familiaID, { nombre, icono = '🏪', pasillos = [] }) {
    const ref = await addDoc(_ref.supermercados(familiaID), {
        nombre, icono, pasillos, creadoEn: serverTimestamp()
    });
    return ref.id;
}

export async function actualizarSupermercado(familiaID, superID, datos) {
    await updateDoc(_ref.supermercado(familiaID, superID), datos);
}

export async function borrarSupermercado(familiaID, superID) {
    await deleteDoc(_ref.supermercado(familiaID, superID));
}

// ── LISTA GLOBAL ───────────────────────────────────────────────────────────────

export function suscribirListaGlobal(familiaID, callback) {
    const q = query(_ref.listaGlobal(familiaID), orderBy("addedAt", "asc"));
    return onSnapshot(q, snap => {
        callback(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    });
}

export async function agregarProductoGlobal(familiaID, nombre, userUID) {
    return (await addDoc(_ref.listaGlobal(familiaID), {
        nombre: nombre.trim(), cantidad: 1, tachado: false,
        addedBy: userUID, addedAt: serverTimestamp()
    })).id;
}

export async function borrarProductoGlobal(familiaID, productoID) {
    await deleteDoc(_ref.producto(familiaID, productoID));
}

export async function toggleTachadoGlobal(familiaID, productoID, estadoActual) {
    await updateDoc(_ref.producto(familiaID, productoID), { tachado: !estadoActual });
}

export async function cambiarCantidadGlobal(familiaID, productoID, cantidadActual, incremento) {
    await updateDoc(_ref.producto(familiaID, productoID), {
        cantidad: Math.max(1, cantidadActual + incremento)
    });
}

// ── PRODUCT MEMORY ─────────────────────────────────────────────────────────────

function _memKey(superID, norm) { return `${superID}__${norm}`; }

export async function guardarMemoria(familiaID, superID, nombreNorm, pasilloID) {
    await setDoc(_ref.memoryDoc(familiaID, _memKey(superID, nombreNorm)),
        { pasilloID, superID, nombreNorm });
}

export async function obtenerMemoria(familiaID, superID) {
    const snap = await getDocs(_ref.memory(familiaID));
    const mem = {};
    snap.docs.forEach(d => {
        const data = d.data();
        if (data.superID === superID) mem[data.nombreNorm] = data.pasilloID;
    });
    return mem;
}

// ── MIGRACION V1 -> V2 ─────────────────────────────────────────────────────────

function _norm(texto) {
    return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

export async function migrarDocumentoAntiguo(familiaID, userUID) {
    const legacySnap = await getDoc(doc(db, "supermercados", "mercadona_cruce"));
    if (!legacySnap.exists()) return null;
    const datos = legacySnap.data();

    const pasillos = [
        { id: 1, nombre: "1. Frutas / verduras / congelados",     iconos: ["🍎","❄️"] },
        { id: 2, nombre: "2. Carnes / embutidos / Arroz / Latas", iconos: ["🥩","🥓"] },
        { id: 3, nombre: "3. Salsas / Pasta / Frutos secos",      iconos: ["🍝","🍅"] },
        { id: 4, nombre: "4. Nevera / bebidas",                    iconos: ["🥛","🥤"] },
        { id: 5, nombre: "5. Precocinados / papas",                iconos: ["🍟","🍕"] },
        { id: 6, nombre: "6. Cereales / Leche / Cuidado",          iconos: ["🥣","🧴"] },
        { id: 7, nombre: "7. Pan / galletas / cafe / limpieza",    iconos: ["🍞","🧹"] }
    ];

    const superID = await crearSupermercado(familiaID, { nombre: "Mercadona", icono: "🛒", pasillos });

    for (const pasillo of pasillos) {
        for (const nombre of (datos[`productos_p${pasillo.id}`] || [])) {
            await addDoc(_ref.listaGlobal(familiaID), {
                nombre,
                cantidad: datos[`cantidad_${nombre}`] || 1,
                tachado:  datos[`tachado_${nombre}`]  || false,
                addedBy: userUID,
                addedAt: serverTimestamp()
            });
            const n = _norm(nombre);
            await setDoc(_ref.memoryDoc(familiaID, _memKey(superID, n)),
                { pasilloID: pasillo.id, superID, nombreNorm: n });
        }
    }

    await setDoc(_ref.familia(familiaID), { migradoDesdeV1: true }, { merge: true });
    return superID;
}
