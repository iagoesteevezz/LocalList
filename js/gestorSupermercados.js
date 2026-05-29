// js/gestorSupermercados.js

import {
    crearSupermercado, actualizarSupermercado, borrarSupermercado,
    buscarSupermercadosComunidad, publicarSupermercadoComunidad, copiarSupermercadoDeComunidad
} from './db.js';

const ICONOS_SUPER    = ['🛒','🏪','🏬','🥦','🧺','🏷️','🛍️','🏘️'];
const ICONOS_PASILLO  = ['🍎','🥩','🥛','🍞','🧴','🧹','🍝','🥤','❄️','🍟','🥣','🍅','🥓','🍕','🧀','🐟','🫙','🧂','🥚','☕','🍷','🌿','🍰','🧃'];

// ── GESTOR PRINCIPAL ────────────────────────────────────────────────────────────

export function mostrarGestorSupermercados(familiaID, supermercados, onCambio) {
    _show(_buildGestor(familiaID, supermercados, onCambio));
}

function _buildGestor(familiaID, supermercados, onCambio) {
    const el = _card();

    const listaHTML = supermercados.length
        ? supermercados.map(s => `
            <div class="gsup-item">
                <span class="gsup-icono">${s.icono||'🏪'}</span>
                <div class="gsup-info">
                    <span class="gsup-nombre">${s.nombre}</span>
                    <span class="gsup-pasillos">${(s.pasillos||[]).length} pasillos</span>
                </div>
                <div class="gsup-acciones">
                    <button class="gsup-btn gsup-btn--edit" data-id="${s.id}" title="Editar">✏️</button>
                    <button class="gsup-btn gsup-btn--pub" data-id="${s.id}" title="Publicar en comunidad">🌐</button>
                    <button class="gsup-btn gsup-btn--del" data-id="${s.id}" title="Borrar">🗑️</button>
                </div>
            </div>`).join('')
        : '<p class="gsup-vacio">No tienes supermercados todavía.</p>';

    el.innerHTML = `
        <div class="gsup-header">
            <h2>Supermercados</h2>
            <button class="gsup-close" id="gsup-close">✕</button>
        </div>
        <div class="gsup-lista">${listaHTML}</div>
        <div class="gsup-footer-btns">
            <button class="btn-accion-gsup btn-gsup-primary" id="gsup-nuevo">+ Crear nuevo</button>
            <button class="btn-accion-gsup btn-gsup-secondary" id="gsup-comunidad">🌐 Buscar en comunidad</button>
        </div>`;

    _show(el);

    el.querySelector('#gsup-close').onclick = _hide;

    el.querySelector('#gsup-nuevo').onclick = () =>
        _mostrarEditor(familiaID, null, async datos => {
            await crearSupermercado(familiaID, datos);
            await onCambio();
            mostrarGestorSupermercados(familiaID, await _getSupers(familiaID), onCambio);
        }, familiaID, supermercados, onCambio);

    el.querySelector('#gsup-comunidad').onclick = () =>
        _mostrarBusquedaComunidad(familiaID, onCambio, supermercados);

    el.querySelectorAll('.gsup-btn--edit').forEach(btn => {
        btn.onclick = () => {
            const s = supermercados.find(x => x.id === btn.dataset.id);
            _mostrarEditor(familiaID, s, async datos => {
                await actualizarSupermercado(familiaID, s.id, datos);
                await onCambio();
                mostrarGestorSupermercados(familiaID, await _getSupers(familiaID), onCambio);
            }, familiaID, supermercados, onCambio);
        };
    });

    el.querySelectorAll('.gsup-btn--pub').forEach(btn => {
        btn.onclick = async () => {
            const s = supermercados.find(x => x.id === btn.dataset.id);
            if (!confirm('Publicar "' + s.nombre + '" para que otros usuarios puedan usarlo?')) return;
            try {
                await publicarSupermercadoComunidad(s, btn.dataset.id);
                alert('Publicado en la comunidad!');
            } catch(e) { alert('Error: ' + e.message); }
        };
    });

    el.querySelectorAll('.gsup-btn--del').forEach(btn => {
        btn.onclick = async () => {
            const s = supermercados.find(x => x.id === btn.dataset.id);
            if (!confirm('Borrar "' + s.nombre + '"?')) return;
            await borrarSupermercado(familiaID, btn.dataset.id);
            await onCambio();
            mostrarGestorSupermercados(familiaID, await _getSupers(familiaID), onCambio);
        };
    });
}

// ── EDITOR DE SUPERMERCADO ──────────────────────────────────────────────────────

