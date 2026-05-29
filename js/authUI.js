// js/authUI.js
// Renderiza las pantallas de login, registro, crear familia y unirse a familia.

import {
    loginConGoogle,
    loginConEmail,
    registrarConEmail,
    crearFamilia,
    unirseAFamilia
} from './auth.js';

// ─── PANTALLA DE LOGIN ────────────────────────────────────────────────────────

export function mostrarPantallaLogin(onSuccess) {
    const overlay = _crearOverlay('login');
    overlay.innerHTML = `
        <div class="auth-card">
            <img src="Localist logo-No Bg.png" alt="LocaLisT" class="auth-logo">
            <h2>Bienvenido a LocaLisT</h2>
            <p class="auth-subtitle">La lista de la compra familiar</p>

            <button class="btn-auth btn-google" id="btn-google">
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.8 13.5-4.7l-6.2-5.2C29.3 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7L6.1 34c3.3 6.4 10 10 17.9 10z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.2 5.2C41 35.1 44 30 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
                Continuar con Google
            </button>

            <div class="auth-divider"><span>o</span></div>

            <div id="auth-form-area">
                <input type="email" id="auth-email" placeholder="Correo electrónico" autocomplete="email">
                <input type="password" id="auth-password" placeholder="Contraseña" autocomplete="current-password">
                <button class="btn-auth btn-primary" id="btn-login-email">Entrar</button>
                <button class="btn-auth btn-link" id="btn-ir-registro">¿No tienes cuenta? Regístrate</button>
            </div>

            <p class="auth-error" id="auth-error"></p>
        </div>
    `;

    document.body.appendChild(overlay);
    _configurarLoginHandlers(overlay, onSuccess);
}

function _configurarLoginHandlers(overlay, onSuccess) {
    const mostrarError = (msg) => {
        document.getElementById('auth-error').textContent = msg;
    };

    document.getElementById('btn-google').onclick = async () => {
        try {
            const user = await loginConGoogle();
            overlay.remove();
            onSuccess(user);
        } catch (e) {
            mostrarError('Error con Google: ' + e.message);
        }
    };

    document.getElementById('btn-login-email').onclick = async () => {
        const email = document.getElementById('auth-email').value.trim();
        const pass = document.getElementById('auth-password').value;
        if (!email || !pass) { mostrarError('Rellena email y contraseña.'); return; }
        try {
            const user = await loginConEmail(email, pass);
            overlay.remove();
            onSuccess(user);
        } catch (e) {
            mostrarError('Email o contraseña incorrectos.');
        }
    };

    document.getElementById('btn-ir-registro').onclick = () => {
        overlay.remove();
        mostrarPantallaRegistro(onSuccess);
    };
}

// ─── PANTALLA DE REGISTRO ─────────────────────────────────────────────────────

function mostrarPantallaRegistro(onSuccess) {
    const overlay = _crearOverlay('registro');
    overlay.innerHTML = `
        <div class="auth-card">
            <img src="Localist logo-No Bg.png" alt="LocaLisT" class="auth-logo">
            <h2>Crear cuenta</h2>

            <button class="btn-auth btn-google" id="btn-google-reg">
                <svg width="18" height="18" viewBox="0 0 48 48"><path fill="#FFC107" d="M43.6 20H24v8h11.3C33.7 33.1 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20c11 0 19.7-8 19.7-20 0-1.3-.1-2.7-.1-4z"/><path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3 0 5.7 1.1 7.8 2.9l5.7-5.7C34.1 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/><path fill="#4CAF50" d="M24 44c5.2 0 9.9-1.8 13.5-4.7l-6.2-5.2C29.3 35.6 26.8 36 24 36c-5.2 0-9.6-2.9-11.3-7L6.1 34c3.3 6.4 10 10 17.9 10z"/><path fill="#1976D2" d="M43.6 20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.2 5.2C41 35.1 44 30 44 24c0-1.3-.1-2.7-.4-4z"/></svg>
                Registrarse con Google
            </button>

            <div class="auth-divider"><span>o</span></div>

            <input type="text" id="reg-nombre" placeholder="Tu nombre" autocomplete="name">
            <input type="email" id="reg-email" placeholder="Correo electrónico" autocomplete="email">
            <input type="password" id="reg-password" placeholder="Contraseña (mínimo 6 caracteres)" autocomplete="new-password">
            <button class="btn-auth btn-primary" id="btn-crear-cuenta">Crear cuenta</button>
            <button class="btn-auth btn-link" id="btn-ir-login">¿Ya tienes cuenta? Entra aquí</button>

            <p class="auth-error" id="auth-error"></p>
        </div>
    `;

    document.body.appendChild(overlay);

    const mostrarError = (msg) => { document.getElementById('auth-error').textContent = msg; };

    document.getElementById('btn-google-reg').onclick = async () => {
        try {
            const user = await loginConGoogle();
            overlay.remove();
            onSuccess(user);
        } catch (e) {
            mostrarError('Error con Google: ' + e.message);
        }
    };

    document.getElementById('btn-crear-cuenta').onclick = async () => {
        const nombre = document.getElementById('reg-nombre').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const pass = document.getElementById('reg-password').value;
        if (!email || !pass) { mostrarError('Rellena todos los campos.'); return; }
        if (pass.length < 6) { mostrarError('La contraseña debe tener al menos 6 caracteres.'); return; }
        try {
            const user = await registrarConEmail(email, pass, nombre);
            overlay.remove();
            onSuccess(user);
        } catch (e) {
            mostrarError('Error al registrarse: ' + e.message);
        }
    };

    document.getElementById('btn-ir-login').onclick = () => {
        overlay.remove();
        mostrarPantallaLogin(onSuccess);
    };
}

