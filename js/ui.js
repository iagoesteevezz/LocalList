// js/ui.js
// Toda la lógica de renderizado HTML, mapa 3D y popups.

import { ESTRUCTURA_PASILLOS, sonParecidos } from './data.js';
import {
    agregarProductoFirestore,
    borrarProductoFirestore,
    toggleTachadoFirestore,
    cambiarCantidadFirestore,
    guardarOrdenFirestore
} from './db.js';

const containerHTML = document.getElementById('supermercado-container');

// ─── RENDER PRINCIPAL ─────────────────────────────────────────────────────────

export function renderizarLista(datosFirebase) {
    containerHTML.innerHTML = '';

    ESTRUCTURA_PASILLOS.forEach(pasillo => {
        const divPasillo = document.createElement('div');
        divPasillo.className = 'pasillo';
        divPasillo.id = `pasillo-html-${pasillo.id}`;

        const productosArr = datosFirebase[`productos_p${pasillo.id}`] || [];
        const numPendientes = productosArr.filter(prod => !datosFirebase[`tachado_${prod}`]).length;

        // Header del pasillo
        const header = document.createElement('div');
        header.className = 'pasillo-header';
        header.innerHTML = `
            <span>${pasillo.nombre}</span>
            <span class="contador-pasillo">${numPendientes}</span>
        `;
        divPasillo.appendChild(header);

        // Input para añadir producto
        const editor = document.createElement('div');
        editor.className = 'editor-pasillo';
        const input = document.createElement('input');
        input.placeholder = "Añadir a este pasillo...";
        const btnAdd = document.createElement('button');
        btnAdd.textContent = "+";
        btnAdd.onclick = () => {
            _handleAgregarProducto(pasillo.id, input.value, datosFirebase);
            input.value = '';
        };
        input.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                _handleAgregarProducto(pasillo.id, input.value, datosFirebase);
                input.value = '';
            }
        });
        editor.appendChild(input);
        editor.appendChild(btnAdd);
        divPasillo.appendChild(editor);

        // Lista de productos (pendientes primero, comprados al final)
        const pendientes = productosArr.filter(prod => !datosFirebase[`tachado_${prod}`]);
        const comprados = productosArr.filter(prod => datosFirebase[`tachado_${prod}`]);
        const productosOrdenados = [...pendientes, ...comprados];

        const listaContenedor = document.createElement('div');
        listaContenedor.className = 'contenedor-sortable';

        productosOrdenados.forEach(prod => {
            const divProd = _crearElementoProducto(prod, pasillo.id, datosFirebase);
            listaContenedor.appendChild(divProd);
        });

        divPasillo.appendChild(listaContenedor);
        containerHTML.appendChild(divPasillo);

        // Drag & drop
        new Sortable(listaContenedor, {
            animation: 150,
            delay: 300,
            delayOnTouchOnly: true,
            onEnd: async () => {
                const nuevoOrden = Array.from(listaContenedor.children).map(el => el.dataset.nombre);
                await guardarOrdenFirestore(pasillo.id, nuevoOrden);
            }
        });
    });
}

function _crearElementoProducto(prod, idPasillo, datosFirebase) {
    const divProd = document.createElement('div');
    divProd.className = 'producto';
    divProd.dataset.nombre = prod;

    const tachado = datosFirebase[`tachado_${prod}`] || false;
    if (tachado) divProd.classList.add('comprado');

    const cantidad = datosFirebase[`cantidad_${prod}`] || 1;

    divProd.innerHTML = `
        <div class="checkbox"></div>
        <span class="nombre-prod" style="flex:1">${prod}</span>
        <div class="contador-cantidad">
            <button class="btn-restar">-</button>
            <span class="numero-cant">${cantidad}</span>
            <button class="btn-sumar">+</button>
        </div>
        <span class="btn-borrar">×</span>
    `;

    divProd.querySelector('.nombre-prod').onclick = () => toggleTachadoFirestore(prod, tachado);
    divProd.querySelector('.checkbox').onclick = () => toggleTachadoFirestore(prod, tachado);

    divProd.querySelector('.btn-restar').onclick = (e) => {
        e.stopPropagation();
        cambiarCantidadFirestore(prod, cantidad, -1);
    };
    divProd.querySelector('.btn-sumar').onclick = (e) => {
        e.stopPropagation();
        cambiarCantidadFirestore(prod, cantidad, 1);
    };
    divProd.querySelector('.btn-borrar').onclick = (e) => {
        e.stopPropagation();
        borrarProductoFirestore(idPasillo, prod);
    };

    return divProd;
}

