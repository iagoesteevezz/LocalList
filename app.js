import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc, updateDoc, arrayUnion, arrayRemove } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDPb6Ira09z5sUQ4AtD6uyibVKQsQshGgc",
    authDomain: "locallist-18b64.firebaseapp.com",
    projectId: "locallist-18b64",
    storageBucket: "locallist-18b64.firebasestorage.app",
    messagingSenderId: "951724832714",
    appId: "1:951724832714:web:052af9aa9bfcf3c054c133"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const docRef = doc(db, "supermercados", "mercadona_cruce");

const ESTRUCTURA_PASILLOS = [
    { id: 1, nombre: "1. Frutas /verduras / congelados", iconos: ["🍎", "❄️"] },
    { id: 2, nombre: "2. Carnes / embutidos / Arroz / Latas", iconos: ["🥩", "🥓"] },
    { id: 3, nombre: "3. Salsas / Pasta / Frutos secos ", iconos: ["🍝", "🍅"] },
    { id: 4, nombre: "4. Nevera / bebidas", iconos: ["🥛", "🥤"] },
    { id: 5, nombre: "5. Precocinados / papas", iconos: ["🍟", "🍕"] },
    { id: 6, nombre: "6. Cereales / Leche / Cuidado", iconos: ["🥣", "🧴"] },
    { id: 7, nombre: "7. Pan / galletas / café / limpieza", iconos: ["🍞", "🧹"] }
];

let datosFirebase = {}; 
const containerHTML = document.getElementById('supermercado-container');

// 2. FUNCIÓN PARA AÑADIR PRODUCTO 
async function agregarProducto(idPasillo, nombreProducto) {
    const nombreLimpio = nombreProducto.trim();
    if (!nombreLimpio) return;

    // 1. Buscamos si el producto ya existe en algún pasillo
    let pasilloDondeExiste = null;

    for (const pasillo of ESTRUCTURA_PASILLOS) {
        const productosEnPasillo = datosFirebase[`productos_p${pasillo.id}`] || [];
        
        // Comprobamos si existe
        const existe = productosEnPasillo.some(
            prod => prod.toLowerCase() === nombreLimpio.toLowerCase()
        );

        if (existe) {
            pasilloDondeExiste = pasillo.nombre;
            break; // Si lo encuentra, paramos de buscar
        }
    }

    // 2. Si ya existe, lanzamos un aviso y CANCELAMOS el guardado
    if (pasilloDondeExiste) {
        mostrarAlertaDuplicado(nombreLimpio, pasilloDondeExiste);
        return; 
    }

    // 3. Si no existe en ningún lado, lo guardamos en Firebase con normalidad
    const campo = `productos_p${idPasillo}`;
    await setDoc(docRef, { [campo]: arrayUnion(nombreLimpio) }, { merge: true });
}

async function borrarProducto(idPasillo, nombreProducto) {
    const campo = `productos_p${idPasillo}`;
    await updateDoc(docRef, { [campo]: arrayRemove(nombreProducto) });
}

async function toggleTachado(nombreProducto) {
    const nuevoEstado = !datosFirebase[`tachado_${nombreProducto}`];
    await setDoc(docRef, { [`tachado_${nombreProducto}`]: nuevoEstado }, { merge: true });
}

async function cambiarCantidad(nombreProducto, incremento) {
    const cantidadActual = datosFirebase[`cantidad_${nombreProducto}`] || 1;
    let nuevaCantidad = cantidadActual + incremento;
    if (nuevaCantidad < 1) nuevaCantidad = 1;
    await setDoc(docRef, { [`cantidad_${nombreProducto}`]: nuevaCantidad }, { merge: true });
}

function renderizarLista() {
    containerHTML.innerHTML = '';

    ESTRUCTURA_PASILLOS.forEach(pasillo => {
        const divPasillo = document.createElement('div');
        divPasillo.className = 'pasillo';
        divPasillo.id = `pasillo-html-${pasillo.id}`;

        const productosArr = datosFirebase[`productos_p${pasillo.id}`] || [];
        const numPendientes = productosArr.filter(prod => !datosFirebase[`tachado_${prod}`]).length;

        const header = document.createElement('div');
        header.className = 'pasillo-header';
        header.innerHTML = `
            <span>${pasillo.nombre}</span>
            <span class="contador-pasillo">${numPendientes}</span>
        `;
        divPasillo.appendChild(header);

        const editor = document.createElement('div');
        editor.className = 'editor-pasillo';
        const input = document.createElement('input');
        input.placeholder = "Añadir a este pasillo...";
        const btnAdd = document.createElement('button');
        btnAdd.textContent = "+";
        btnAdd.onclick = () => {
            agregarProducto(pasillo.id, input.value);
            input.value = '';
        };
        editor.appendChild(input);
        editor.appendChild(btnAdd);
        divPasillo.appendChild(editor);

        const pendientes = productosArr.filter(prod => !datosFirebase[`tachado_${prod}`]);
        const comprados = productosArr.filter(prod => datosFirebase[`tachado_${prod}`]);
        const productosOrdenados = [...pendientes, ...comprados];

        const listaContenedor = document.createElement('div');
        listaContenedor.className = 'contenedor-sortable';

        productosOrdenados.forEach(prod => {
            const divProd = document.createElement('div');
            divProd.className = 'producto';
            
            divProd.dataset.nombre = prod; 
            
            if (datosFirebase[`tachado_${prod}`]) divProd.classList.add('comprado');

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

            divProd.querySelector('.nombre-prod').onclick = () => toggleTachado(prod);
            divProd.querySelector('.checkbox').onclick = () => toggleTachado(prod);
            
            divProd.querySelector('.btn-restar').onclick = (e) => {
                e.stopPropagation();
                cambiarCantidad(prod, -1);
            };
            divProd.querySelector('.btn-sumar').onclick = (e) => {
                e.stopPropagation();
                cambiarCantidad(prod, 1);
            };

            divProd.querySelector('.btn-borrar').onclick = (e) => {
                e.stopPropagation();
                borrarProducto(pasillo.id, prod);
            };

            listaContenedor.appendChild(divProd);
        });

        divPasillo.appendChild(listaContenedor);
        containerHTML.appendChild(divPasillo);

        new Sortable(listaContenedor, {
            animation: 150, 
            delay: 300, 
            delayOnTouchOnly: true, 
            onEnd: async function () {

                const itemsEnPantalla = Array.from(listaContenedor.children);
                const nuevoOrdenNombres = itemsEnPantalla.map(item => item.dataset.nombre);

                const campo = `productos_p${pasillo.id}`;
                await setDoc(docRef, { [campo]: nuevoOrdenNombres }, { merge: true });
            }
        });
    });
}

onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
        datosFirebase = snapshot.data();
        renderizarLista();
        actualizarColores3D();
    } else {
        setDoc(docRef, {});
    }
});

function init3DMap() {
    const container = document.getElementById('mapa-3d-container');
    if(!container) return; 
    container.innerHTML = ''; 

    ESTRUCTURA_PASILLOS.forEach((pasillo, i) => {
        const wrapper = document.createElement('div');
        wrapper.className = 'pasillo-3d-wrapper';
        wrapper.id = `pasillo-3d-${pasillo.id}`;
        
        const posicionX = 15 + (i * 50); 
        wrapper.style.left = `${posicionX}px`;

        const bloque = document.createElement('div');
        bloque.className = 'bloque-pasillo';
        bloque.innerHTML = `<div class="numero-pasillo">${pasillo.id}</div>`;
        wrapper.appendChild(bloque);

        const iconosContainer = document.createElement('div');
        iconosContainer.className = 'iconos-container';
        
        pasillo.iconos.forEach(iconoEmoji => {
            const iconoSpan = document.createElement('span');
            iconoSpan.className = 'icono-3d';
            iconoSpan.textContent = iconoEmoji;
            iconosContainer.appendChild(iconoSpan);
        });
        
        wrapper.appendChild(iconosContainer);

        wrapper.onclick = () => {
            wrapper.classList.add('click-animado');
            
            setTimeout(() => {
                wrapper.classList.remove('click-animado');
            }, 300);

            const target = document.getElementById(`pasillo-html-${pasillo.id}`);
            if (target) {
                target.scrollIntoView({ behavior: 'smooth' });
            }
        };

        container.appendChild(wrapper);
    });
}

function actualizarColores3D() {
    ESTRUCTURA_PASILLOS.forEach(pasillo => {
        const productos = datosFirebase[`productos_p${pasillo.id}`] || [];
        const tienePendientes = productos.some(p => !datosFirebase[`tachado_${p}`]);
        
        const wrapperElement = document.getElementById(`pasillo-3d-${pasillo.id}`);
        if (wrapperElement) {
            if (tienePendientes) {
                wrapperElement.classList.add('con-pendientes');
            } else {
                wrapperElement.classList.remove('con-pendientes');
            }
        }
    });
}

init3DMap();

function crearPopupAyuda() {
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
    
    window.addEventListener('click', (e) => { 
        if (e.target === modal) modal.className = 'popup-oculto'; 
    });
}

// 9. POPUP DE ALERTA (Duplicados)
function crearPopupAlerta() {
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
    window.addEventListener('click', (e) => { 
        if (e.target === modal) modal.className = 'popup-oculto'; 
    });
}

function mostrarAlertaDuplicado(producto, pasillo) {
    const modal = document.getElementById('popup-alerta');
    const mensaje = document.getElementById('alerta-mensaje');
    
    mensaje.innerHTML = `¡Espera!<br><br>El producto <strong>"${producto}"</strong> ya está en la lista.<br><br>Lo tienes en:<br> <strong>${pasillo}</strong>`;
    modal.className = 'popup-visible';
}


function configurarMenuYModoOscuro() {
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
        if (e.target !== btnMenu && e.target !== menuDesplegable) {
            menuDesplegable.classList.remove('visible');
        }
    });

    document.getElementById('opcion-ayuda').onclick = () => {
        document.getElementById('popup-ayuda').className = 'popup-visible';
        menuDesplegable.classList.remove('visible'); 
    };

    // LÓGICA DEL MODO OSCURO
    const btnOscuro = document.getElementById('opcion-oscuro');
    
    if (localStorage.getItem('temaPreferido') === 'oscuro') {
        document.body.classList.add('dark-mode');
        btnOscuro.innerHTML = '☀️ Modo Claro';
    }

    btnOscuro.onclick = () => {
        document.body.classList.toggle('dark-mode'); 
        
        if (document.body.classList.contains('dark-mode')) {
            localStorage.setItem('temaPreferido', 'oscuro');
            btnOscuro.innerHTML = '☀️ Modo Claro';
        } else {
            localStorage.setItem('temaPreferido', 'claro');
            btnOscuro.innerHTML = '🌙 Modo Oscuro';
        }
        menuDesplegable.classList.remove('visible'); 
    };
}


crearPopupAyuda();
crearPopupAlerta();
configurarMenuYModoOscuro();