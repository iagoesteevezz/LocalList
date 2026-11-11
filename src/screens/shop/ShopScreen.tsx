// Pestaña "Comprar": la lista ordenada por los pasillos del súper donde estás.

import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { setDone, useItems } from '../../data/items';
import type { Family } from '../../data/useSession';
import { planRoute } from '../../domain/route';
import type { CatalogEntry } from '../../domain/suggest';
import type { Store } from '../../domain/types';
import { navigate } from '../../lib/useHashRoute';
import { useOnlineStatus } from '../../lib/useOnlineStatus';
import { getLastStore, setLastStore } from '../../lib/storage';
import { useDockHeight, useHeightVar } from '../../lib/useViewportVars';
import { CartIcon, CheckIcon, StoreIcon } from '../../ui/icons';
import { Sheet } from '../../ui/Sheet';
import { AddBar } from '../list/AddBar';
import { ItemRow } from '../list/ItemRow';
import { OfflineNote } from '../list/ListScreen';
import { useListActions } from '../list/useListActions';
import { RouteStrip } from './RouteStrip';

interface Props {
  family: Family;
  stores: readonly Store[];
  storesLoaded: boolean;
  catalog: readonly CatalogEntry[];
  /** Id del súper en la ruta (#/comprar/<id>), si lo hay. */
  routeStoreId: string | undefined;
  toastView: ReactNode;
  tabBar: ReactNode;
}

export function ShopScreen(props: Props) {
  const { stores, storesLoaded, routeStoreId } = props;

  // El súper: el de la ruta, si no el último usado, si no el único que haya.
  const store =
    stores.find((s) => s.id === routeStoreId) ??
    stores.find((s) => s.id === getLastStore()) ??
    (stores.length === 1 ? stores[0] : undefined);

  if (!storesLoaded) {
    return <Frame {...props} title="Comprar" body={<p className="centered">Abriendo…</p>} />;
  }
  if (stores.length === 0) {
    return <Frame {...props} title="Comprar" body={<NoStores />} />;
  }
  if (!store) {
    return <Frame {...props} title="¿En qué súper estás?" body={<StorePicker stores={stores} />} />;
  }
  return <Shopping {...props} store={store} />;
}

function choose(storeId: string) {
  setLastStore(storeId);
  navigate(`comprar/${storeId}`);
}

/** Cabecera + contenido + dock para los estados sin súper elegido. */
function Frame({ title, body, toastView, tabBar }: Props & { title: string; body: ReactNode }) {
  const dock = useRef<HTMLDivElement>(null);
  useDockHeight(dock);
  return (
    <>
      <header className="board-header">
        <div className="board-header__row">
          <h1>{title}</h1>
        </div>
      </header>
      <main className="content">{body}</main>
      <div className="dock" ref={dock}>
        <div className="dock__inner">{toastView}</div>
        {tabBar}
      </div>
    </>
  );
}

function NoStores() {
  return (
    <div className="empty">
      <StoreIcon className="icon icon--hero" />
      <h2>Falta el supermercado</h2>
      <p>Añade el súper donde compráis y la lista se ordenará por sus pasillos.</p>
      <a className="btn btn--block empty__action" href="#/super/nuevo/0">
        Usar Mercadona Cruce de Melenara
      </a>
      <a className="btn btn--outline btn--block" href="#/super/nuevo/blanco">
        Otro supermercado
      </a>
    </div>
  );
}

function StorePicker({ stores }: { stores: readonly Store[] }) {
  return (
    <div className="picker">
      {stores.map((s) => (
        <button key={s.id} type="button" className="btn btn--block btn--outline picker__store" onClick={() => choose(s.id)}>
          <StoreIcon />
          {s.name}
        </button>
      ))}
    </div>
  );
}

