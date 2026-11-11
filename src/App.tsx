import { useEffect, useState, type ReactNode } from 'react';
import { setWriteErrorHandler } from './data/items';
import { useSession, type Family } from './data/useSession';
import { inviteCodeFromHash } from './domain/invite';
import { useCatalog } from './data/catalog';
import { useStores } from './data/stores';
import { draftFromTemplate, emptyDraft } from './domain/storeEdit';
import { TEMPLATES } from './domain/templates';
import { useHashRoute } from './lib/useHashRoute';
import { useKeyboardInset } from './lib/useViewportVars';
import { UpdatePrompt } from './pwa/UpdatePrompt';
import { FamilyScreen } from './screens/FamilyScreen';
import { ImportV1Screen } from './screens/ImportV1Screen';
import { ListScreen } from './screens/list/ListScreen';
import { Onboarding } from './screens/Onboarding';
import { ShopScreen } from './screens/shop/ShopScreen';
import { StoreEditor } from './screens/stores/StoreEditor';
import { CartIcon, ListIcon, PeopleIcon } from './ui/icons';
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
  { id: 'comprar', label: 'Comprar', Icon: CartIcon },
  { id: 'familia', label: 'Familia', Icon: PeopleIcon },
] as const;

function Shell({ uid, family }: { uid: string; family: Family }) {
  const route = useHashRoute();
  const [section = 'lista', param, extra] = route.split('/');
  const { stores, loaded: storesLoaded } = useStores(family.id);
  const catalog = useCatalog(family.id);
  const tab =
    section === 'familia' || section === 'super' || section === 'importar-v1'
      ? 'familia'
      : section === 'comprar'
        ? 'comprar'
        : 'lista';

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

  let screen: (toastView: ReactNode) => ReactNode;
  if (section === 'importar-v1') {
    // Pantalla oculta: solo se llega escribiendo la dirección (#/importar-v1).
    screen = () => <ImportV1Screen family={family} stores={stores} />;
  } else if (section === 'super' && param === 'nuevo') {
    const template = extra === 'blanco' ? undefined : TEMPLATES[Number(extra)];
    const initial = template ? draftFromTemplate(template) : emptyDraft();
    screen = () => <StoreEditor key={`nuevo-${extra}`} familyId={family.id} initial={initial} catalog={catalog} />;
  } else if (section === 'super' && param) {
    const store = stores.find((s) => s.id === param);
    screen = () =>
      store ? (
        <StoreEditor
          key={store.id}
          familyId={family.id}
          storeId={store.id}
          initial={{ name: store.name, icon: store.icon, aisles: store.aisles, overrides: store.overrides }}
          catalog={catalog}
        />
      ) : (
        <Centered>{storesLoaded ? 'Este supermercado ya no existe.' : 'Abriendo…'}</Centered>
      );
  } else if (tab === 'comprar') {
    screen = (toastView) => (
      <ShopScreen
        family={family}
        stores={stores}
        storesLoaded={storesLoaded}
        catalog={catalog}
        routeStoreId={param}
        toastView={toastView}
        tabBar={tabBar}
      />
    );
  } else if (tab === 'familia') {
    screen = (toastView) => (
      <FamilyScreen uid={uid} family={family} stores={stores} toastView={toastView} tabBar={tabBar} />
    );
  } else {
    screen = (toastView) => <ListScreen family={family} catalog={catalog} toastView={toastView} tabBar={tabBar} />;
  }

  return (
    <ToastProvider>
      {(toastView) => (
        <>
          <WriteErrors />
          {screen(toastView)}
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
