// La franja del recorrido: los pasillos numerados en tiza, unidos por una línea.
// Siguiente pasillo con algo pendiente = amarillo tiza. Terminado = ✓. Sin nada = apagado.
// Tocar un pasillo lleva a su parte de la lista.

import { useEffect, useRef } from 'react';
import type { RouteSection } from '../../domain/route';
import { CheckIcon, UnplacedIcon } from '../../ui/icons';

type State = 'next' | 'pending' | 'done' | 'empty';

function stateOf(section: RouteSection, nextAisleId: string | null): State {
  if (section.pending.length > 0) return section.aisle?.id === nextAisleId ? 'next' : 'pending';
  return section.done.length > 0 ? 'done' : 'empty';
}

function describe(n: number, section: RouteSection, state: State): string {
  const name = `Pasillo ${n}, ${section.aisle?.name ?? ''}`;
  if (state === 'empty') return `${name}: nada que coger`;
  if (state === 'done') return `${name}: hecho`;
  const left = section.pending.length === 1 ? '1 por coger' : `${section.pending.length} por coger`;
  return `${name}: ${left}${state === 'next' ? ', el siguiente' : ''}`;
}

interface Props {
  sections: readonly RouteSection[];
  nextAisleId: string | null;
  unassignedCount: number;
  onGo: (target: string) => void;
}

export function RouteStrip({ sections, nextAisleId, unassignedCount, onGo }: Props) {
  const nextRef = useRef<HTMLLIElement>(null);

  // Mantiene a la vista el siguiente pasillo cuando avanza.
  useEffect(() => {
    nextRef.current?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [nextAisleId]);

  return (
    <nav className="route" aria-label="Recorrido por pasillos">
      <ol className="route__list">
        {sections.map((section, i) => {
          const state = stateOf(section, nextAisleId);
          const id = section.aisle!.id;
          return (
            <li key={id} className={`route__stop route__stop--${state}`} ref={state === 'next' ? nextRef : undefined}>
              <button
                type="button"
                onClick={() => onGo(`aisle-${id}`)}
                disabled={state === 'empty'}
                aria-label={describe(i + 1, section, state)}
              >
                {state === 'done' ? <CheckIcon /> : <span className="tabular">{i + 1}</span>}
              </button>
            </li>
          );
        })}
        {unassignedCount > 0 && (
          <li className="route__stop route__stop--unplaced">
            <button
              type="button"
              onClick={() => onGo('aisle-none')}
              aria-label={`Sin pasillo: ${unassignedCount}`}
            >
              <UnplacedIcon />
            </button>
          </li>
        )}
      </ol>
    </nav>
  );
}
