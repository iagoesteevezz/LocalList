import { useSyncExternalStore } from 'react';

// Rutas con # (#/lista, #/familia, #/super/<id>): funcionan en GitHub Pages
// sin configurar el servidor, y la app instalada siempre abre en /LocalList/.

function subscribe(onChange: () => void) {
  window.addEventListener('hashchange', onChange);
  return () => window.removeEventListener('hashchange', onChange);
}

/** La ruta actual como texto ("super/abc123"). */
export function useHashRoute(): string {
  return useSyncExternalStore(
    subscribe,
    () => location.hash.replace(/^#\/?/, ''),
    () => '',
  );
}

export function navigate(path: string) {
  location.hash = `#/${path}`;
}
