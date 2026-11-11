// Detalles de un producto: cantidad, categoría y quitar.

import { useId } from 'react';
import { CATEGORIES, isCategoryId } from '../../domain/categories';
import type { Aisle, Item } from '../../domain/types';
import { MinusIcon, PlusIcon } from '../../ui/icons';
import { Sheet } from '../../ui/Sheet';

interface Props {
  item: Item | null;
  onClose: () => void;
  onQty: (qty: number) => void;
  onCategory: (category: Item['category']) => void;
  onRemove: () => void;
  /** Solo en el modo compra: en qué pasillo está en este súper. */
  store?: {
    name: string;
    aisles: readonly Aisle[];
    currentAisleId: string | null;
    onAisle: (aisleId: string) => void;
  };
}

export function ItemSheet({ item, onClose, onQty, onCategory, onRemove, store }: Props) {
  const categoryId = useId();
  const aisleId = useId();

  return (
    <Sheet open={item !== null} onClose={onClose} title={item?.name ?? ''}>
      {item && (
        <>
          <div className="field">
            <span id={`${categoryId}-qty`} className="field-label">
              <strong>Cantidad</strong>
            </span>
            <div className="stepper" role="group" aria-labelledby={`${categoryId}-qty`}>
              <button type="button" onClick={() => onQty(item.qty - 1)} disabled={item.qty <= 1} aria-label="Una menos">
                <MinusIcon />
              </button>
              <output className="tabular" aria-live="polite">
                {item.qty}
              </output>
              <button type="button" onClick={() => onQty(item.qty + 1)} disabled={item.qty >= 99} aria-label="Una más">
                <PlusIcon />
              </button>
            </div>
          </div>

          {store && (
            <div className="field">
              <label htmlFor={aisleId}>Pasillo en {store.name}</label>
              <select
                id={aisleId}
                className="select"
                value={store.currentAisleId ?? ''}
                onChange={(e) => e.target.value && store.onAisle(e.target.value)}
              >
                {store.currentAisleId === null && (
                  <option value="" disabled>
                    Sin pasillo: elige dónde está
                  </option>
                )}
                {store.aisles.map((a, i) => (
                  <option key={a.id} value={a.id}>
                    {i + 1} · {a.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="field">
            <label htmlFor={categoryId}>Sección</label>
            <select
              id={categoryId}
              className="select"
              value={item.category}
              onChange={(e) => {
                if (isCategoryId(e.target.value)) onCategory(e.target.value);
              }}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <p className="muted">Se recordará para la próxima vez.</p>
          </div>

          <div className="sheet__actions">
            <button type="button" className="btn btn--block" onClick={onClose}>
              Listo
            </button>
            <button type="button" className="btn btn--danger btn--block" onClick={onRemove}>
              Quitar de la lista
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}
