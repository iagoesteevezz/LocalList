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
    <div className="update" role="status">
      <span>Hay una versión nueva de la app.</span>
      <div className="update__actions">
        <button type="button" className="btn btn--quiet" onClick={() => setNeedRefresh(false)}>
          Luego
        </button>
        <button type="button" className="btn" onClick={() => void updateServiceWorker(true)}>
          Actualizar
        </button>
      </div>
    </div>
  );
}
