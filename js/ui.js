// js/ui.js
// Renderizado de la UI. Trabaja con el nuevo modelo de datos (lista global + súpers dinámicos).

import { normalizarTexto, sonParecidos } from './data.js';
import {
    agregarProductoGlobal,
    borrarProductoGlobal,
    toggleTachadoGlobal,
    cambiarCantidadGlobal,
    guardarMemoria
} from './db.js';

// Contexto activo (se setea desde app.js)
let _ctx = { familiaID: null, superID: null, pasillos: [], userUID: null, memoria: {} };

export function setContexto(ctx) {
    _ctx = { ..._ctx, ...ctx };
}

export function setMemoria(memoria) {
    _ctx.memoria = memoria;
}

// ─── VISTA: LISTA GLOBAL ──────────────────────────────────────────────────────
// Usada en el modo "En casa": muestra todos los productos sin organizar por pasillo.

export function renderizarListaGlobal(productos) {
    const container = document.getElementById('supermercado-container');
    container.innerHTML = '';

    const pendientes = productos.filter(p => !p.tachado);
    const comprados  = productos.filter(p => p.tachado);

    // Input global para añadir
    const editorGlobal = document.createElement('div');
    editorGlobal.className = 'editor-global';
    editorGlobal.innerHTML = `
        <input type="text" id="input-global" placeholder="Añadir producto..." autocomplete="off">
        <button id="btn-add-global">+</button>
    `;
    container.appendChild(editorGlobal);

    const inputGlobal = editorGlobal.querySelector('#input-global');
    const btnAdd = editorGlobal.querySelector('#btn-add-global');

    const handleAdd = () => {
        const val = inputGlobal.value.trim();
        if (!val) return;
        _handleAgregarProductoGlobal(val, productos);
        inputGlobal.value = '';
    };
    btnAdd.onclick = handleAdd;
    inputGlobal.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAdd(); });

    // Lista
    if (pendientes.length === 0 && comprados.length === 0) {
        const vacio = document.createElement('div');
        vacio.className = 'lista-vacia';
        vacio.innerHTML = `<p>🛒 La lista está vacía.<br>Añade lo que necesitas comprar.</p>`;
        container.appendChild(vacio);
        return;
    }

    const lista = document.createElement('div');
    lista.className = 'lista-global-container';

    [...pendientes, ...comprados].forEach(prod => {
        lista.appendChild(_crearItemGlobal(prod));
    });

    container.appendChild(lista);
    actualizarBadge(productos);
}

function _crearItemGlobal(prod) {
    const div = document.createElement('div');
    div.className = 'producto' + (prod.tachado ? ' comprado' : '');
    div.dataset.id = prod.id;

    div.innerHTML = `
        <div class="checkbox"></div>
        <span class="nombre-prod">${prod.nombre}</span>
        <div class="contador-cantidad">
            <button class="btn-restar">-</button>
            <span class="numero-cant">${prod.cantidad}</span>
            <button class="btn-sumar">+</button>
        </div>
        <span class="btn-borrar">×</span>
    `;

    div.querySelector('.checkbox').onclick =
    div.querySelector('.nombre-prod').onclick = () =>
        toggleTachadoGlobal(_ctx.familiaID, prod.id, prod.tachado);

    div.querySelector('.btn-restar').onclick = (e) => {
        e.stopPropagation();
        cambiarCantidadGlobal(_ctx.familiaID, prod.id, prod.cantidad, -1);
    };
    div.querySelector('.btn-sumar').onclick = (e) => {
        e.stopPropagation();
        cambiarCantidadGlobal(_ctx.familiaID, prod.id, prod.cantidad, 1);
    };
    div.querySelector('.btn-borrar').onclick = (e) => {
        e.stopPropagation();
        borrarProductoGlobal(_ctx.familiaID, prod.id);
    };

    return div;
}

