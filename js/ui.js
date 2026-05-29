// js/ui.js
// Renderizado de la UI. Trabaja con el nuevo modelo de datos (lista global + supers dinamicos).

import { normalizarTexto, sonParecidos, detectarCategoria, CATEGORIAS } from './data.js';
import {
    agregarProductoGlobal,
    borrarProductoGlobal,
    toggleTachadoGlobal,
    cambiarCantidadGlobal,
    guardarMemoria
} from './db.js';

// Contexto activo (se setea desde app.js)
let _ctx = {
    familiaID: null, superID: null, superNombre: '', pasillos: [], userUID: null, memoria: {}
};

export function setContexto(ctx) {
    _ctx = { ..._ctx, ...ctx };
}

export function setMemoria(memoria) {
    _ctx.memoria = memoria;
}

// --- VISTA: LISTA GLOBAL -------------------------------------------------------

export function renderizarListaGlobal(productos) {
    const container = document.getElementById('supermercado-container');
    container.innerHTML = '';

    // Input sticky arriba
    const editorGlobal = document.createElement('div');
    editorGlobal.className = 'editor-global';
    editorGlobal.innerHTML = `
        <input type="text" id="input-global" placeholder="Anadir producto..." autocomplete="off">
        <button id="btn-add-global">+</button>
    `;
    container.appendChild(editorGlobal);

    const inputGlobal = editorGlobal.querySelector('#input-global');
    const btnAdd      = editorGlobal.querySelector('#btn-add-global');

    const handleAdd = (e) => {
        if (e) e.preventDefault();
        const val = inputGlobal.value.trim();
        if (!val) return;
        inputGlobal.value = '';           // limpiar inmediatamente (feedback visual)
        inputGlobal.focus();
        _handleAgregarProductoGlobal(val, productos);
    };
    btnAdd.addEventListener('click', handleAdd);
    inputGlobal.addEventListener('keydown', (e) => { if (e.key === 'Enter') handleAdd(e); });

    if (productos.length === 0) {
        const vacio = document.createElement('div');
        vacio.className = 'lista-vacia';
        vacio.innerHTML = '<p>La lista esta vacia.<br>Anade lo que necesitas comprar.</p>';
        container.appendChild(vacio);
        return;
    }

    const pendientes = productos.filter(p => !p.tachado);
    const comprados  = productos.filter(p =>  p.tachado);

    // Agrupar pendientes por categoria respetando el orden de CATEGORIAS
    const grupos = {};
    pendientes.forEach(prod => {
        const catId = prod.categoria || 'otros';
        if (!grupos[catId]) grupos[catId] = [];
        grupos[catId].push(prod);
    });

    const lista = document.createElement('div');
    lista.className = 'lista-global-container';

    CATEGORIAS.forEach(cat => {
        const prods = grupos[cat.id];
        if (!prods || prods.length === 0) return;

        const header = document.createElement('div');
        header.className = 'cat-header';
        header.innerHTML =
            '<span class="cat-emoji">' + cat.emoji + '</span>' +
            '<span class="cat-nombre">' + cat.nombre + '</span>' +
            '<span class="cat-count">' + prods.length + '</span>';
        lista.appendChild(header);

        prods.forEach(prod => lista.appendChild(_crearItemGlobal(prod)));
    });

    // Comprados al final como seccion unica
    if (comprados.length > 0) {
        const header = document.createElement('div');
        header.className = 'cat-header cat-header--comprados';
        header.innerHTML =
            '<span class="cat-emoji">&#x2705;</span>' +
            '<span class="cat-nombre">En el carrito</span>' +
            '<span class="cat-count">' + comprados.length + '</span>';
        lista.appendChild(header);
        comprados.forEach(prod => lista.appendChild(_crearItemGlobal(prod)));
    }

    container.appendChild(lista);
    actualizarBadge(productos);
}

