import { useSyncExternalStore } from 'react';

// navigator.onLine solo indica si hay red, no si llega a internet,
// pero sirve para avisar de "sin conexión" en el sótano del súper.
function subscribe(onChange: () => void) {
  window.addEventListener('online', onChange);
  window.addEventListener('offline', onChange);
  return () => {
    window.removeEventListener('online', onChange);
    window.removeEventListener('offline', onChange);
  };
}

export function useOnlineStatus(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => navigator.onLine,
    () => true,
  );
}
