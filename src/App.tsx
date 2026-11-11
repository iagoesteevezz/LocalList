import { useOnlineStatus } from './lib/useOnlineStatus';
import { UpdatePrompt } from './pwa/UpdatePrompt';

// Fase 1: solo el "esqueleto". Las pantallas reales llegan en fases 4-6.
export function App() {
  const online = useOnlineStatus();

  return (
    <div className="app">
      {!online && (
        <div className="banner banner--offline" role="status">
          Sin conexión. Los cambios se guardarán cuando vuelva.
        </div>
      )}
      <main className="placeholder">
        <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width={96} height={96} />
        <h1>LocaLisT</h1>
        <p>Nueva versión en construcción.</p>
      </main>
      <UpdatePrompt />
    </div>
  );
}