async function _handleAgregarProductoGlobal(nombre, productosActuales) {
    // Comprobar duplicados
    const duplicado = productosActuales.find(p => sonParecidos(p.nombre, nombre));
    if (duplicado) {
        mostrarAlertaDuplicado(nombre, null);
        return;
    }
    await agregarProductoGlobal(_ctx.familiaID, nombre, _ctx.userUID);
}

// ─── VISTA: MODO COMPRA (por pasillos) ────────────────────────────────────────
// Distribuye los productos de la lista global en los pasillos del súper activo.
// Los productos sin memoria de pasillo se ponen en "Sin asignar".

export function renderizarModoCompra(productos, pasillos, memoria) {
    const container = document.getElementById('supermercado-container');
    container.innerHTML = '';

    // Banner del súper activo
    const banner = document.createElement('div');
    banner.className = 'banner-super-activo';
    banner.innerHTML = `<span id="nombre-super-activo">Cargando súper...</span>`;
    container.appendChild(banner);

    // Distribuir productos en pasillos
    const porPasillo = {}; // { pasilloID: [prod, ...] }
    const sinAsignar = [];

    pasillos.forEach(p => { porPasillo[p.id] = []; });

    productos.filter(p => !p.tachado).forEach(prod => {
        const norm = normalizarTexto(prod.nombre);
        const pasilloID = memoria[norm];
        if (pasilloID && porPasillo[pasilloID] !== undefined) {
            porPasillo[pasilloID].push(prod);
        } else {
            sinAsignar.push(prod);
        }
    });

    // Renderizar pasillos con productos
    pasillos.forEach(pasillo => {
        const prods = porPasillo[pasillo.id];
        if (prods.length === 0) return; // ocultar pasillos vacíos en modo compra

        const divPasillo = _crearSeccionPasillo(pasillo, prods, memoria);
        container.appendChild(divPasillo);
    });

    // Sección "Sin asignar"
    if (sinAsignar.length > 0) {
        const divSinAsignar = _crearSeccionSinAsignar(sinAsignar, pasillos);
        container.appendChild(divSinAsignar);
    }

    // Comprados (colapsados al final)
    const comprados = productos.filter(p => p.tachado);
    if (comprados.length > 0) {
        container.appendChild(_crearSeccionComprados(comprados));
    }

    actualizarBadge(productos);
}

function _crearSeccionPasillo(pasillo, productos, memoria) {
    const div = document.createElement('div');
    div.className = 'pasillo';
    div.id = `pasillo-html-${pasillo.id}`;

    div.innerHTML = `
        <div class="pasillo-header">
            <span>${pasillo.nombre}</span>
            <span class="contador-pasillo">${productos.length}</span>
        </div>
    `;

    const lista = document.createElement('div');
    lista.className = 'contenedor-sortable';

    productos.forEach(prod => {
        const item = _crearItemModoCompra(prod);
        lista.appendChild(item);
    });

    div.appendChild(lista);
    return div;
}

function _crearItemModoCompra(prod) {
    const div = document.createElement('div');
    div.className = 'producto';
    div.dataset.id = prod.id;

    div.innerHTML = `
        <div class="checkbox"></div>
        <span class="nombre-prod">${prod.nombre}</span>
        <div class="contador-cantidad">
            <button class="btn-restar">-</button>
            <span class="numero-cant">${prod.cantidad}</span>
            <button class="btn-sumar">+</button>
        </div>
    `;

    div.querySelector('.checkbox').onclick =
    div.querySelector('.nombre-prod').onclick = () =>
        toggleTachadoGlobal(_ctx.familiaID, prod.id, prod.tachado);

    div.querySelector('.btn-restar').onclick = (e) => {
        e.stopPropagation();
        cambiarCantidadGlobal(_ctx.familiaID, prod.id, prod.cantidad, -1);
    };
    div.querySelector('.btn-sumar').onclick = (e) => {
        e.stopPropagation();
        cambiarCantidadGlobal(_ctx.familiaID, prod.id, prod.cantidad, 1);
    };

    return div;
}