function _crearItemGlobal(prod) {
    const div = document.createElement('div');
    div.className = 'producto' + (prod.tachado ? ' comprado' : '');
    div.dataset.id = prod.id;

    div.innerHTML =
        '<div class="checkbox' + (prod.tachado ? ' checked' : '') + '"></div>' +
        '<span class="nombre-prod">' + prod.nombre + '</span>' +
        '<div class="contador-cantidad">' +
            '<button class="btn-restar">-</button>' +
            '<span class="numero-cant">' + prod.cantidad + '</span>' +
            '<button class="btn-sumar">+</button>' +
        '</div>' +
        '<span class="btn-borrar">&times;</span>';

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
    try {
        if (!_ctx.familiaID) { console.error('familiaID no definido'); return; }
        const duplicado = productosActuales.find(p => sonParecidos(p.nombre, nombre));
        if (duplicado) { mostrarAlertaDuplicado(nombre); return; }
        const categoria = detectarCategoria(nombre);
        await agregarProductoGlobal(_ctx.familiaID, nombre, _ctx.userUID, categoria);
    } catch (err) {
        console.error('Error al anadir producto:', err);
    }
}

// --- VISTA: MODO COMPRA (por pasillos) ----------------------------------------

export function renderizarModoCompra(productos, pasillos, memoria) {
    const container = document.getElementById('supermercado-container');
    container.innerHTML = '';

    // Banner con el nombre real del super (viene de _ctx.superNombre)
    const banner = document.createElement('div');
    banner.className = 'banner-super-activo';
    banner.textContent = _ctx.superNombre || 'Supermercado';
    container.appendChild(banner);

    const porPasillo = {};
    const sinAsignar = [];

    pasillos.forEach(p => { porPasillo[p.id] = []; });

    productos.forEach(prod => {
        const norm     = normalizarTexto(prod.nombre);
        const pasilloID = memoria[norm];
        if (pasilloID !== undefined && pasilloID !== null && porPasillo[pasilloID] !== undefined) {
            porPasillo[pasilloID].push(prod);
        } else if (!prod.tachado) {
            sinAsignar.push(prod);
        }
    });

    pasillos.forEach(pasillo => {
        const prods = porPasillo[pasillo.id];
        if (!prods || prods.length === 0) return;
        container.appendChild(_crearSeccionPasillo(pasillo, prods));
    });

    if (sinAsignar.length > 0) {
        container.appendChild(_crearSeccionSinAsignar(sinAsignar, pasillos));
    }

    actualizarBadge(productos);
}

function _crearSeccionPasillo(pasillo, productos) {
    const div = document.createElement('div');
    div.className = 'pasillo';
    div.id = 'pasillo-html-' + pasillo.id;

    const pendientes  = productos.filter(p => !p.tachado).length;
    const total       = productos.length;
    const todoListo   = pendientes === 0;

    const header = document.createElement('div');
    header.className = 'pasillo-header' + (todoListo ? ' pasillo-header--completo' : '');
    header.innerHTML =
        '<span>' + (pasillo.nombre || ('Pasillo ' + pasillo.id)) + '</span>' +
        '<span class="contador-pasillo">' + (todoListo ? '&#x2705;' : pendientes + '/' + total) + '</span>';
    div.appendChild(header);

    const listaEl = document.createElement('div');
    listaEl.className = 'contenedor-sortable';

    // Pendientes arriba, tachados al fondo del pasillo
    const ordenados = [
        ...productos.filter(p => !p.tachado),
        ...productos.filter(p =>  p.tachado)
    ];
    ordenados.forEach(prod => listaEl.appendChild(_crearItemModoCompra(prod)));

    div.appendChild(listaEl);
    return div;
}

