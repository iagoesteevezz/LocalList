// Pantalla "Lista": lo que falta en casa, agrupado por secciones.

import { useMemo, useRef, type ReactNode } from 'react';
import { setDone, useItems } from '../../data/items';
import type { Family } from '../../data/useSession';
import { groupByCategory } from '../../domain/list';
import type { CatalogEntry } from '../../domain/suggest';
import { useOnlineStatus } from '../../lib/useOnlineStatus';
import { useDockHeight } from '../../lib/useViewportVars';
import { CartIcon, CloudOffIcon, ListIcon } from '../../ui/icons';
import { AddBar } from './AddBar';
import { ItemRow } from './ItemRow';
import { useListActions } from './useListActions';

interface Props {
  family: Family;
  catalog: readonly CatalogEntry[];
  /** Toast + pestañas, que la app coloca en el "dock" inferior. */
  toastView: ReactNode;
  tabBar: ReactNode;
}

export function ListScreen({ family, catalog, toastView, tabBar }: Props) {
  const fid = family.id;
  const { items, loaded } = useItems(fid);
  const online = useOnlineStatus();
  const dock = useRef<HTMLDivElement>(null);
  useDockHeight(dock);
  const actions = useListActions(fid, items, catalog);

  const { groups, done } = useMemo(() => groupByCategory(items), [items]);
  const pendingIds = useMemo(() => new Set(items.filter((i) => !i.done).map((i) => i.id)), [items]);
  const pendingCount = pendingIds.size;

  return (
    <>
      <header className="board-header">
        <div className="board-header__row">
          <h1>{family.name}</h1>
          {loaded && pendingCount > 0 && (
            <p className="board-header__count">
              <strong className="tabular">{pendingCount}</strong> por comprar
            </p>
          )}
        </div>
        {!online && <OfflineNote />}
      </header>

      <main className="content">
        {loaded && items.length === 0 && (
          <div className="empty">
            <ListIcon className="icon icon--hero" />
            <h2>La lista está vacía</h2>
            <p>Apunta abajo lo que falte en casa.</p>
          </div>
        )}

        {groups.map(({ category, items: groupItems }) => (
          <section key={category.id} className="group" aria-labelledby={`g-${category.id}`}>
            <h2 className="group__title" id={`g-${category.id}`}>
              {category.name}
              <span className="tabular">{groupItems.length}</span>
            </h2>
            <ul className="rows">
              {groupItems.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onSetDone={(value) => setDone(fid, item.id, value)}
                  onOpen={() => actions.openItem(item.id)}
                />
              ))}
            </ul>
          </section>
        ))}

        {done.length > 0 && (
          <section className="cart" aria-labelledby="g-cart">
            <h2 className="group__title" id="g-cart">
              En el carro
              <span className="tabular">{done.length}</span>
            </h2>
            <ul className="rows">
              {done.map((item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onSetDone={(value) => setDone(fid, item.id, value)}
                  onOpen={() => actions.openItem(item.id)}
                />
              ))}
            </ul>
            <button
              type="button"
              className="btn btn--outline btn--block cart__finish"
              onClick={() => actions.finishShopping(done)}
            >
              <CartIcon />
              Terminar compra
            </button>
          </section>
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
    </>
  );
}

export function OfflineNote() {
  return (
    <p className="board-header__status" role="status">
      <CloudOffIcon className="icon icon--inline" /> Sin conexión. Lo que hagas se guarda en el móvil.
    </p>
  );
}
