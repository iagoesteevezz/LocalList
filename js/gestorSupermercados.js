// js/gestorSupermercados.js
// UI para crear y editar supermercados con pasillos personalizados.

import { crearSupermercado, actualizarSupermercado, borrarSupermercado } from './db.js';

const ICONOS_SUPER = ['🛒','🏪','🏬','🥦','🧺','🏷️'];
const ICONOS_PASILLO = ['🍎','🥩','🥛','🍞','🧴','🧹','🍝','🥤','❄️','🍟','🥣','🍅','🥓','🍕'];

// Abre el gestor (lista de supermercados + botón crear)
export function mostrarGestorSupermercados(familiaID, supermercados, onCambio) {
    _limpiarOverlay();
    const overlay = _overlay();

    const lista = supermercados.map(s =>
        `<div class="gestor-super-item" data-id="${s.id}">
            <span class="gestor-super-icono">${s.icono || '🏪'}</span>
            <span class="gestor-super-nombre">${s.nombre}</span>
            <div class="gestor-super-acciones">
                <button class="btn-gestor-editar" data-id="${s.id}">Editar</button>
                <button class="btn-gestor-borrar" data-id="${s.id}">Borrar</button>
            </div>
        </div>`
    ).join('') || '<p class="gestor-vacio">No tienes supermercados. Crea uno!</p>';

    overlay.innerHTML = `<div class="auth-card gestor-card">
        <h2>Supermercados</h2>
        <div class="gestor-lista">${lista}</div>
        <button class="btn-auth btn-primary" id="btn-nuevo-super">+ Nuevo supermercado</button>
        <button class="btn-auth btn-link" id="btn-cerrar-gestor">Cerrar</button>
    </div>`;
    document.body.appendChild(overlay);

    document.getElementById('btn-cerrar-gestor').onclick = _limpiarOverlay;
    overlay.addEventListener('click', e => { if (e.target === overlay) _limpiarOverlay(); });

    document.getElementById('btn-nuevo-super').onclick = () => {
        _limpiarOverlay();
        mostrarEditorSupermercado(familiaID, null, async (datos) => {
            await crearSupermercado(familiaID, datos);
            onCambio();
        }, onCambio);
    };

    overlay.querySelectorAll('.btn-gestor-editar').forEach(btn => {
        btn.onclick = () => {
            const super_ = supermercados.find(s => s.id === btn.dataset.id);
            _limpiarOverlay();
            mostrarEditorSupermercado(familiaID, super_, async (datos) => {
                await actualizarSupermercado(familiaID, super_.id, datos);
                onCambio();
            }, onCambio);
        };
    });

    overlay.querySelectorAll('.btn-gestor-borrar').forEach(btn => {
        btn.onclick = async () => {
            const super_ = supermercados.find(s => s.id === btn.dataset.id);
            if (!confirm(`Borrar "${super_.nombre}"? Se perdera la configuracion de pasillos.`)) return;
            await borrarSupermercado(familiaID, btn.dataset.id);
            onCambio();
            _limpiarOverlay();
        };
    });
}