function _crearSeccionSinAsignar(productos, pasillos) {
    const div = document.createElement('div');
    div.className = 'pasillo pasillo--sin-asignar';

    div.innerHTML = `
        <div class="pasillo-header pasillo-header--alerta">
            <span>❓ Sin pasillo asignado</span>
            <span class="contador-pasillo">${productos.length}</span>
        </div>
        <p class="sin-asignar-hint">Toca un producto para asignarle pasillo en este súper.</p>
    `;

    const lista = document.createElement('div');
    lista.className = 'contenedor-sortable';

    productos.forEach(prod => {
        const item = _crearItemModoCompra(prod);

        // Al tocar el nombre → modal para asignar pasillo
        item.querySelector('.nombre-prod').onclick = (e) => {
            e.stopPropagation();
            mostrarModalAsignarPasillo(prod, pasillos);
        };
        item.querySelector('.checkbox').onclick = (e) => {
            e.stopPropagation();
            mostrarModalAsignarPasillo(prod, pasillos);
        };

        lista.appendChild(item);
    });

    div.appendChild(lista);
    return div;
}

function _crearSeccionComprados(productos) {
    const div = document.createElement('div');
    div.className = 'pasillo pasillo--comprados';

    const header = document.createElement('div');
    header.className = 'pasillo-header pasillo-header--comprados';
    header.innerHTML = `
        <span>✅ Ya en el carro (${productos.length})</span>
        <span class="contador-pasillo toggle-comprados-btn">▼</span>
    `;

    const lista = document.createElement('div');
    lista.className = 'lista-comprados oculta';

    productos.forEach(prod => {
        const item = document.createElement('div');
        item.className = 'producto comprado';
        item.innerHTML = `
            <div class="checkbox checked"></div>
            <span class="nombre-prod">${prod.nombre}</span>
        `;
        item.querySelector('.checkbox').onclick =
        item.querySelector('.nombre-prod').onclick = () =>
            toggleTachadoGlobal(_ctx.familiaID, prod.id, prod.tachado);
        lista.appendChild(item);
    });

    header.onclick = () => {
        lista.classList.toggle('oculta');
        header.querySelector('.toggle-comprados-btn').textContent =
            lista.classList.contains('oculta') ? '▼' : '▲';
    };

    div.appendChild(header);
    div.appendChild(lista);
    return div;
}

// ─── MODAL ASIGNAR PASILLO ────────────────────────────────────────────────────

function mostrarModalAsignarPasillo(prod, pasillos) {
    const existing = document.getElementById('modal-asignar');
    if (existing) existing.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-asignar';
    modal.className = 'popup-visible';

    const opciones = pasillos.map(p =>
        `<button class="btn-pasillo-opcion" data-pasillo="${p.id}">${p.nombre}</button>`
    ).join('');

    modal.innerHTML = `
        <div class="popup-contenido">
            <span id="cerrar-modal-asignar" style="float:right;cursor:pointer;font-size:1.5rem">&times;</span>
            <h3>¿En qué pasillo está <em>${prod.nombre}</em>?</h3>
            <div class="lista-pasillos-opciones">${opciones}</div>
        </div>
    `;

    document.body.appendChild(modal);

    document.getElementById('cerrar-modal-asignar').onclick = () => modal.remove();
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelectorAll('.btn-pasillo-opcion').forEach(btn => {
        btn.onclick = async () => {
            const pasilloID = parseInt(btn.dataset.pasillo);
            const norm = normalizarTexto(prod.nombre);

            // Guardar en memoria
            await guardarMemoria(_ctx.familiaID, _ctx.superID, norm, pasilloID);

            // Marcar como tachado (lo meten al carro)
            await toggleTachadoGlobal(_ctx.familiaID, prod.id, false);

            modal.remove();
        };
    });
}

// ─── MAPA 3D ──────────────────────────────────────────────────────────────────

