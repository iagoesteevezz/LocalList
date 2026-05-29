// js/app.js - Orquestador principal

import { iniciarAuth, cerrarSesion, obtenerFamiliaDeUsuario } from './auth.js';
import { mostrarPantallaLogin, mostrarPantallaFamilia } from './authUI.js';
import {
    suscribirListaGlobal, obtenerSupermercados,
    obtenerMemoria, migrarDocumentoAntiguo
} from './db.js';
import {
    setContexto, renderizarListaGlobal, renderizarModoCompra,
    init3DMap, actualizarColores3D, crearPopupAyuda,
    crearPopupAlerta, configurarMenuYModoOscuro
} from './ui.js';
import { mostrarGestorSupermercados } from './gestorSupermercados.js';

let _state = {
    user: null, familiaID: null, supermercados: [],
    superActivo: null, productos: [], memoria: {},
    modo: 'global', unsub: null
};

// ARRANQUE
iniciarAuth(async (user, familiaID) => {
    if (!user) { mostrarPantallaLogin(u => _despuesDeSesion(u)); return; }
    _despuesDeSesion(user, familiaID);
});

async function _despuesDeSesion(user, familiaID) {
    familiaID = familiaID || await obtenerFamiliaDeUsuario(user.uid);
    if (!familiaID) { mostrarPantallaFamilia(user, fid => _iniciarApp(user, fid)); return; }
    _iniciarApp(user, familiaID);
}

async function _iniciarApp(user, familiaID) {
    _state.user = user;
    _state.familiaID = familiaID;

    crearPopupAyuda();
    crearPopupAlerta();
    configurarMenuYModoOscuro({
        familiaID,
        onCerrarSesion: _cerrarSesion,
        onGestorSupermercados: _abrirGestorSupermercados
    });

    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }

    await _verificarMigracion(familiaID, user.uid);
    _state.supermercados = await obtenerSupermercados(familiaID);
    setContexto({ familiaID, userUID: user.uid });

    if (_state.unsub) _state.unsub();
    _state.unsub = suscribirListaGlobal(familiaID, productos => {
        _state.productos = productos;
        _actualizarVista();
    });

    _renderizarBarraAccion();
}

// MIGRACION V1
async function _verificarMigracion(familiaID, userUID) {
    const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js");
    const { db } = await import('./firebase.js');
    const snap = await getDoc(doc(db, "families", familiaID));
    if (snap.exists() && snap.data().migradoDesdeV1) return;

    const legacy = await getDoc(doc(db, "supermercados", "mercadona_cruce"));
    if (!legacy.exists()) return;

    const ok = confirm("Hemos detectado tu lista anterior. Importar a LocaLisT V2?");
    if (!ok) return;

    const superID = await migrarDocumentoAntiguo(familiaID, userUID);
    if (superID) {
        _state.supermercados = await obtenerSupermercados(familiaID);
        alert("Importacion completada!");
    }
}

// VISTA
function _actualizarVista() {
    if (_state.modo === 'global') {
        renderizarListaGlobal(_state.productos);
        document.getElementById('mapa-3d-container').innerHTML = '';
    } else if (_state.modo === 'compra' && _state.superActivo) {
        renderizarModoCompra(_state.productos, _state.superActivo.pasillos, _state.memoria);
        init3DMap(_state.superActivo.pasillos);
        actualizarColores3D(_state.productos, _state.superActivo.pasillos, _state.memoria);
    }
}

// BARRA DE ACCION
function _renderizarBarraAccion() {
    document.getElementById('barra-accion')?.remove();
    const barra = document.createElement('div');
    barra.id = 'barra-accion';

    if (_state.modo === 'global') {
        barra.innerHTML = '<button id="btn-ir-comprar" class="btn-accion btn-accion--primary">Ir a Comprar</button>';
        barra.querySelector('#btn-ir-comprar').onclick = _mostrarSelectorSuper;
    } else {
        barra.innerHTML = '<button id="btn-volver-lista" class="btn-accion btn-accion--secondary">Volver a la lista</button>';
        barra.querySelector('#btn-volver-lista').onclick = _volverAListaGlobal;
    }
    document.body.appendChild(barra);
}

// SELECTOR DE SUPER
async function _mostrarSelectorSuper() {
    const supers = _state.supermercados;
    if (supers.length === 0) {
        const ok = confirm("No tienes supermercados. Crear uno ahora?");
        if (ok) _abrirGestorSupermercados();
        return;
    }
    if (supers.length === 1) { await _activarModoCompra(supers[0]); return; }

    const overlay = document.createElement('div');
    overlay.id = 'overlay-selector-super';
    overlay.className = 'auth-overlay';
    overlay.innerHTML = '<div class="auth-card"><h2>En que supermercado estas?</h2>' +
        supers.map(s =>
            '<button class="btn-auth btn-secondary btn-super-opcion" data-id="' + s.id + '">' +
            (s.icono || '') + ' ' + s.nombre + '</button>'
        ).join('') +
        '<button class="btn-auth btn-link" id="btn-cancelar-super">Cancelar</button></div>';
    document.body.appendChild(overlay);

    overlay.querySelectorAll('.btn-super-opcion').forEach(btn => {
        btn.onclick = async () => {
            const s = supers.find(x => x.id === btn.dataset.id);
            overlay.remove();
            await _activarModoCompra(s);
        };
    });
    document.getElementById('btn-cancelar-super').onclick = () => overlay.remove();
}

async function _activarModoCompra(supermercado) {
    _state.superActivo = supermercado;
    _state.modo = 'compra';
    localStorage.setItem('locallist_lastSuper', supermercado.id);
    _state.memoria = await obtenerMemoria(_state.familiaID, supermercado.id);
    setContexto({ superID: supermercado.id, pasillos: supermercado.pasillos });
    document.querySelector('.titulo-super').textContent = supermercado.nombre;
    _renderizarBarraAccion();
    _actualizarVista();
}

function _volverAListaGlobal() {
    _state.modo = 'global';
    _state.superActivo = null;
    _state.memoria = {};
    document.querySelector('.titulo-super').textContent = 'LocaLisT';
    _renderizarBarraAccion();
    _actualizarVista();
}

// GESTOR DE SUPERMERCADOS
async function _abrirGestorSupermercados() {
    const onCambio = async () => {
        _state.supermercados = await obtenerSupermercados(_state.familiaID);
        // Si el super activo fue editado/borrado, volver a lista global
        if (_state.superActivo) {
            const aun = _state.supermercados.find(s => s.id === _state.superActivo.id);
            if (!aun) _volverAListaGlobal();
            else _state.superActivo = aun;
        }
    };
    mostrarGestorSupermercados(_state.familiaID, _state.supermercados, onCambio);
}

// CERRAR SESION
async function _cerrarSesion() {
    if (_state.unsub) _state.unsub();
    _state = { user:null, familiaID:null, supermercados:[], superActivo:null,
               productos:[], memoria:{}, modo:'global', unsub:null };
    document.getElementById('supermercado-container').innerHTML = '';
    document.getElementById('mapa-3d-container').innerHTML = '';
    document.getElementById('barra-accion')?.remove();
    await cerrarSesion();
    mostrarPantallaLogin(u => _despuesDeSesion(u));
}
