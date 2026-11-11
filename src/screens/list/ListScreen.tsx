// Pantalla principal: la lista de la familia, agrupada por secciones.

import { useMemo, useRef, useState } from 'react';
import { useCatalog } from '../../data/catalog';
import {
  addItem,
  removeItem,
  removeItems,
  restoreItems,
  setCategory,
  setDone,
  setQty,
  useItems,
} from '../../data/items';
import type { Family } from '../../data/useSession';
import { decideAdd, type NewItem } from '../../domain/add';
import { groupByCategory } from '../../domain/list';
import type { Item } from '../../domain/types';
import { useOnlineStatus } from '../../lib/useOnlineStatus';
import { useDockHeight } from '../../lib/useViewportVars';
import { CartIcon, CloudOffIcon, ListIcon } from '../../ui/icons';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/useToast';
import { AddBar } from './AddBar';
import { ItemRow } from './ItemRow';
import { ItemSheet } from './ItemSheet';

interface Props {
  family: Family;
  /** Toast + pestañas, que la app coloca en el "dock" inferior. */
  toastView: React.ReactNode;
  tabBar: React.ReactNode;
}

export function ListScreen({ family, toastView, tabBar }: Props) {
  const fid = family.id;
  const { items, loaded } = useItems(fid);
  const catalog = useCatalog(fid);
  const online = useOnlineStatus();
  const toast = useToast();
  const dock = useRef<HTMLDivElement>(null);
  useDockHeight(dock);

  const [openId, setOpenId] = useState<string | null>(null);
  const [typo, setTypo] = useState<{ existing: Item; item: NewItem } | null>(null);

  const { groups, done } = useMemo(() => groupByCategory(items), [items]);
  const pendingIds = useMemo(() => new Set(items.filter((i) => !i.done).map((i) => i.id)), [items]);
  const pendingCount = pendingIds.size;
  const openItem = items.find((i) => i.id === openId) ?? null;

  // ─── Acciones ───────────────────────────────────────────────────────────

  function bringBack(existing: Item) {
    setDone(fid, existing.id, false);
    toast({ message: `${existing.name} vuelve a la lista` });
  }

  function handleAdd(text: string): boolean {
    const decision = decideAdd(text, items, catalog);
    switch (decision.kind) {
      case 'invalid':
        return false;
      case 'add':
        addItem(fid, decision.item);
        return true;
      case 'back-from-cart':
        bringBack(decision.existing);
        return true;
      case 'already-pending': {
        const { existing } = decision;
        toast({
          message: `${existing.name} ya está apuntado`,
          action: { label: 'Sumar 1', run: () => setQty(fid, existing.id, existing.qty + 1) },
        });
        return true;
      }
      case 'maybe-typo':
        setTypo({ existing: decision.existing, item: decision.item });
        return true;
    }
  }

  function remove(item: Item) {
    setOpenId(null);
    removeItem(fid, item.id);
    toast({
      message: `Quitado: ${item.name}`,
      action: { label: 'Deshacer', run: () => restoreItems(fid, [item]) },
    });
  }

  function finishShopping() {
    const bought = done;
    removeItems(
      fid,
      bought.map((i) => i.id),
    );
    toast({
      message: bought.length === 1 ? 'Quitado 1 producto del carro' : `Quitados ${bought.length} productos del carro`,
      action: { label: 'Deshacer', run: () => restoreItems(fid, bought) },
    });
  }

  // ─── Vista ──────────────────────────────────────────────────────────────

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
        {!online && (
          <p className="board-header__status" role="status">
            <CloudOffIcon className="icon icon--inline" /> Sin conexión. Lo que
            hagas se guarda en el móvil.
          </p>
        )}
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
                  onOpen={() => setOpenId(item.id)}
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
                  onOpen={() => setOpenId(item.id)}
                />
              ))}
            </ul>
            <button type="button" className="btn btn--outline btn--block cart__finish" onClick={finishShopping}>
              <CartIcon />
              Terminar compra
            </button>
          </section>
        )}
      </main>

      <div className="dock" ref={dock}>
        <div className="dock__inner">
          {toastView}
          <AddBar catalog={catalog} pendingIds={pendingIds} onAdd={handleAdd} />
        </div>
        {tabBar}
      </div>

      <ItemSheet
        item={openItem}
        onClose={() => setOpenId(null)}
        onQty={(qty) => openItem && setQty(fid, openItem.id, qty)}
        onCategory={(category) => openItem && setCategory(fid, openItem, category)}
        onRemove={() => openItem && remove(openItem)}
      />

      <Sheet open={typo !== null} onClose={() => setTypo(null)} title={`¿Querías decir «${typo?.existing.name ?? ''}»?`}>
        {typo && (
          <>
            <p className="sheet__text">
              Ya hay algo muy parecido en la lista. Has escrito «{typo.item.name}».
            </p>
            <div className="sheet__actions">
              <button
                type="button"
                className="btn btn--block"
                onClick={() => {
                  if (typo.existing.done) bringBack(typo.existing);
                  else toast({ message: `${typo.existing.name} ya está apuntado` });
                  setTypo(null);
                }}
              >
                Sí, es «{typo.existing.name}»
              </button>
              <button
                type="button"
                className="btn btn--outline btn--block"
                onClick={() => {
                  addItem(fid, typo.item);
                  setTypo(null);
                }}
              >
                No, apuntar «{typo.item.name}»
              </button>
            </div>
          </>
        )}
      </Sheet>
    </>
  );
}