export function init3DMap(pasillos = []) {
    const container = document.getElementById('mapa-3d-container');
    if (!container) return;
    container.innerHTML = '';

    pasillos.forEach((pasillo, i) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'pasillo-3d-wrapper';
        wrapper.id = `pasillo-3d-${pasillo.id}`;
        wrapper.style.left = `${15 + (i * 50)}px`;

        const bloque = document.createElement('div');
        bloque.className = 'bloque-pasillo';
        bloque.innerHTML = `<div class="numero-pasillo">${pasillo.id}</div>`;
        wrapper.appendChild(bloque);

        const iconosContainer = document.createElement('div');
        iconosContainer.className = 'iconos-container';
        (pasillo.iconos || []).forEach(emoji => {
            const span = document.createElement('span');
            span.className = 'icono-3d';
            span.textContent = emoji;
            iconosContainer.appendChild(span);
        });
        wrapper.appendChild(iconosContainer);

        wrapper.onclick = () => {
            wrapper.classList.add('click-animado');
            setTimeout(() => wrapper.classList.remove('click-animado'), 300);
            document.getElementById(`pasillo-html-${pasillo.id}`)
                ?.scrollIntoView({ behavior: 'smooth' });
        };

        container.appendChild(wrapper);
    });
}

export function actualizarColores3D(productos, pasillos, memoria) {
    pasillos.forEach(pasillo => {
        const tienePendientes = productos.some(p => {
            if (p.tachado) return false;
            const norm = normalizarTexto(p.nombre);
            return memoria[norm] === pasillo.id;
        });
        document.getElementById(`pasillo-3d-${pasillo.id}`)
            ?.classList.toggle('con-pendientes', tienePendientes);
    });
}

// ─── BADGE ────────────────────────────────────────────────────────────────────

export function actualizarBadge(productos) {
    if (!('setAppBadge' in navigator)) return;
    const pendientes = productos.filter(p => !p.tachado).length;
    pendientes > 0 ? navigator.setAppBadge(pendientes) : navigator.clearAppBadge();
}

// ─── POPUPS ───────────────────────────────────────────────────────────────────

export function crearPopupAyuda() {
    document.getElementById('popup-ayuda')?.remove();
    const modal = document.createElement('div');
    modal.id = 'popup-ayuda';
    modal.className = 'popup-oculto';
    modal.innerHTML = `
        <div class="popup-contenido">
            <span id="cerrar-popup">&times;</span>
            <h3>¿Cómo funciona?</h3>
            <p><strong>🏠 En casa:</strong><br>Añade lo que necesitas a la lista global.</p>
            <p><strong>🛒 En el súper:</strong><br>Pulsa "Ir a Comprar", elige el supermercado y la app organiza todo por pasillos automáticamente.</p>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('cerrar-popup').onclick = () => modal.className = 'popup-oculto';
    window.addEventListener('click', (e) => { if (e.target === modal) modal.className = 'popup-oculto'; });
}

export function crearPopupAlerta() {
    document.getElementById('popup-alerta')?.remove();
    const modal = document.createElement('div');
    modal.id = 'popup-alerta';
    modal.className = 'popup-oculto';
    modal.innerHTML = `
        <div class="popup-contenido">
            <div class="alerta-icono">⚠️</div>
            <div class="alerta-texto" id="alerta-mensaje"></div>
            <button class="btn-entendido" id="btn-entendido">Entendido</button>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('btn-entendido').onclick = () => modal.className = 'popup-oculto';
    window.addEventListener('click', (e) => { if (e.target === modal) modal.className = 'popup-oculto'; });
}

export function mostrarAlertaDuplicado(producto) {
    const modal = document.getElementById('popup-alerta');
    document.getElementById('alerta-mensaje').innerHTML =
        `¡Espera!<br><br>El producto <strong>"${producto}"</strong> ya está en la lista.`;
    modal.className = 'popup-visible';
}

// ─── MENÚ Y MODO OSCURO ───────────────────────────────────────────────────────

