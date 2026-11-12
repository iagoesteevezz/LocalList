// Pantalla "Lista": la nota de la familia con todos los productos de siempre.
// Arriba, lo que hace falta comprar; abajo, "Lo de siempre" (con ✓): tocar uno lo sube.

import { useMemo, useRef, type ReactNode } from 'react';
import { setDone, useItems } from '../../data/items';
import type { Family } from '../../data/useSession';
import { buildNote, type CategoryGroup } from '../../domain/list';
import type { CatalogEntry } from '../../domain/suggest';
import type { Item } from '../../domain/types';
import { useOnlineStatus } from '../../lib/useOnlineStatus';
import { useDockHeight } from '../../lib/useViewportVars';
import { CloudOffIcon, ListIcon } from '../../ui/icons';
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

  const note = useMemo(() => buildNote(items, catalog), [items, catalog]);
  const pendingIds = useMemo(() => new Set(items.filter((i) => !i.done).map((i) => i.id)), [items]);
  const pendingCount = pendingIds.size;
  const empty = loaded && note.needed.length === 0 && note.usual.length === 0;

  const groups = (list: readonly CategoryGroup[], prefix: string, row: (item: Item) => ReactNode) =>
    list.map(({ category, items: groupItems }) => (
      <section key={category.id} className="group" aria-labelledby={`${prefix}-${category.id}`}>
        <h3 className="group__title" id={`${prefix}-${category.id}`}>
          {category.name}
        </h3>
        <ul className="rows">{groupItems.map(row)}</ul>
      </section>
    ));

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
        {empty && (
          <div className="empty">
            <ListIcon className="icon icon--hero" />
            <h2>La lista está vacía</h2>
            <p>Apunta abajo lo que falte en casa.</p>
          </div>
        )}

        {loaded && !empty && (
          <section className="note-part" aria-labelledby="part-needed">
            <h2 className="note-part__title" id="part-needed">
              Para comprar
            </h2>
            {note.needed.length === 0 ? (
              <p className="note-part__hint">No falta nada. Toca abajo lo que haga falta o apúntalo.</p>
            ) : (
              <>
                <p className="note-part__hint">Toca lo que cojas para marcarlo: pasa a «Lo de siempre». No se borra.</p>
                {groups(note.needed, 'n', (item) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  onSetDone={(value) => setDone(fid, item.id, value)}
                  onOpen={() => actions.openItem(item.id)}
                />
                ))}
              </>
            )}
          </section>
        )}

        {note.usual.length > 0 && (
          <section className="note-part note-part--usual" aria-labelledby="part-usual">
            <h2 className="note-part__title" id="part-usual">
              Lo de siempre
            </h2>
            <p className="note-part__hint">Todo lo que apuntáis, con ✓. Toca lo que haga falta y sube a «Para comprar».</p>
            {groups(note.usual, 'u', (item) => {
              const onlyInCatalog = note.onlyInCatalog.has(item.id);
              return (
                <ItemRow
                  key={item.id}
                  item={item}
                  onSetDone={() => actions.need(item, onlyInCatalog)}
                  onOpen={() => actions.openUsual(item, onlyInCatalog)}
                />
              );
            })}
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