function Shopping({ family, stores, catalog, toastView, tabBar, store }: Props & { store: Store }) {
  const fid = family.id;
  const { items, loaded } = useItems(fid);
  const online = useOnlineStatus();
  const actions = useListActions(fid, items, catalog, store);
  const [picking, setPicking] = useState(false);
  const header = useRef<HTMLElement>(null);
  const dock = useRef<HTMLDivElement>(null);
  useHeightVar(header, '--header-h');
  useDockHeight(dock);

  // Recordar el súper aunque se haya llegado por "último usado".
  useEffect(() => setLastStore(store.id), [store.id]);

  const route = useMemo(() => planRoute(items, store), [items, store]);
  const pendingIds = useMemo(() => new Set(items.filter((i) => !i.done).map((i) => i.id)), [items]);
  const bought = useMemo(() => items.filter((i) => i.done), [items]);
  const visible = route.sections.filter((s) => s.pending.length + s.done.length > 0);
  const unassigned = route.unassigned;
  const unassignedCount = unassigned.pending.length + unassigned.done.length;

  function go(target: string) {
    document.getElementById(target)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  const row = (item: (typeof items)[number], unplaced = false) => (
    <ItemRow
      key={item.id}
      item={item}
      unplaced={unplaced}
      onSetDone={(value) => setDone(fid, item.id, value)}
      onOpen={() => actions.openItem(item.id)}
    />
  );

  return (
    <>
      <header className="board-header board-header--shop" ref={header}>
        <div className="board-header__row">
          <h1 className="board-header__store">{store.name}</h1>
          {stores.length > 1 && (
            <button type="button" className="btn board-header__switch" onClick={() => setPicking(true)}>
              Cambiar
            </button>
          )}
        </div>
        {loaded && (
          <p className="board-header__left">
            {route.pendingCount > 0 ? (
              <>
                <strong className="tabular">{route.pendingCount}</strong> por coger
              </>
            ) : items.length > 0 ? (
              'Todo en el carro'
            ) : (
              'No hay nada apuntado'
            )}
          </p>
        )}
        {loaded && store.aisles.length > 0 && (
          <RouteStrip
            sections={route.sections}
            nextAisleId={route.nextAisleId}
            unassignedCount={unassignedCount}
            onGo={go}
          />
        )}
        {!online && <OfflineNote />}
      </header>

      <main className="content">
        {loaded && items.length === 0 && (
          <div className="empty">
            <CartIcon className="icon icon--hero" />
            <h2>No hay nada apuntado</h2>
            <p>Si te acuerdas de algo, apúntalo abajo.</p>
          </div>
        )}

        {loaded && items.length > 0 && route.pendingCount === 0 && (
          <div className="all-done" role="status">
            <CheckIcon className="icon icon--hero" />
            <p>Todo en el carro. Cuando pagues, pulsa «Terminar compra».</p>
          </div>
        )}

        {visible.map((section) => {
          const aisle = section.aisle!;
          const n = store.aisles.findIndex((a) => a.id === aisle.id) + 1;
          return (
            <section key={aisle.id} id={`aisle-${aisle.id}`} className="group aisle-group" aria-labelledby={`t-${aisle.id}`}>
              <h2 className="group__title aisle-group__title" id={`t-${aisle.id}`}>
                <span>
                  <span className="aisle-group__num tabular">{n}</span>
                  {aisle.name}
                </span>
                <span className="tabular">
                  {section.pending.length > 0 ? section.pending.length : <CheckIcon className="icon icon--inline" />}
                </span>
              </h2>
              <ul className="rows">
                {section.pending.map((i) => row(i))}
                {section.done.map((i) => row(i))}
              </ul>
            </section>
          );
        })}

        {unassignedCount > 0 && (
          <section id="aisle-none" className="group aisle-group" aria-labelledby="t-none">
            <h2 className="group__title" id="t-none">
              Sin pasillo en este súper
              <span className="tabular">{unassigned.pending.length}</span>
            </h2>
            <p className="muted section__hint">Toca ⋯ y elige en qué pasillo está. Se recordará para la próxima vez.</p>
            <ul className="rows">
              {unassigned.pending.map((i) => row(i, true))}
              {unassigned.done.map((i) => row(i, true))}
            </ul>
          </section>
        )}

        {bought.length > 0 && (
          <button
            type="button"
            className={route.pendingCount === 0 ? 'btn btn--block cart__finish' : 'btn btn--outline btn--block cart__finish'}
            onClick={() => actions.finishShopping(bought)}
          >
            <CartIcon />
            Terminar compra ({bought.length})
          </button>
        )}
      </main>

      <div className="dock" ref={dock}>
        <div className="dock__inner">
          {toastView}
          <AddBar catalog={catalog} pendingIds={pendingIds} onAdd={actions.handleAdd} />
        </div>
        {tabBar}
      </div>

      {actions.sheets}

      <Sheet open={picking} onClose={() => setPicking(false)} title="¿En qué súper estás?">
        <div className="picker">
          {stores.map((s) => (
            <button
              key={s.id}
              type="button"
              className={s.id === store.id ? 'btn btn--block picker__store' : 'btn btn--block btn--outline picker__store'}
              aria-current={s.id === store.id ? 'true' : undefined}
              onClick={() => {
                setPicking(false);
                choose(s.id);
              }}
            >
              <StoreIcon />
              {s.name}
            </button>
          ))}
        </div>
      </Sheet>
    </>
  );
}
