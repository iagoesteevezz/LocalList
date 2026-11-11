// Una fila de la lista. Tocar el nombre (o la marca) lo mete en el carro;
// el botón ⋯ abre los detalles (cantidad, categoría, quitar).

import { useEffect, useRef, useState } from 'react';
import type { Item } from '../../domain/types';
import { usePrefersReducedMotion } from '../../lib/usePrefersReducedMotion';
import { ChalkStrike } from '../../ui/ChalkStrike';
import { CheckIcon, MoreIcon } from '../../ui/icons';

/** Lo que tarda el trazo de tiza en dibujarse antes de que la fila baje al carro. */
const STRIKE_MS = 380;

interface Props {
  item: Item;
  onSetDone: (done: boolean) => void;
  onOpen: () => void;
  /** Modo compra: no tiene pasillo en este súper (marca discontinua). */
  unplaced?: boolean;
}

export function ItemRow({ item, onSetDone, onOpen, unplaced = false }: Props) {
  const reduced = usePrefersReducedMotion();
  const [striking, setStriking] = useState(false);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  function toggle() {
    if (item.done) {
      // En el modo compra la fila no se vuelve a montar al marcarla:
      // hay que soltar el estado del tachado para poder desmarcar.
      setStriking(false);
      onSetDone(false);
      return;
    }
    if (striking) return; // ya se está tachando: ignora el doble toque
    if (reduced) {
      onSetDone(true);
      return;
    }
    // Primero se ve el tachado; luego la fila baja a "En el carro".
    setStriking(true);
    navigator.vibrate?.(10);
    timer.current = window.setTimeout(() => onSetDone(true), STRIKE_MS);
  }

  const crossed = item.done || striking;

  return (
    <li className={['row', crossed && 'row--done', unplaced && 'row--unplaced'].filter(Boolean).join(' ')}>
      <button type="button" className="row__toggle" onClick={toggle} aria-pressed={item.done}>
        <span className="mark" aria-hidden="true">
          {crossed && <CheckIcon />}
        </span>
        <span className="row__name">
          {item.name}
          {/* Solo se anima mientras se tacha. Ya guardado, el trazo es fijo: mover la fila
              en el DOM reiniciaría la animación y el tachado se vería a medias. */}
          {crossed && <ChalkStrike drawing={striking && !item.done} />}
        </span>
        <span className="visually-hidden">{item.done ? ', en el carro' : ''}</span>
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
