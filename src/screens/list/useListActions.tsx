// Acciones de la lista compartidas por "Lista" (en casa) y "Comprar" (en el súper):
// apuntar (con repetidos y erratas), detalles de un producto, quitar y terminar compra.
// Devuelve también las hojas (detalles y "¿querías decir?") ya montadas.

import { useState } from 'react';
import { addItem, removeItem, removeItems, restoreItems, setCategory, setDone, setQty } from '../../data/items';
import { setOverride } from '../../data/stores';
import { decideAdd, type NewItem } from '../../domain/add';
import { aisleFor } from '../../domain/route';
import type { CatalogEntry } from '../../domain/suggest';
import type { Item, Store } from '../../domain/types';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/useToast';
import { ItemSheet } from './ItemSheet';

export function useListActions(
  familyId: string,
  items: readonly Item[],
  catalog: readonly CatalogEntry[],
  /** En el modo compra: el súper actual (permite cambiar el pasillo de un producto). */
  store?: Store,
) {
  const toast = useToast();
  const [openId, setOpenId] = useState<string | null>(null);
  const [typo, setTypo] = useState<{ existing: Item; item: NewItem } | null>(null);
  const openItem = items.find((i) => i.id === openId) ?? null;

  function bringBack(existing: Item) {
    setDone(familyId, existing.id, false);
    toast({ message: `${existing.name} vuelve a la lista` });
  }

  function handleAdd(text: string): boolean {
    const decision = decideAdd(text, items, catalog);
    switch (decision.kind) {
      case 'invalid':
        return false;
      case 'add':
        addItem(familyId, decision.item);
        return true;
      case 'back-from-cart':
        bringBack(decision.existing);
        return true;
      case 'already-pending': {
        const { existing } = decision;
        toast({
          message: `${existing.name} ya está apuntado`,
          action: { label: 'Sumar 1', run: () => setQty(familyId, existing.id, existing.qty + 1) },
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
    removeItem(familyId, item.id);
    toast({
      message: `Quitado: ${item.name}`,
      action: { label: 'Deshacer', run: () => restoreItems(familyId, [item]) },
    });
  }

  /** Quita de la lista todo lo que está en el carro, con Deshacer. */
  function finishShopping(bought: readonly Item[]) {
    if (bought.length === 0) return;
    removeItems(
      familyId,
      bought.map((i) => i.id),
    );
    toast({
      message: bought.length === 1 ? 'Quitado 1 producto del carro' : `Quitados ${bought.length} productos del carro`,
      action: { label: 'Deshacer', run: () => restoreItems(familyId, bought) },
    });
  }

  const sheets = (
    <>
      <ItemSheet
        item={openItem}
        onClose={() => setOpenId(null)}
        onQty={(qty) => openItem && setQty(familyId, openItem.id, qty)}
        onCategory={(category) => openItem && setCategory(familyId, openItem, category)}
        onRemove={() => openItem && remove(openItem)}
        store={
          store && openItem
            ? {
                name: store.name,
                aisles: store.aisles,
                currentAisleId: aisleFor(openItem, store)?.id ?? null,
                onAisle: (aisleId) => {
                  setOverride(familyId, store.id, openItem.id, aisleId);
                  setOpenId(null);
                  const n = store.aisles.findIndex((a) => a.id === aisleId) + 1;
                  toast({ message: `${openItem.name}: pasillo ${n}. Se recordará en este súper.` });
                },
              }
            : undefined
        }
      />

      <Sheet open={typo !== null} onClose={() => setTypo(null)} title={`¿Querías decir «${typo?.existing.name ?? ''}»?`}>
        {typo && (
          <>
            <p className="sheet__text">Ya hay algo muy parecido en la lista. Has escrito «{typo.item.name}».</p>
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
                  addItem(familyId, typo.item);
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

  return { handleAdd, finishShopping, openItem: setOpenId, sheets };
}
