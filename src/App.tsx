import { useEffect, useState, type ReactNode } from 'react';
import { setWriteErrorHandler } from './data/items';
import { useSession, type Family } from './data/useSession';
import { inviteCodeFromHash } from './domain/invite';
import { useHashRoute } from './lib/useHashRoute';
import { useKeyboardInset } from './lib/useViewportVars';
import { UpdatePrompt } from './pwa/UpdatePrompt';
import { FamilyScreen } from './screens/FamilyScreen';
import { ListScreen } from './screens/list/ListScreen';
import { Onboarding } from './screens/Onboarding';
import { ListIcon, PeopleIcon } from './ui/icons';
import { ToastProvider } from './ui/toast';
import { useToast } from './ui/useToast';

export function App() {
  const session = useSession();
  // Código de invitación del enlace (#/unirse/CODIGO), leído una sola vez.
  const [linkCode] = useState(() => inviteCodeFromHash(location.hash));
  useKeyboardInset();

  function clearHash() {
    history.replaceState(null, '', location.pathname + location.search + '#/lista');
  }

  return (
    <div className="app">
      {session.status === 'loading' && <Centered>Abriendo la lista…</Centered>}
      {session.status === 'needs-network' && (
        <Centered>La primera vez hace falta conexión a internet. En cuanto la haya, se abrirá sola.</Centered>
      )}
      {session.status === 'error' && (
        <Centered>
          <p>No se ha podido abrir la app.</p>
          <button type="button" className="btn" onClick={() => location.reload()}>
            Reintentar
          </button>
        </Centered>
      )}
      {session.status === 'no-family' && <Onboarding initialCode={linkCode} onDone={clearHash} />}
      {session.status === 'ready' && <Shell uid={session.uid} family={session.family} />}
      <UpdatePrompt />
    </div>
  );
}

const TABS = [
  { id: 'lista', label: 'Lista', Icon: ListIcon },
  { id: 'familia', label: 'Familia', Icon: PeopleIcon },
] as const;

function Shell({ uid, family }: { uid: string; family: Family }) {
  const route = useHashRoute();
  const tab = TABS.some((t) => t.id === route) ? route : 'lista';

  const tabBar = (
    <nav className="tabbar" aria-label="Secciones">
      {TABS.map(({ id, label, Icon }) => (
        <a key={id} href={`#/${id}`} aria-current={tab === id ? 'page' : undefined}>
          <Icon />
          {label}
        </a>
      ))}
    </nav>
  );

  return (
    <ToastProvider>
      {(toastView) => (
        <>
          <WriteErrors />
          {tab === 'lista' && <ListScreen family={family} toastView={toastView} tabBar={tabBar} />}
          {tab === 'familia' && <FamilyScreen uid={uid} family={family} toastView={toastView} tabBar={tabBar} />}
        </>
      )}
    </ToastProvider>
  );
}

/** Si el servidor rechaza un cambio (raro), se avisa en vez de fallar en silencio. */
function WriteErrors() {
  const toast = useToast();
  useEffect(() => {
    setWriteErrorHandler((error) => {
      console.error(error);
      toast({ message: 'No se pudo guardar un cambio. Vuelve a intentarlo.' });
    });
  }, [toast]);
  return null;
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <main className="centered" aria-live="polite">
      {children}
    </main>
  );
}
