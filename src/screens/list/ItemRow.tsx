// Una fila de la lista, como una línea de la nota del móvil:
// aro vacío = hace falta; aro con ✓ y nombre en gris = ya está (cogido o lo tenemos).
// Tocar el nombre (o la marca) cambia el estado; la fila no se mueve de su sitio.
// El botón ⋯ abre los detalles (cantidad, sección, borrar).

import type { Item } from '../../domain/types';
import { CheckIcon, MoreIcon } from '../../ui/icons';

interface Props {
  item: Item;
  onSetDone: (done: boolean) => void;
  onOpen: () => void;
  /** Modo compra: no tiene pasillo en este súper (marca discontinua). */
  unplaced?: boolean;
}

export function ItemRow({ item, onSetDone, onOpen, unplaced = false }: Props) {
  function toggle() {
    if (!item.done) navigator.vibrate?.(10);
    onSetDone(!item.done);
  }

  return (
    <li className={['row', item.done && 'row--done', unplaced && 'row--unplaced'].filter(Boolean).join(' ')}>
      <button type="button" className="row__toggle" onClick={toggle} aria-pressed={item.done}>
        <span className="mark" aria-hidden="true">
          {item.done && <CheckIcon />}
        </span>
        <span className="row__name">{item.name}</span>
        <span className="visually-hidden">{item.done ? ', marcado' : ''}</span>
        {item.qty > 1 && (
          <span className="qty tabular" aria-label={`${item.qty} unidades`}>
            ×{item.qty}
          </span>
        )}
      </button>
      <button type="button" className="icon-btn row__more" onClick={onOpen} aria-label={`Detalles de ${item.name}`}>
        <MoreIcon />
      </button>
    </li>
  );
}
