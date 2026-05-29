// js/app.js
// Orquestador principal. Conecta Firebase, UI y lógica de negocio.

import { suscribirCambios } from './db.js';
import {
    renderizarLista,
    init3DMap,
    actualizarColores3D,
    actualizarBadge,
    crearPopupAyuda,
    crearPopupAlerta,
    configurarMenuYModoOscuro
} from './ui.js';

// Solicitar permiso de notificaciones (no bloqueante)
if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
}

// Inicializar UI estática
crearPopupAyuda();
crearPopupAlerta();
configurarMenuYModoOscuro();
init3DMap();

// Suscribirse a cambios en Firestore y re-renderizar
suscribirCambios((datos) => {
    renderizarLista(datos);
    actualizarColores3D(datos);
    actualizarBadge(datos);
});