async function _handleAgregarProducto(idPasillo, nombreProducto, datosFirebase) {
    const nombreLimpio = nombreProducto.trim();
    if (!nombreLimpio) return;

    // Buscar duplicados en todos los pasillos
    for (const pasillo of ESTRUCTURA_PASILLOS) {
        const productosEnPasillo = datosFirebase[`productos_p${pasillo.id}`] || [];
        if (productosEnPasillo.some(prod => sonParecidos(prod, nombreLimpio))) {
            mostrarAlertaDuplicado(nombreLimpio, pasillo.nombre);
            return;
        }
    }

    await agregarProductoFirestore(idPasillo, nombreLimpio);
}

// ─── MAPA 3D ──────────────────────────────────────────────────────────────────

export function init3DMap() {
    const container = document.getElementById('mapa-3d-container');
    if (!container) return;
    container.innerHTML = '';

    ESTRUCTURA_PASILLOS.forEach((pasillo, i) => {
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
        pasillo.iconos.forEach(emoji => {
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

export function actualizarColores3D(datosFirebase) {
    ESTRUCTURA_PASILLOS.forEach(pasillo => {
        const productos = datosFirebase[`productos_p${pasillo.id}`] || [];
        const tienePendientes = productos.some(p => !datosFirebase[`tachado_${p}`]);
        const wrapper = document.getElementById(`pasillo-3d-${pasillo.id}`);
        if (wrapper) {
            wrapper.classList.toggle('con-pendientes', tienePendientes);
        }
    });
}

// ─── BADGE ────────────────────────────────────────────────────────────────────

export function actualizarBadge(datosFirebase) {
    if (!('setAppBadge' in navigator)) return;
    const totalPendientes = ESTRUCTURA_PASILLOS.reduce((acc, p) => {
        const prods = datosFirebase[`productos_p${p.id}`] || [];
        return acc + prods.filter(item => !datosFirebase[`tachado_${item}`]).length;
    }, 0);
    totalPendientes > 0
        ? navigator.setAppBadge(totalPendientes)
        : navigator.clearAppBadge();
}

// ─── POPUPS ───────────────────────────────────────────────────────────────────

export function crearPopupAyuda() {
    const modal = document.createElement('div');
    modal.id = 'popup-ayuda';
    modal.className = 'popup-oculto';
    modal.innerHTML = `
        <div class="popup-contenido">
            <span id="cerrar-popup">&times;</span>
            <h3>¿Cómo funciona?</h3>
            <p><strong>🏠 En casa:</strong><br>Quita el tick verde a lo que necesites comprar.</p>
            <p><strong>🛒 En el súper:</strong><br>Pon el tick verde a lo que vayas metiendo al carro.</p>
        </div>
    `;
    document.body.appendChild(modal);
    document.getElementById('cerrar-popup').onclick = () => modal.className = 'popup-oculto';
    window.addEventListener('click', (e) => { if (e.target === modal) modal.className = 'popup-oculto'; });
}

export function crearPopupAlerta() {
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

export function mostrarAlertaDuplicado(producto, pasillo) {
    const modal = document.getElementById('popup-alerta');
    document.getElementById('alerta-mensaje').innerHTML =
        `¡Espera!<br><br>El producto <strong>"${producto}"</strong> ya está en la lista.<br><br>Lo tienes en:<br> <strong>${pasillo}</strong>`;
    modal.className = 'popup-visible';
}

// ─── MENÚ Y MODO OSCURO ───────────────────────────────────────────────────────

export function configurarMenuYModoOscuro() {
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
    `;
    document.body.appendChild(menuDesplegable);

    btnMenu.onclick = (e) => {
        e.stopPropagation();
        menuDesplegable.classList.toggle('visible');
    };
    window.addEventListener('click', (e) => {
        if (e.target !== btnMenu) menuDesplegable.classList.remove('visible');
    });

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
        const esModoOscuro = document.body.classList.contains('dark-mode');
        localStorage.setItem('temaPreferido', esModoOscuro ? 'oscuro' : 'claro');
        btnOscuro.innerHTML = esModoOscuro ? '☀️ Modo Claro' : '🌙 Modo Oscuro';
        menuDesplegable.classList.remove('visible');
    };
}