// Editor de un supermercado (nuevo o existente)
function mostrarEditorSupermercado(familiaID, super_, onGuardar, onVolver) {
    _limpiarOverlay();
    const overlay = _overlay();
    const esNuevo = !super_;

    // Estado local del editor
    let pasillos = super_?.pasillos ? JSON.parse(JSON.stringify(super_.pasillos)) : [];
    let iconoSeleccionado = super_?.icono || '🛒';

    function render() {
        overlay.innerHTML = `<div class="auth-card gestor-card">
            <h2>${esNuevo ? 'Nuevo supermercado' : 'Editar supermercado'}</h2>

            <label class="gestor-label">Nombre</label>
            <input type="text" id="editor-nombre" class="gestor-input"
                placeholder="Ej: Mercadona, Hiperdino..."
                value="${super_?.nombre || ''}">

            <label class="gestor-label">Icono</label>
            <div class="gestor-iconos-grid" id="iconos-super">
                ${ICONOS_SUPER.map(ic =>
                    `<button class="btn-icono${ic === iconoSeleccionado ? ' activo' : ''}" data-icono="${ic}">${ic}</button>`
                ).join('')}
            </div>

            <label class="gestor-label">Pasillos (${pasillos.length})</label>
            <div id="lista-pasillos-editor">
                ${pasillos.map((p, i) => _renderPasillo(p, i)).join('')}
            </div>
            <button class="btn-auth btn-secondary" id="btn-add-pasillo">+ Anadir pasillo</button>

            <div style="display:flex;gap:8px;margin-top:8px">
                <button class="btn-auth btn-primary" id="btn-guardar-super">Guardar</button>
                <button class="btn-auth btn-link" id="btn-volver-editor">Volver</button>
            </div>
            <p class="auth-error" id="editor-error"></p>
        </div>`;
        document.body.appendChild(overlay);
        _bindEditorEvents();
    }

    function _renderPasillo(p, i) {
        return `<div class="editor-pasillo-item" data-idx="${i}">
            <div class="editor-pasillo-row">
                <input type="text" class="gestor-input input-pasillo-nombre"
                    placeholder="Nombre del pasillo" value="${p.nombre || ''}">
                <button class="btn-borrar-pasillo" data-idx="${i}">x</button>
            </div>
            <div class="gestor-iconos-grid iconos-pasillo">
                ${ICONOS_PASILLO.map(ic =>
                    `<button class="btn-icono btn-icono--sm${(p.iconos||[]).includes(ic) ? ' activo' : ''}"
                        data-icono="${ic}" data-idx="${i}">${ic}</button>`
                ).join('')}
            </div>
        </div>`;
    }

    function _bindEditorEvents() {
        // Seleccion de icono del super
        overlay.querySelectorAll('#iconos-super .btn-icono').forEach(btn => {
            btn.onclick = () => {
                iconoSeleccionado = btn.dataset.icono;
                overlay.querySelectorAll('#iconos-super .btn-icono').forEach(b => b.classList.remove('activo'));
                btn.classList.add('activo');
            };
        });

        // Nombres de pasillos
        overlay.querySelectorAll('.input-pasillo-nombre').forEach((input, i) => {
            input.oninput = () => { pasillos[i].nombre = input.value; };
        });

        // Iconos de pasillo (toggle)
        overlay.querySelectorAll('.iconos-pasillo .btn-icono').forEach(btn => {
            btn.onclick = () => {
                const idx = parseInt(btn.dataset.idx);
                const ic = btn.dataset.icono;
                const iconos = pasillos[idx].iconos || [];
                if (iconos.includes(ic)) {
                    pasillos[idx].iconos = iconos.filter(x => x !== ic);
                } else if (iconos.length < 3) {
                    pasillos[idx].iconos = [...iconos, ic];
                }
                btn.classList.toggle('activo', pasillos[idx].iconos.includes(ic));
            };
        });

        // Borrar pasillo
        overlay.querySelectorAll('.btn-borrar-pasillo').forEach(btn => {
            btn.onclick = () => {
                pasillos.splice(parseInt(btn.dataset.idx), 1);
                // Re-asignar IDs secuenciales
                pasillos.forEach((p, i) => { p.id = i + 1; });
                render();
            };
        });

        // Anadir pasillo
        document.getElementById('btn-add-pasillo').onclick = () => {
            pasillos.push({ id: pasillos.length + 1, nombre: '', iconos: [] });
            render();
        };

        // Guardar
        document.getElementById('btn-guardar-super').onclick = async () => {
            const nombre = document.getElementById('editor-nombre').value.trim();
            if (!nombre) { document.getElementById('editor-error').textContent = 'Escribe un nombre.'; return; }
            if (pasillos.length === 0) { document.getElementById('editor-error').textContent = 'Anade al menos un pasillo.'; return; }

            // Asegurar IDs y nombres
            const pasillosLimpios = pasillos.map((p, i) => ({
                id: i + 1,
                nombre: p.nombre || `Pasillo ${i + 1}`,
                iconos: p.iconos || []
            }));

            await onGuardar({ nombre, icono: iconoSeleccionado, pasillos: pasillosLimpios });
            _limpiarOverlay();
        };

        document.getElementById('btn-volver-editor').onclick = () => {
            _limpiarOverlay();
            onVolver();
        };
    }

    render();
}

function _overlay() {
    const el = document.createElement('div');
    el.id = 'overlay-gestor';
    el.className = 'auth-overlay';
    return el;
}

function _limpiarOverlay() {
    document.getElementById('overlay-gestor')?.remove();
}