export function configurarMenuYModoOscuro(ctx = {}) {
    document.getElementById('btn-menu-opciones')?.remove();
    document.getElementById('menu-desplegable')?.remove();

    const header = document.querySelector('header');
    if (!header) return;

    const btnMenu = document.createElement('button');
    btnMenu.id = 'btn-menu-opciones';
    btnMenu.innerHTML = '⋮';
    header.appendChild(btnMenu);

    const menuDesplegable = document.createElement('div');
    menuDesplegable.id = 'menu-desplegable';
    menuDesplegable.innerHTML = `
        <div class="opcion-menu" id="opcion-ayuda">❔ Ayuda</div>
        <div class="opcion-menu" id="opcion-oscuro">🌙 Modo Oscuro</div>
        <div class="opcion-menu opcion-menu--codigo" id="opcion-codigo">🔑 Código familiar</div>
        <div class="opcion-menu opcion-menu--danger" id="opcion-salir">🚪 Cerrar sesión</div>
    `;
    document.body.appendChild(menuDesplegable);

    btnMenu.onclick = (e) => { e.stopPropagation(); menuDesplegable.classList.toggle('visible'); };
    window.addEventListener('click', (e) => { if (e.target !== btnMenu) menuDesplegable.classList.remove('visible'); });

    document.getElementById('opcion-ayuda').onclick = () => {
        document.getElementById('popup-ayuda').className = 'popup-visible';
        menuDesplegable.classList.remove('visible');
    };

    const btnOscuro = document.getElementById('opcion-oscuro');
    if (localStorage.getItem('temaPreferido') === 'oscuro') {
        document.body.classList.add('dark-mode');
        btnOscuro.innerHTML = '☀️ Modo Claro';
    }
    btnOscuro.onclick = () => {
        document.body.classList.toggle('dark-mode');
        const oscuro = document.body.classList.contains('dark-mode');
        localStorage.setItem('temaPreferido', oscuro ? 'oscuro' : 'claro');
        btnOscuro.innerHTML = oscuro ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
        menuDesplegable.classList.remove('visible');
    };

    document.getElementById('opcion-codigo').onclick = async () => {
        menuDesplegable.classList.remove('visible');
        if (!ctx.familiaID) return;
        const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js");
        const { db } = await import('./firebase.js');
        const snap = await getDoc(doc(db, "families", ctx.familiaID));
        if (snap.exists()) _mostrarPopupCodigo(snap.data().codigo);
    };

    document.getElementById('opcion-salir').onclick = () => {
        menuDesplegable.classList.remove('visible');
        ctx.onCerrarSesion?.();
    };
}

