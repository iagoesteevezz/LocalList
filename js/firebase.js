// js/firebase.js
// Inicialización de Firebase. Exporta `app` y `db`.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.11.1/firebase-app.js";
import {
    initializeFirestore,
    persistentLocalCache
} from "https://www.gstatic.com/firebasejs/10.11.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDPb6Ira09z5sUQ4AtD6uyibVKQsQshGgc",
    authDomain: "locallist-18b64.firebaseapp.com",
    projectId: "locallist-18b64",
    storageBucket: "locallist-18b64.firebasestorage.app",
    messagingSenderId: "951724832714",
    appId: "1:951724832714:web:052af9aa9bfcf3c054c133"
};

export const app = initializeApp(firebaseConfig);
export const db = initializeFirestore(app, {
    localCache: persistentLocalCache()
});
