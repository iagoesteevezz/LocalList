// Preferencias de este móvil (no de la familia). localStorage puede fallar
// (modo privado, almacenamiento lleno): nunca debe romper la app.

const LAST_STORE = 'localist.lastStore';

export function getLastStore(): string | null {
  try {
    return localStorage.getItem(LAST_STORE);
  } catch {
    return null;
  }
}

export function setLastStore(storeId: string) {
  try {
    localStorage.setItem(LAST_STORE, storeId);
  } catch {
    // sin preferencias: se volverá a preguntar, nada más
  }
}
