// 1. Importamos las herramientas de Firebase
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

// 1. LOS 7 PASILLOS REALES DE TU NOTA
const ESTRUCTURA_PASILLOS = [
    { id: 1, nombre: "1. Frutas y congelados" },
    { id: 2, nombre: "2. Carnes y embutidos" },
    { id: 3, nombre: "3. Salsas y pasta" },
    { id: 4, nombre: "4. Lácteos y bebidas" },
    { id: 5, nombre: "5. Precocinados y papas" },
    { id: 6, nombre: "6. Desayunos y cuidado" },
    { id: 7, nombre: "7. Pan, galletas, café y limpieza" }
];

let datosFirebase = {}; 
const containerHTML = document.getElementById('supermercado-container');

// 2. FUNCIÓN PARA AÑADIR PRODUCTO (Lógica de Firebase)
async function agregarProducto(idPasillo, nombreProducto) {
    if (!nombreProducto.trim()) return;
    const campo = `productos_p${idPasillo}`;
    await setDoc(docRef, { [campo]: arrayUnion(nombreProducto) }, { merge: true });
}

// 3. FUNCIÓN PARA BORRAR PRODUCTO (Para editar el pasillo)
async function borrarProducto(idPasillo, nombreProducto) {
    const campo = `productos_p${idPasillo}`;
    await updateDoc(docRef, { [campo]: arrayRemove(nombreProducto) });
}

// 4. FUNCIÓN PARA MARCAR/DESMARCAR (Tachar)
async function toggleTachado(nombreProducto) {
    const nuevoEstado = !datosFirebase[`tachado_${nombreProducto}`];
    await setDoc(docRef, { [`tachado_${nombreProducto}`]: nuevoEstado }, { merge: true });
}

// 5. RENDERIZAR LA LISTA DINÁMICA
function renderizarLista() {
    containerHTML.innerHTML = '';

    ESTRUCTURA_PASILLOS.forEach(pasillo => {
        const divPasillo = document.createElement('div');
        divPasillo.className = 'pasillo';
        divPasillo.id = `pasillo-html-${pasillo.id}`;

        const header = document.createElement('div');
        header.className = 'pasillo-header';
        header.textContent = pasillo.nombre;
        divPasillo.appendChild(header);

        // -- EDITOR: Cuadro para añadir productos --
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

        // -- LISTA DE PRODUCTOS DEL PASILLO --
        const productosArr = datosFirebase[`productos_p${pasillo.id}`] || [];
        productosArr.forEach(prod => {
            const divProd = document.createElement('div');
            divProd.className = 'producto';
            if (datosFirebase[`tachado_${prod}`]) divProd.classList.add('comprado');

            divProd.innerHTML = `
                <div class="checkbox"></div>
                <span style="flex:1">${prod}</span>
                <span class="btn-borrar">×</span>
            `;

            // Clic en el nombre/check para tachar
            divProd.querySelector('span').onclick = () => toggleTachado(prod);
            divProd.querySelector('.checkbox').onclick = () => toggleTachado(prod);
            
            // Clic en la X para eliminar del inventario (Editar pasillo)
            divProd.querySelector('.btn-borrar').onclick = (e) => {
                e.stopPropagation();
                borrarProducto(pasillo.id, prod);
            };

            divPasillo.appendChild(divProd);
        });

        containerHTML.appendChild(divPasillo);
    });
}

// 6. ESCUCHA EN TIEMPO REAL
onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
        datosFirebase = snapshot.data();
        renderizarLista();
        actualizarColores3D(); // Función que crearemos abajo
    } else {
        setDoc(docRef, {});
    }
});

// ==========================================
// 7. MAPA 3D CON INTERACTIVIDAD
// ==========================================
let scene, camera, renderer, raycaster, mouse;
const pasillos3D = [];

function init3DMap() {
    const container = document.getElementById('mapa-3d-container');
    
    container.innerHTML = ''; 
    pasillos3D.length = 0; 

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f4f9);
    
    camera = new THREE.PerspectiveCamera(45, container.clientWidth / container.clientHeight, 1, 1000);
    camera.position.set(0, 45, 0); // Cámara arriba mirando hacia abajo
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    container.appendChild(renderer.domElement);

    const light = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(light);

    // DIBUJAR LOS PASILLOS
    // Ahora son estrechos de ancho (3), bajitos (0.5) y largos en profundidad (16)
    const geometry = new THREE.BoxGeometry(3, 0.5, 16); 
    
    ESTRUCTURA_PASILLOS.forEach((p, i) => {
        const material = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });
        const mesh = new THREE.Mesh(geometry, material);
        
        // ¡EL CAMBIO CLAVE!: Distribuidos de Izquierda a Derecha (Eje X)
        // Empezamos en -12 y sumamos 4 por cada pasillo para dejar un hueco entre ellos
        mesh.position.x = -15 + (i * 5); 
        mesh.position.z = 0; // Todos a la misma altura vertical
        mesh.position.y = 0; // Pegados al suelo
        
        mesh.userData.id = p.id;
        scene.add(mesh);
        pasillos3D.push(mesh);
    });

    // --- CLIC EN EL MAPA 3D PARA HACER SCROLL ---
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();

    container.addEventListener('click', (event) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(pasillos3D);

        if (intersects.length > 0) {
            const id = intersects[0].object.userData.id;
            document.getElementById(`pasillo-html-${id}`).scrollIntoView({ behavior: 'smooth' });
        }
    });

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();
}

// Función para poner en VERDE los pasillos que tienen cosas pendientes
function actualizarColores3D() {
    pasillos3D.forEach(mesh => {
        const id = mesh.userData.id;
        const productos = datosFirebase[`productos_p${id}`] || [];
        // Miramos si hay al menos un producto en este pasillo que NO esté tachado
        const tienePendientes = productos.some(p => !datosFirebase[`tachado_${p}`]);
        
        mesh.material.color.setHex(tienePendientes ? 0x008000 : 0xaaaaaa);
    });
}

init3DMap();