function _mostrarPopupCodigo(codigo) {
    document.getElementById('popup-codigo')?.remove();
    const modal = document.createElement('div');
    modal.id = 'popup-codigo';
    modal.className = 'popup-visible';
    modal.innerHTML = `
        <div class="popup-contenido" style="text-align:center">
            <span id="cerrar-popup-codigo" style="float:right;cursor:pointer;font-size:1.5rem">&times;</span>
            <h3>🔑 Código familiar</h3>
            <p>Comparte este código con tu familia:</p>
            <div style="font-size:2rem;letter-spacing:6px;font-weight:bold;padding:12px;
                background:var(--color-fondo-pasillo,#e8f5e9);border-radius:8px;margin:12px 0">${codigo}</div>
            <button class="btn-entendido" id="btn-copiar-codigo">📋 Copiar</button>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('cerrar-popup-codigo').onclick = () => modal.remove();
    document.getElementById('btn-copiar-codigo').onclick = () => {
        navigator.clipboard.writeText(codigo).then(() => {
            document.getElementById('btn-copiar-codigo').textContent = '✅ Copiado';
        });
    };
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
}

// MAPA 3D
export function init3DMap(pasillos) {
    const container = document.getElementById('mapa-3d-container');
    if (!container) return;
    container.innerHTML = '';
    if (!pasillos || pasillos.length === 0) return;

    pasillos.forEach((pasillo, i) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'pasillo-3d-wrapper';
        wrapper.id = 'pasillo-3d-' + pasillo.id;
        wrapper.style.left = (15 + i * 50) + 'px';

        const bloque = document.createElement('div');
        bloque.className = 'bloque-pasillo';
        bloque.innerHTML = '<div class="numero-pasillo">' + pasillo.id + '</div>';
        wrapper.appendChild(bloque);

        const iconosContainer = document.createElement('div');
        iconosContainer.className = 'iconos-container';
        (pasillo.iconos || []).forEach(emoji => {
            const span = document.createElement('span');
            span.className = 'icono-3d';
            span.textContent = emoji;
            iconosContainer.appendChild(span);
        });
        wrapper.appendChild(iconosContainer);

        wrapper.onclick = () => {
            wrapper.classList.add('click-animado');
            setTimeout(() => wrapper.classList.remove('click-animado'), 300);
            document.getElementById('pasillo-html-' + pasillo.id)
                ?.scrollIntoView({ behavior: 'smooth' });
        };
        container.appendChild(wrapper);
    });
}

export function actualizarColores3D(productos, pasillos, memoria) {
    if (!pasillos) return;
    pasillos.forEach(pasillo => {
        const tienePendientes = productos.some(p => {
            if (p.tachado) return false;
            const norm = p.nombre.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
            return memoria[norm] === pasillo.id;
        });
        document.getElementById('pasillo-3d-' + pasillo.id)
            ?.classList.toggle('con-pendientes', tienePendientes);
    });
}

// BADGE
export function actualizarBadge(productos) {
    if (!('setAppBadge' in navigator)) return;
    const n = productos.filter(p => !p.tachado).length;
    n > 0 ? navigator.setAppBadge(n) : navigator.clearAppBadge();
}

// POPUPS
export function crearPopupAyuda() {
    document.getElementById('popup-ayuda')?.remove();
    const modal = document.createElement('div');
    modal.id = 'popup-ayuda';
    modal.className = 'popup-oculto';
    modal.innerHTML = '<div class="popup-contenido">' +
        '<span id="cerrar-popup" style="float:right;cursor:pointer;font-size:1.5rem">&times;</span>' +
        '<h3>Como funciona?</h3>' +
        '<p><strong>En casa:</strong> Anade lo que necesitas a la lista.</p>' +
        '<p><strong>En el super:</strong> Pulsa "Ir a Comprar", elige el supermercado y la app lo organiza por pasillos.</p>' +
        '</div>';
    document.body.appendChild(modal);
    document.getElementById('cerrar-popup').onclick = () => modal.className = 'popup-oculto';
    window.addEventListener('click', e => { if (e.target === modal) modal.className = 'popup-oculto'; });
}

export function crearPopupAlerta() {
    document.getElementById('popup-alerta')?.remove();
    const modal = document.createElement('div');
    modal.id = 'popup-alerta';
    modal.className = 'popup-oculto';
    modal.innerHTML = '<div class="popup-contenido">' +
        '<div class="alerta-icono">!</div>' +
        '<div class="alerta-texto" id="alerta-mensaje"></div>' +
        '<button class="btn-entendido" id="btn-entendido">Entendido</button>' +
        '</div>';
    document.body.appendChild(modal);
    document.getElementById('btn-entendido').onclick = () => modal.className = 'popup-oculto';
    window.addEventListener('click', e => { if (e.target === modal) modal.className = 'popup-oculto'; });
}

export function mostrarAlertaDuplicado(producto) {
    const modal = document.getElementById('popup-alerta');
    document.getElementById('alerta-mensaje').innerHTML =
        'El producto <strong>"' + producto + '"</strong> ya esta en la lista.';
    modal.className = 'popup-visible';
}

// MENU
export function configurarMenuYModoOscuro(ctx) {
    ctx = ctx || {};
    document.getElementById('btn-menu-opciones')?.remove();
    document.getElementById('menu-desplegable')?.remove();

    const header = document.querySelector('header');
    if (!header) return;

    const btnMenu = document.createElement('button');
    btnMenu.id = 'btn-menu-opciones';
    btnMenu.innerHTML = '&#8942;';
    header.appendChild(btnMenu);

    const menu = document.createElement('div');
    menu.id = 'menu-desplegable';
    menu.innerHTML =
        '<div class="opcion-menu" id="opcion-ayuda">Ayuda</div>' +
        '<div class="opcion-menu" id="opcion-oscuro">Modo Oscuro</div>' +
        '<div class="opcion-menu" id="opcion-supermercados">Supermercados</div>' +
        '<div class="opcion-menu" id="opcion-codigo">Codigo familiar</div>' +
        '<div class="opcion-menu opcion-menu--danger" id="opcion-salir">Cerrar sesion</div>';
    document.body.appendChild(menu);

    btnMenu.onclick = e => { e.stopPropagation(); menu.classList.toggle('visible'); };
    window.addEventListener('click', e => { if (e.target !== btnMenu) menu.classList.remove('visible'); });

    document.getElementById('opcion-ayuda').onclick = () => {
        document.getElementById('popup-ayuda').className = 'popup-visible';
        menu.classList.remove('visible');
    };

    const btnOscuro = document.getElementById('opcion-oscuro');
    if (localStorage.getItem('temaPreferido') === 'oscuro') {
        document.body.classList.add('dark-mode');
        btnOscuro.textContent = 'Modo Claro';
    }
    btnOscuro.onclick = () => {
        document.body.classList.toggle('dark-mode');
        const oscuro = document.body.classList.contains('dark-mode');
        localStorage.setItem('temaPreferido', oscuro ? 'oscuro' : 'claro');
        btnOscuro.textContent = oscuro ? 'Modo Claro' : 'Modo Oscuro';
        menu.classList.remove('visible');
    };

    document.getElementById('opcion-supermercados').onclick = async () => {
        menu.classList.remove('visible');
        if (!ctx.onGestorSupermercados) return;
        ctx.onGestorSupermercados();
    };

    document.getElementById('opcion-codigo').onclick = async () => {
        menu.classList.remove('visible');
        if (!ctx.familiaID) return;
        const { getDoc, doc } = await import("https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js");
        const { db } = await import('./firebase.js');
        const snap = await getDoc(doc(db, "families", ctx.familiaID));
        if (snap.exists()) _mostrarPopupCodigo(snap.data().codigo);
    };

    document.getElementById('opcion-salir').onclick = () => {
        menu.classList.remove('visible');
        if (ctx.onCerrarSesion) ctx.onCerrarSesion();
    };
}

function _mostrarPopupCodigo(codigo) {
    document.getElementById('popup-codigo')?.remove();
    const modal = document.createElement('div');
    modal.id = 'popup-codigo';
    modal.className = 'popup-visible';
    modal.innerHTML = '<div class="popup-contenido" style="text-align:center">' +
        '<span id="cerrar-popup-codigo" style="float:right;cursor:pointer;font-size:1.5rem">&times;</span>' +
        '<h3>Codigo familiar</h3>' +
        '<p>Comparte este codigo con tu familia:</p>' +
        '<div style="font-size:2rem;letter-spacing:6px;font-weight:bold;padding:12px;' +
        'background:#e8f5e9;border-radius:8px;margin:12px 0">' + codigo + '</div>' +
        '<button class="btn-entendido" id="btn-copiar-codigo">Copiar</button>' +
        '</div>';
    document.body.appendChild(modal);
    document.getElementById('cerrar-popup-codigo').onclick = () => modal.remove();
    document.getElementById('btn-copiar-codigo').onclick = () => {
        navigator.clipboard.writeText(codigo).then(() => {
            document.getElementById('btn-copiar-codigo').textContent = 'Copiado!';
        });
    };
    modal.addEventListener('click', e => { if (e.target === modal) modal.remove(); });
}
