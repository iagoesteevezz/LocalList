import { useState, type ReactNode } from 'react';
import { useSession } from './data/useSession';
import { inviteCodeFromHash } from './domain/invite';
import { useOnlineStatus } from './lib/useOnlineStatus';
import { UpdatePrompt } from './pwa/UpdatePrompt';
import { FamilyHome } from './screens/FamilyHome';
import { Onboarding } from './screens/Onboarding';

export function App() {
  const online = useOnlineStatus();
  const session = useSession();
  // Código de invitación del enlace (#/unirse/CODIGO), leído una sola vez.
  const [linkCode] = useState(() => inviteCodeFromHash(location.hash));

  function clearHash() {
    if (location.hash) history.replaceState(null, '', location.pathname + location.search);
  }

  return (
    <div className="app">
      {!online && (
        <div className="banner banner--offline" role="status">
          Sin conexión. Los cambios se guardarán cuando vuelva.
        </div>
      )}

      {session.status === 'loading' && <Centered>Cargando…</Centered>}
      {session.status === 'needs-network' && (
        <Centered>La primera vez necesitas conexión a internet. Conéctate y se abrirá sola.</Centered>
      )}
      {session.status === 'error' && (
        <Centered>
          Algo ha fallado al abrir la app.
          <button type="button" onClick={() => location.reload()}>
            Reintentar
          </button>
        </Centered>
      )}
      {session.status === 'no-family' && <Onboarding initialCode={linkCode} onDone={clearHash} />}
      {session.status === 'ready' && <FamilyHome uid={session.uid} family={session.family} />}

      <UpdatePrompt />
    </div>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <main className="screen centered" aria-live="polite">
      {children}
    </main>
  );
}
