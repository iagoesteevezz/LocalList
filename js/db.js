// js/db.js
// Todas las operaciones de lectura/escritura en Firestore.
// Por ahora mantiene el modelo actual (un doc plano por súper).
// En Fase 3 se migrará a la nueva arquitectura multi-súper.

import { db } from './firebase.js';
import {
    doc,
    onSnapshot,
    setDoc,
    updateDoc,
    arrayUnion,
    arrayRemove
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// Referencia al documento activo (Fase 3: será dinámica según súper seleccionado)
export const docRef = doc(db, "supermercados", "mercadona_cruce");

/**
 * Suscribe a cambios en tiempo real del documento activo.
 * @param {function} callback - Recibe el objeto de datos del snapshot.
 */
export function suscribirCambios(callback) {
    return onSnapshot(docRef, (snapshot) => {
        if (snapshot.exists()) {
            callback(snapshot.data());
        } else {
            setDoc(docRef, {});
        }
    });
}

export async function agregarProductoFirestore(idPasillo, nombreProducto) {
    const campo = `productos_p${idPasillo}`;
    await setDoc(docRef, { [campo]: arrayUnion(nombreProducto) }, { merge: true });
}

export async function borrarProductoFirestore(idPasillo, nombreProducto) {
    const campo = `productos_p${idPasillo}`;
    await updateDoc(docRef, { [campo]: arrayRemove(nombreProducto) });
}

export async function toggleTachadoFirestore(nombreProducto, estadoActual) {
    await setDoc(docRef, { [`tachado_${nombreProducto}`]: !estadoActual }, { merge: true });
}

export async function cambiarCantidadFirestore(nombreProducto, cantidadActual, incremento) {
    let nuevaCantidad = cantidadActual + incremento;
    if (nuevaCantidad < 1) nuevaCantidad = 1;
    await setDoc(docRef, { [`cantidad_${nombreProducto}`]: nuevaCantidad }, { merge: true });
}

export async function guardarOrdenFirestore(idPasillo, nuevoOrdenNombres) {
    const campo = `productos_p${idPasillo}`;
    await setDoc(docRef, { [campo]: nuevoOrdenNombres }, { merge: true });
}
