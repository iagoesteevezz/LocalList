// Inicialización de Firebase (proyecto localist-v2).
//
// La configuración web NO es secreta: identifica el proyecto y viaja en la
// web de todas formas. Lo que protege los datos son las reglas de Firestore
// (firebase/firestore.rules) y la restricción de la API key por dominio en
// Google Cloud.

import { initializeApp } from 'firebase/app';
import {
  connectAuthEmulator,
  indexedDBLocalPersistence,
  initializeAuth,
} from 'firebase/auth';
import {
  connectFirestoreEmulator,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: 'AIzaSyCY1hnRzDJq5h3woPOMF30duZO7THvHQaM',
  authDomain: 'localist-v2.firebaseapp.com',
  projectId: 'localist-v2',
  storageBucket: 'localist-v2.firebasestorage.app',
  messagingSenderId: '556841476160',
  appId: '1:556841476160:web:6e7973d63c4c4ac84fffa5',
};

/** `npm run dev:emu`: todo contra los emuladores locales, sin tocar datos reales. */
const useEmulators = import.meta.env.VITE_FIREBASE_EMULATORS === '1';

export const app = initializeApp(
  useEmulators ? { ...firebaseConfig, projectId: 'demo-localist' } : firebaseConfig,
);

// initializeAuth (y no getAuth) para no cargar el código de popups/redirect,
// que no usamos. La sesión anónima se guarda en IndexedDB.
export const auth = initializeAuth(app, { persistence: indexedDBLocalPersistence });

// Caché persistente: la app muestra la lista y acepta cambios sin conexión.
// MultipleTab: varias pestañas abiertas comparten la misma caché.
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});

if (useEmulators) {
  connectAuthEmulator(auth, 'http://127.0.0.1:9099', { disableWarnings: true });
  connectFirestoreEmulator(db, '127.0.0.1', 8080);
}