function _mostrarEditor(familiaID, superExistente, onGuardar, fid, supers, onCambio) {
    const esNuevo = !superExistente;
    let pasillos = superExistente?.pasillos ? JSON.parse(JSON.stringify(superExistente.pasillos)) : [];
    let icono = superExistente?.icono || '🛒';

    function render() {
        const el = _card();
        el.innerHTML = `
            <div class="gsup-header">
                <button class="gsup-back" id="ed-back">← Volver</button>
                <h2>${esNuevo ? 'Nuevo supermercado' : 'Editar'}</h2>
            </div>

            <label class="ed-label">Nombre del supermercado</label>
            <input class="ed-input" id="ed-nombre" placeholder="Mercadona, Hiperdino, Spar..."
                value="${superExistente?.nombre||''}">

            <label class="ed-label">Icono</label>
            <div class="ed-iconos-grid" id="ed-iconos-super">
                ${ICONOS_SUPER.map(ic =>
                    '<button class="btn-icono' + (ic===icono?' activo':'') + '" data-icono="'+ic+'">'+ic+'</button>'
                ).join('')}
            </div>

            <div class="ed-pasillos-header">
                <label class="ed-label">Pasillos <span class="ed-count">${pasillos.length}</span></label>
                <button class="btn-add-pasillo" id="ed-add-pasillo">+ Añadir pasillo</button>
            </div>

            <div id="ed-lista-pasillos">
                ${pasillos.map((p,i) => _renderPasilloItem(p,i)).join('')}
            </div>

            ${pasillos.length===0 ? '<p class="ed-hint">Añade al menos un pasillo para guardar.</p>' : ''}

            <p class="auth-error" id="ed-error"></p>
            <button class="btn-accion-gsup btn-gsup-primary" id="ed-guardar">
                ${esNuevo ? 'Crear supermercado' : 'Guardar cambios'}
            </button>`;

        _show(el);
        _bindEditor(el, pasillos, icono, superExistente, onGuardar,
                    () => mostrarGestorSupermercados(fid, supers, onCambio),
                    (newIcono) => { icono = newIcono; },
                    (newPasillos) => { pasillos = newPasillos; render(); });

        document.getElementById('ed-back').onclick = () =>
            mostrarGestorSupermercados(fid, supers, onCambio);
    }
    render();
}

function _renderPasilloItem(p, i) {
    const iconosBtns = ICONOS_PASILLO.map(ic =>
        '<button class="btn-icono btn-icono--sm' + ((p.iconos||[]).includes(ic)?' activo':'') +
        '" data-icono="'+ic+'" data-idx="'+i+'">'+ic+'</button>'
    ).join('');
    return '<div class="ed-pasillo-item" data-idx="'+i+'">' +
        '<div class="ed-pasillo-row">' +
        '<span class="ed-pasillo-num">'+(i+1)+'</span>' +
        '<input class="ed-input ed-input--pasillo input-pasillo-nombre" ' +
            'placeholder="Ej: Frutas y verduras" value="'+(p.nombre||'')+'">' +
        '<button class="btn-del-pasillo" data-idx="'+i+'" title="Eliminar">✕</button>' +
        '</div>' +
        '<div class="ed-iconos-pasillo">'+iconosBtns+'</div>' +
        '</div>';
}

function _bindEditor(el, pasillos, iconoActual, superEx, onGuardar, onVolver, setIcono, setPasillos) {
    // Icono del super
    el.querySelectorAll('#ed-iconos-super .btn-icono').forEach(btn => {
        btn.onclick = () => {
            setIcono(btn.dataset.icono);
            el.querySelectorAll('#ed-iconos-super .btn-icono').forEach(b => b.classList.remove('activo'));
            btn.classList.add('activo');
        };
    });

    // Nombre de pasillos
    el.querySelectorAll('.input-pasillo-nombre').forEach((inp, i) => {
        inp.oninput = () => { pasillos[i].nombre = inp.value; };
    });

    // Iconos de pasillo
    el.querySelectorAll('.ed-iconos-pasillo .btn-icono').forEach(btn => {
        btn.onclick = () => {
            const idx = parseInt(btn.dataset.idx);
            const ic = btn.dataset.icono;
            if (!pasillos[idx].iconos) pasillos[idx].iconos = [];
            const has = pasillos[idx].iconos.includes(ic);
            if (has) {
                pasillos[idx].iconos = pasillos[idx].iconos.filter(x => x !== ic);
            } else if (pasillos[idx].iconos.length < 3) {
                pasillos[idx].iconos.push(ic);
            }
            btn.classList.toggle('activo', pasillos[idx].iconos.includes(ic));
        };
    });

    // Borrar pasillo
    el.querySelectorAll('.btn-del-pasillo').forEach(btn => {
        btn.onclick = () => {
            pasillos.splice(parseInt(btn.dataset.idx), 1);
            pasillos.forEach((p,i) => { p.id = i+1; });
            setPasillos(pasillos);
        };
    });

    // Añadir pasillo
    document.getElementById('ed-add-pasillo').onclick = () => {
        pasillos.push({ id: pasillos.length+1, nombre: '', iconos: [] });
        setPasillos(pasillos);
    };

    // Guardar
    document.getElementById('ed-guardar').onclick = async () => {
        const nombre = document.getElementById('ed-nombre').value.trim();
        const err = document.getElementById('ed-error');
        if (!nombre) { err.textContent = 'Escribe un nombre.'; return; }
        if (pasillos.length === 0) { err.textContent = 'Añade al menos un pasillo.'; return; }
        const pasillosLimpios = pasillos.map((p,i) => ({
            id: i+1, nombre: p.nombre || 'Pasillo '+(i+1), iconos: p.iconos||[]
        }));
        const icono = el.querySelector('#ed-iconos-super .btn-icono.activo')?.dataset.icono || '🛒';
        try {
            await onGuardar({ nombre, icono, pasillos: pasillosLimpios });
            _hide();
        } catch(e) { err.textContent = 'Error: ' + e.message; }
    };
}