function _crearItemModoCompra(prod) {
    const div = document.createElement('div');
    div.className = 'producto producto--compra' + (prod.tachado ? ' comprado' : '');
    div.dataset.id = prod.id;

    const checkClass = prod.tachado ? 'checkbox checked' : 'checkbox';
    const contadorHTML = prod.tachado
        ? '<span class="cantidad-comprada">&times;' + prod.cantidad + '</span>'
        : '<div class="contador-cantidad">' +
            '<button class="btn-restar">-</button>' +
            '<span class="numero-cant">' + prod.cantidad + '</span>' +
            '<button class="btn-sumar">+</button>' +
          '</div>';

    div.innerHTML =
        '<div class="' + checkClass + '"></div>' +
        '<span class="nombre-prod">' + prod.nombre + '</span>' +
        contadorHTML;

    const toggle = () => toggleTachadoGlobal(_ctx.familiaID, prod.id, prod.tachado);
    div.querySelector('.checkbox').onclick = toggle;
    div.querySelector('.nombre-prod').onclick = toggle;

    if (!prod.tachado) {
        div.querySelector('.btn-restar').onclick = (e) => {
            e.stopPropagation();
            cambiarCantidadGlobal(_ctx.familiaID, prod.id, prod.cantidad, -1);
        };
        div.querySelector('.btn-sumar').onclick = (e) => {
            e.stopPropagation();
            cambiarCantidadGlobal(_ctx.familiaID, prod.id, prod.cantidad, 1);
        };
    }

    return div;
}

function _crearSeccionSinAsignar(productos, pasillos) {
    const div = document.createElement('div');
    div.className = 'pasillo pasillo--sin-asignar';

    const header = document.createElement('div');
    header.className = 'pasillo-header pasillo-header--alerta';
    header.innerHTML =
        '<span>&#x2753; Sin pasillo asignado</span>' +
        '<span class="contador-pasillo">' + productos.length + '</span>';
    div.appendChild(header);

    const hint = document.createElement('p');
    hint.className = 'sin-asignar-hint';
    hint.textContent = 'Toca un producto para asignarle pasillo en este super.';
    div.appendChild(hint);

    const listaEl = document.createElement('div');
    listaEl.className = 'contenedor-sortable';

    productos.forEach(prod => {
        const item = _crearItemModoCompra(prod);
        const abrirModal = (e) => { e.stopPropagation(); mostrarModalAsignarPasillo(prod, pasillos); };
        item.querySelector('.nombre-prod').onclick = abrirModal;
        item.querySelector('.checkbox').onclick    = abrirModal;
        listaEl.appendChild(item);
    });

    div.appendChild(listaEl);
    return div;
}

// --- MODAL ASIGNAR PASILLO ----------------------------------------------------

function mostrarModalAsignarPasillo(prod, pasillos) {
    document.getElementById('modal-asignar')?.remove();

    const modal = document.createElement('div');
    modal.id = 'modal-asignar';
    modal.className = 'popup-visible';

    const opciones = pasillos.map(p =>
        '<button class="btn-pasillo-opcion" data-pasillo="' + p.id + '">' +
        (p.nombre || ('Pasillo ' + p.id)) +
        '</button>'
    ).join('');

    modal.innerHTML =
        '<div class="popup-contenido">' +
            '<span id="cerrar-modal-asignar" style="float:right;cursor:pointer;font-size:1.5rem">&times;</span>' +
            '<h3>En que pasillo esta <em>' + prod.nombre + '</em>?</h3>' +
            '<div class="lista-pasillos-opciones">' + opciones + '</div>' +
        '</div>';

    document.body.appendChild(modal);

    document.getElementById('cerrar-modal-asignar').onclick = () => modal.remove();
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });

    modal.querySelectorAll('.btn-pasillo-opcion').forEach(btn => {
        btn.onclick = async () => {
            const pasilloID = Number(btn.dataset.pasillo);
            const norm = normalizarTexto(prod.nombre);
            await guardarMemoria(_ctx.familiaID, _ctx.superID, norm, pasilloID);
            await toggleTachadoGlobal(_ctx.familiaID, prod.id, false);
            modal.remove();
        };
    });
}

// --- MAPA 3D ------------------------------------------------------------------