// ─── PANTALLA DE FAMILIA ──────────────────────────────────────────────────────

export function mostrarPantallaFamilia(user, onFamiliaLista) {
    const overlay = _crearOverlay('familia');
    overlay.innerHTML = `
        <div class="auth-card">
            <img src="Localist logo-No Bg.png" alt="LocaLisT" class="auth-logo">
            <h2>¡Hola, ${user.displayName || 'bienvenido'}!</h2>
            <p class="auth-subtitle">Únete a tu familia para empezar</p>

            <button class="btn-auth btn-primary" id="btn-crear-familia">
                🏠 Crear una familia nueva
            </button>

            <div class="auth-divider"><span>o</span></div>

            <p style="margin:0 0 8px; font-size:0.9rem; color: var(--color-texto-suave)">
                ¿Tienes un código? Introdúcelo aquí:
            </p>
            <input type="text" id="input-codigo" placeholder="Ej: ABC123"
                maxlength="6" style="text-transform:uppercase; letter-spacing:4px; font-size:1.2rem; text-align:center">
            <button class="btn-auth btn-secondary" id="btn-unirse-familia">
                🔗 Unirse con código
            </button>

            <p class="auth-error" id="familia-error"></p>
        </div>
    `;

    document.body.appendChild(overlay);

    const mostrarError = (msg) => { document.getElementById('familia-error').textContent = msg; };

    document.getElementById('btn-crear-familia').onclick = async () => {
        const nombre = prompt('¿Cómo se llama tu familia? (Ej: Familia García)');
        if (!nombre?.trim()) return;
        try {
            const { familiaID, codigo } = await crearFamilia(user, nombre.trim());
            overlay.remove();
            mostrarCodigoFamilia(codigo, () => onFamiliaLista(familiaID));
        } catch (e) {
            mostrarError('Error al crear familia: ' + e.message);
        }
    };

    document.getElementById('btn-unirse-familia').onclick = async () => {
        const codigo = document.getElementById('input-codigo').value.trim();
        if (codigo.length !== 6) { mostrarError('El código debe tener 6 caracteres.'); return; }
        try {
            const familiaID = await unirseAFamilia(user, codigo);
            overlay.remove();
            onFamiliaLista(familiaID);
        } catch (e) {
            mostrarError(e.message);
        }
    };
}

// ─── POPUP CÓDIGO CREADO ──────────────────────────────────────────────────────

function mostrarCodigoFamilia(codigo, onContinuar) {
    const overlay = _crearOverlay('codigo');
    overlay.innerHTML = `
        <div class="auth-card auth-card--codigo">
            <div class="codigo-icono">🎉</div>
            <h2>¡Familia creada!</h2>
            <p>Comparte este código con tu familia para que puedan unirse:</p>
            <div class="codigo-display" id="codigo-display">${codigo}</div>
            <button class="btn-auth btn-link btn-copiar" id="btn-copiar">📋 Copiar código</button>
            <p class="auth-subtitle" style="font-size:0.8rem">
                También lo encontrarás en el menú de la app cuando lo necesites.
            </p>
            <button class="btn-auth btn-primary" id="btn-continuar-codigo">Empezar a usar LocaLisT →</button>
        </div>
    `;
    document.body.appendChild(overlay);

    document.getElementById('btn-copiar').onclick = () => {
        navigator.clipboard.writeText(codigo).then(() => {
            document.getElementById('btn-copiar').textContent = '✅ Copiado';
        });
    };

    document.getElementById('btn-continuar-codigo').onclick = () => {
        overlay.remove();
        onContinuar();
    };
}

// ─── UTILS ────────────────────────────────────────────────────────────────────

function _crearOverlay(id) {
    const existing = document.getElementById(`auth-overlay-${id}`);
    if (existing) existing.remove();

    const overlay = document.createElement('div');
    overlay.id = `auth-overlay-${id}`;
    overlay.className = 'auth-overlay';
    return overlay;
}
