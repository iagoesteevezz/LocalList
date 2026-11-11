import { useRegisterSW } from 'virtual:pwa-register/react';

// Registra el service worker. Si hay una versión nueva, NO recarga sola:
// muestra un aviso para que se actualice cuando convenga (no a mitad de compra).
export function UpdatePrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW();

  if (!needRefresh) return null;

  return (
    <div className="banner banner--update" role="status">
      <span>Hay una versión nueva.</span>
      <button type="button" onClick={() => updateServiceWorker(true)}>
        Actualizar
      </button>
      <button type="button" className="ghost" onClick={() => setNeedRefresh(false)}>
        Luego
      </button>
    </div>
  );
}
