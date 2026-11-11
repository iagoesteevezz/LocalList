import { useSyncExternalStore } from 'react';

// Rutas con # (#/lista, #/familia): funcionan en GitHub Pages sin configurar
// el servidor, y la app instalada siempre abre en /LocalList/.

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

export function useHashRoute(): string {
  return useSyncExternalStore(
    subscribe,
    () => location.hash.replace(/^#\/?/, '').split('/')[0] ?? '',
    () => '',
  );
}