export function init3DMap(pasillos = []) {
    const container = document.getElementById('mapa-3d-container');
    if (!container) return;
    container.innerHTML = '';

    pasillos.forEach((pasillo, i) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'pasillo-3d-wrapper';
        wrapper.id = 'pasillo-3d-' + pasillo.id;
        wrapper.style.left = (15 + i * 52) + 'px';

        // Numero / ID del pasillo
        const num = document.createElement('div');
        num.className = 'p3d-numero';
        num.textContent = pasillo.id;

        // Iconos del pasillo
        const iconos = document.createElement('div');
        iconos.className = 'p3d-iconos';
        (pasillo.iconos || []).slice(0, 2).forEach(emoji => {
            const sp = document.createElement('span');
            sp.textContent = emoji;
            iconos.appendChild(sp);
        });

        wrapper.appendChild(num);
        wrapper.appendChild(iconos);

        wrapper.addEventListener('click', () => {
            wrapper.classList.add('p3d--pressed');
            setTimeout(() => wrapper.classList.remove('p3d--pressed'), 250);
            document.getElementById('pasillo-html-' + pasillo.id)
                ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        });

        container.appendChild(wrapper);
    });
}

export function actualizarColores3D(productos, pasillos, memoria) {
    pasillos.forEach(pasillo => {
        const tienePendientes = productos.some(p => {
            if (p.tachado) return false;
            return memoria[normalizarTexto(p.nombre)] === pasillo.id;
        });
        const el = document.getElementById('pasillo-3d-' + pasillo.id);
        if (!el) return;
        el.classList.toggle('p3d--pendiente', tienePendientes);
        el.classList.toggle('p3d--completo',  !tienePendientes);
    });
}

// --- BADGE --------------------------------------------------------------------

export function actualizarBadge(productos) {
    if (!('setAppBadge' in navigator)) return;
    const n = productos.filter(p => !p.tachado).length;
    n > 0 ? navigator.setAppBadge(n) : navigator.clearAppBadge();
}

// --- POPUPS -------------------------------------------------------------------

export function crearPopupAyuda() {
    document.getElementById('popup-ayuda')?.remove();
    const modal = document.createElement('div');
    modal.id = 'popup-ayuda';
    modal.className = 'popup-oculto';
    modal.innerHTML =
        '<div class="popup-contenido">' +
            '<span id="cerrar-popup">&times;</span>' +
            '<h3>Como funciona?</h3>' +
            '<p><strong>En casa:</strong><br>Anade lo que necesitas a la lista global.</p>' +
            '<p><strong>En el super:</strong><br>Pulsa "Ir a Comprar", elige el supermercado y la app organiza todo por pasillos automaticamente.</p>' +
        '</div>';
    document.body.appendChild(modal);
    document.getElementById('cerrar-popup').onclick = () => { modal.className = 'popup-oculto'; };
    window.addEventListener('click', (e) => { if (e.target === modal) modal.className = 'popup-oculto'; });
}

export function crearPopupAlerta() {
    document.getElementById('popup-alerta')?.remove();
    const modal = document.createElement('div');
    modal.id = 'popup-alerta';
    modal.className = 'popup-oculto';
    modal.innerHTML =
        '<div class="popup-contenido">' +
            '<div class="alerta-icono">&#x26A0;&#xFE0F;</div>' +
            '<div class="alerta-texto" id="alerta-mensaje"></div>' +
            '<button class="btn-entendido" id="btn-entendido">Entendido</button>' +
        '</div>';
    document.body.appendChild(modal);
    document.getElementById('btn-entendido').onclick = () => { modal.className = 'popup-oculto'; };
    window.addEventListener('click', (e) => { if (e.target === modal) modal.className = 'popup-oculto'; });
}

export function mostrarAlertaDuplicado(producto) {
    const modal = document.getElementById('popup-alerta');
    if (!modal) return;
    document.getElementById('alerta-mensaje').innerHTML =
        'Espera!<br><br>El producto <strong>"' + producto + '"</strong> ya esta en la lista.';
    modal.className = 'popup-visible';
}

