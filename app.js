// 1. Importamos las herramientas de Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import { getFirestore, doc, onSnapshot, setDoc } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

// 2. Tu configuración exacta de Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDPb6Ira09z5sUQ4AtD6uyibVKQsQshGgc",
  authDomain: "locallist-18b64.firebaseapp.com",
  projectId: "locallist-18b64",
  storageBucket: "locallist-18b64.firebasestorage.app",
  messagingSenderId: "951724832714",
  appId: "1:951724832714:web:052af9aa9bfcf3c054c133"
};

// 3. Inicializamos la conexión
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Esta es la "carpeta" y el "archivo" en la nube donde guardaremos los ticks
const docRef = doc(db, "listas", "mercadona_cruce");

// 4. Datos del Supermercado
const mercadonaMelenara = [
    { id: 1, nombre: "Frutas y Verduras", productos: ["Plátanos", "Tomates"] },
    { id: 2, nombre: "Pasillo 1: Carnicería", productos: ["Pollo", "Jamón"] },
    { id: 3, nombre: "Pasillo 2: Lácteos", productos: ["Leche", "Huevos"] },
    { id: 4, nombre: "Zona Final: Congelados", productos: ["Pizzas", "Hielo"] }
];

// Aquí guardaremos en memoria lo que nos diga Firebase que está comprado
let estadoProductos = {};
const containerHTML = document.getElementById('supermercado-container');

// 5. Función para pintar la lista
function renderizarListaHTML() {
    containerHTML.innerHTML = '';

    mercadonaMelenara.forEach(pasillo => {
        const divPasillo = document.createElement('div');
        divPasillo.className = 'pasillo';
        
        // ID para poder hacer scroll automático desde el 3D en el futuro
        divPasillo.id = `pasillo-html-${pasillo.id}`; 

        const headerPasillo = document.createElement('div');
        headerPasillo.className = 'pasillo-header';
        headerPasillo.textContent = pasillo.nombre;
        divPasillo.appendChild(headerPasillo);

        pasillo.productos.forEach(producto => {
            const divProducto = document.createElement('div');
            divProducto.className = 'producto';
            
            // ¡MAGIA! Miramos si el producto está marcado como 'true' en Firebase
            if (estadoProductos[producto] === true) {
                divProducto.classList.add('comprado');
            }

            // Al hacer clic, enviamos el nuevo estado a Firebase
            divProducto.onclick = () => {
                const nuevoEstado = !estadoProductos[producto]; // Cambiamos de true a false o viceversa
                
                // setDoc actualiza la base de datos (merge: true es para no borrar el resto de productos)
                setDoc(docRef, { [producto]: nuevoEstado }, { merge: true });
            };

            const divCheckbox = document.createElement('div');
            divCheckbox.className = 'checkbox';

            const spanNombre = document.createElement('span');
            spanNombre.textContent = producto;

            divProducto.appendChild(divCheckbox);
            divProducto.appendChild(spanNombre);
            divPasillo.appendChild(divProducto);
        });

        containerHTML.appendChild(divPasillo);
    });
}

onSnapshot(docRef, (snapshot) => {
    if (snapshot.exists()) {
        estadoProductos = snapshot.data(); 
    } else {

        setDoc(docRef, {});
    }
    renderizarListaHTML();
});


let scene, camera, renderer;
const pasillos3D = [];

function init3DMap() {
    const container = document.getElementById('mapa-3d-container');
    const width = container.clientWidth;
    const height = container.clientHeight;

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf4f4f9);

    camera = new THREE.PerspectiveCamera(45, width / height, 1, 1000);
    camera.position.set(20, 20, 20); 
    camera.lookAt(0, 0, 0);

    renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 20, 10);
    scene.add(directionalLight);

    const floorGeometry = new THREE.PlaneGeometry(30, 30);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xdddddd });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -0.5;
    scene.add(floor);

    const geometryPasillo = new THREE.BoxGeometry(2, 2, 8);
    const materialGris = new THREE.MeshLambertMaterial({ color: 0xaaaaaa });

    mercadonaMelenara.forEach((pasilloData, index) => {
        const pasilloMesh = new THREE.Mesh(geometryPasillo, materialGris.clone());
        pasilloMesh.position.x = -10 + (index * 6);
        pasilloMesh.position.z = 0;
        pasilloMesh.userData.idDatos = pasilloData.id; 
        scene.add(pasilloMesh);
        pasillos3D.push(pasilloMesh);
    });

    function animate() {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', onWindowResize, false);
    function onWindowResize(){
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }
}

// Arrancamos el 3D (La lista se arranca sola desde el onSnapshot de Firebase)
init3DMap();