// ── BÚSQUEDA COMUNIDAD ──────────────────────────────────────────────────────────

function _mostrarBusquedaComunidad(familiaID, onCambio, supers) {
    const el = _card();
    el.innerHTML = `
        <div class="gsup-header">
            <button class="gsup-back" id="com-back">← Volver</button>
            <h2>Comunidad</h2>
        </div>
        <p class="ed-hint">Supermercados publicados por otros usuarios. Copialos a tu familia.</p>
        <div class="com-search-row">
            <input class="ed-input" id="com-search" placeholder="Buscar por nombre...">
            <button class="btn-accion-gsup btn-gsup-secondary" id="com-buscar">Buscar</button>
        </div>
        <div id="com-resultados" class="com-resultados">
            <p class="gsup-vacio">Escribe para buscar o deja vacío para ver los más usados.</p>
        </div>`;
    _show(el);

    document.getElementById('com-back').onclick = () =>
        mostrarGestorSupermercados(familiaID, supers, onCambio);

    const buscar = async () => {
        const term = document.getElementById('com-search').value;
        const res = document.getElementById('com-resultados');
        res.innerHTML = '<p class="gsup-vacio">Buscando...</p>';
        try {
            const lista = await buscarSupermercadosComunidad(term);
            if (lista.length === 0) {
                res.innerHTML = '<p class="gsup-vacio">No se encontraron resultados.</p>';
                return;
            }
            res.innerHTML = lista.map(s => `
                <div class="com-item">
                    <span class="gsup-icono">${s.icono||'🏪'}</span>
                    <div class="gsup-info">
                        <span class="gsup-nombre">${s.nombre}</span>
                        <span class="gsup-pasillos">${(s.pasillos||[]).length} pasillos · ${s.usos||0} usos</span>
                    </div>
                    <button class="btn-accion-gsup btn-gsup-primary btn-com-copiar" data-id="${s.id}">Usar</button>
                </div>`).join('');

            res.querySelectorAll('.btn-com-copiar').forEach(btn => {
                btn.onclick = async () => {
                    btn.textContent = '...';
                    btn.disabled = true;
                    try {
                        await copiarSupermercadoDeComunidad(familiaID, btn.dataset.id);
                        await onCambio();
                        alert('Supermercado añadido a tu familia!');
                        mostrarGestorSupermercados(familiaID, await _getSupers(familiaID), onCambio);
                    } catch(e) { alert('Error: ' + e.message); btn.textContent = 'Usar'; btn.disabled = false; }
                };
            });
        } catch(e) {
            res.innerHTML = '<p class="gsup-vacio">Error al buscar: ' + e.message + '</p>';
        }
    };

    document.getElementById('com-buscar').onclick = buscar;
    document.getElementById('com-search').addEventListener('keydown', e => { if (e.key==='Enter') buscar(); });
    buscar(); // Cargar populares al abrir
}

// ── UTILS ────────────────────────────────────────────────────────────────────────

async function _getSupers(familiaID) {
    const { obtenerSupermercados } = await import('./db.js');
    return obtenerSupermercados(familiaID);
}

function _card() {
    _hide();
    const overlay = document.createElement('div');
    overlay.id = 'overlay-gestor';
    overlay.className = 'auth-overlay';
    const card = document.createElement('div');
    card.className = 'auth-card gestor-card';
    overlay.appendChild(card);
    overlay.addEventListener('click', e => { if (e.target===overlay) _hide(); });
    return card;
}

function _show(el) {
    _hide();
    if (el.classList.contains('auth-card')) {
        const overlay = el.parentElement || (() => {
            const o = document.createElement('div');
            o.id = 'overlay-gestor';
            o.className = 'auth-overlay';
            o.appendChild(el);
            o.addEventListener('click', e => { if(e.target===o) _hide(); });
            return o;
        })();
        document.body.appendChild(overlay);
    } else {
        document.body.appendChild(el);
    }
}

function _hide() {
    document.getElementById('overlay-gestor')?.remove();
}
