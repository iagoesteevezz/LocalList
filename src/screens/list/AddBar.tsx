// Campo para apuntar productos, abajo (al alcance del pulgar), con sugerencias.

import { useId, useMemo, useRef, useState, type SubmitEvent } from 'react';
import { suggest, type CatalogEntry } from '../../domain/suggest';
import { HistoryIcon, PlusIcon } from '../../ui/icons';

interface Props {
  catalog: readonly CatalogEntry[];
  pendingIds: ReadonlySet<string>;
  /** Devuelve true si se ha apuntado (y el campo se puede vaciar). */
  onAdd: (text: string) => boolean;
}

export function AddBar({ catalog, pendingIds, onAdd }: Props) {
  const inputId = useId();
  const listId = useId();
  const [text, setText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(() => suggest(text, catalog, pendingIds), [text, catalog, pendingIds]);

  function add(value: string) {
    if (onAdd(value)) setText('');
    // El foco se queda en el campo para apuntar varias cosas seguidas.
    inputRef.current?.focus();
  }

  function submit(e: SubmitEvent) {
    e.preventDefault();
    add(text);
  }

  return (
    <>
      {suggestions.length > 0 && (
        <ul id={listId} className="suggestions" aria-label="Apuntado otras veces">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                // pointerdown evita que el campo pierda el foco y el teclado se cierre.
                onPointerDown={(e) => e.preventDefault()}
                onClick={() => add(s.name)}
              >
                <HistoryIcon />
                {s.name}
              </button>
            </li>
          ))}
        </ul>
      )}
      <form className="addbar" onSubmit={submit}>
        <label htmlFor={inputId} className="visually-hidden">
          Apuntar un producto
        </label>
        <input
          ref={inputRef}
          id={inputId}
          className="input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Apunta lo que falte…"
          autoComplete="off"
          autoCorrect="on"
          autoCapitalize="sentences"
          enterKeyHint="done"
          maxLength={60}
          aria-controls={suggestions.length > 0 ? listId : undefined}
        />
        <button type="submit" className="btn addbar__btn" aria-label="Añadir" disabled={!text.trim()}>
          <PlusIcon />
        </button>
      </form>
    </>
  );
}