// --- MENU Y MODO OSCURO -------------------------------------------------------

export function configurarMenuYModoOscuro(ctx = {}) {
    document.getElementById('btn-menu-opciones')?.remove();
    document.getElementById('menu-desplegable')?.remove();

    const header = document.querySelector('header');
    if (!header) return;

    const btnMenu = document.createElement('button');
    btnMenu.id = 'btn-menu-opciones';
    btnMenu.innerHTML = '&#x22EE;';
    header.appendChild(btnMenu);

    const menu = document.createElement('div');
    menu.id = 'menu-desplegable';
    menu.innerHTML =
        '<div class="opcion-menu" id="opcion-ayuda">&#x2754; Ayuda</div>' +
        '<div class="opcion-menu" id="opcion-oscuro">&#x1F319; Modo Oscuro</div>' +
        '<div class="opcion-menu" id="opcion-supers">&#x1F3EA; Supermercados</div>' +
        '<div class="opcion-menu opcion-menu--codigo" id="opcion-codigo">&#x1F511; Codigo familiar</div>' +
        '<div class="opcion-menu opcion-menu--danger" id="opcion-salir">&#x1F6AA; Cerrar sesion</div>';
    document.body.appendChild(menu);

    btnMenu.onclick = (e) => { e.stopPropagation(); menu.classList.toggle('visible'); };
    window.addEventListener('click', (e) => { if (e.target !== btnMenu) menu.classList.remove('visible'); });

    document.getElementById('opcion-ayuda').onclick = () => {
        document.getElementById('popup-ayuda').className = 'popup-visible';
        menu.classList.remove('visible');
    };

    // Modo oscuro
    const temaGuardado = localStorage.getItem('temaPreferido');
    if (temaGuardado === 'oscuro') document.body.classList.add('dark-mode');

    const btnOscuro = document.getElementById('opcion-oscuro');
    btnOscuro.onclick = () => {
        const isDark = document.body.classList.toggle('dark-mode');
        localStorage.setItem('temaPreferido', isDark ? 'oscuro' : 'claro');
        menu.classList.remove('visible');
    };

    // Supermercados
    if (ctx.onGestorSupermercados) {
        document.getElementById('opcion-supers').onclick = () => {
            menu.classList.remove('visible');
            ctx.onGestorSupermercados();
        };
    }

    // Codigo familiar
    document.getElementById('opcion-codigo').onclick = () => {
        menu.classList.remove('visible');
        _mostrarCodigoFamiliar(ctx.familiaID);
    };

    // Cerrar sesion
    document.getElementById('opcion-salir').onclick = () => {
        menu.classList.remove('visible');
        if (ctx.onCerrarSesion) ctx.onCerrarSesion();
    };
}

async function _mostrarCodigoFamiliar(familiaID) {
    if (!familiaID) return;
    try {
        const { getDoc, doc } = await import(
            'https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js'
        );
        const { db } = await import('./firebase.js');
        const snap = await getDoc(doc(db, 'families', familiaID));
        const codigo = snap.exists() ? snap.data().codigo : '---';

        const existing = document.getElementById('modal-codigo');
        if (existing) existing.remove();

        const modal = document.createElement('div');
        modal.id = 'modal-codigo';
        modal.className = 'popup-visible';
        modal.innerHTML =
            '<div class="popup-contenido">' +
                '<span id="cerrar-codigo" style="float:right;cursor:pointer;font-size:1.5rem">&times;</span>' +
                '<h3>Codigo de familia</h3>' +
                '<div class="codigo-display">' + codigo + '</div>' +
                '<p style="text-align:center;color:#666;font-size:.9rem">Comparte este codigo con tu familia para que puedan unirse.</p>' +
            '</div>';
        document.body.appendChild(modal);
        document.getElementById('cerrar-codigo').onclick = () => modal.remove();
        modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
    } catch (e) {
        console.error('Error al obtener codigo familiar:', e);
    }
}
