// Acciones de la lista compartidas por "Lista" (en casa) y "Comprar" (en el súper):
// apuntar (con repetidos y erratas), subir algo de "Lo de siempre", detalles y borrar.
// Devuelve también las hojas (detalles y "¿querías decir?") ya montadas.

import { useState } from 'react';
import {
  addItem,
  forgetItem,
  restoreForgotten,
  restoreItems,
  saveUsual,
  setCategory,
  setDone,
  setQty,
} from '../../data/items';
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
    toast({ message: `Apuntado: ${existing.name}` });
  }

  /**
   * Sube a "Para comprar" un producto de "Lo de siempre" (como desmarcarlo en la nota).
   * `onlyInCatalog`: aún no tiene documento en la lista y hay que crearlo.
   */
  function need(item: Item, onlyInCatalog: boolean) {
    if (onlyInCatalog) addItem(familyId, item);
    else setDone(familyId, item.id, false);
    navigator.vibrate?.(10);
    toast({
      message: `Apuntado arriba: ${item.name}`,
      action: {
        label: 'Deshacer',
        run: () => (onlyInCatalog ? saveUsual(familyId, item) : restoreItems(familyId, [item])),
      },
    });
  }

  /** Detalles de un producto de "Lo de siempre" que aún no tiene documento. */
  function openUsual(item: Item, onlyInCatalog: boolean) {
    if (onlyInCatalog) saveUsual(familyId, item);
    setOpenId(item.id);
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

  /** Borra el producto del todo (también de "Lo de siempre"), con Deshacer. */
  function remove(item: Item) {
    setOpenId(null);
    const uses = catalog.find((e) => e.id === item.id)?.uses ?? 1;
    forgetItem(familyId, item.id);
    toast({
      message: `Borrado: ${item.name}`,
      action: { label: 'Deshacer', run: () => restoreForgotten(familyId, item, uses) },
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

  return { handleAdd, need, openUsual, openItem: setOpenId, sheets };
}
