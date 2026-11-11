// Editor de un supermercado: nombre, pasillos en el orden del recorrido,
// qué secciones hay en cada pasillo y excepciones por producto.
// Se edita un borrador; nada se guarda hasta pulsar "Guardar".

import { useId, useMemo, useRef, useState } from 'react';
import { deleteStore, saveStore } from '../../data/stores';
import { CATEGORIES, getCategory, type CategoryId } from '../../domain/categories';
import {
  MAX_AISLES,
  addAisle,
  draftProblems,
  moveAisle,
  normalizeDraft,
  removeAisle,
  removeOverride,
  renameAisle,
  setAisleCategories,
  uncoveredCategories,
  type StoreDraft,
} from '../../domain/storeEdit';
import type { CatalogEntry } from '../../domain/suggest';
import { navigate } from '../../lib/useHashRoute';
import { useDockHeight } from '../../lib/useViewportVars';
import { BackIcon, ChevronDownIcon, ChevronUpIcon, PlusIcon, TrashIcon } from '../../ui/icons';
import { Sheet } from '../../ui/Sheet';
import { useToast } from '../../ui/useToast';

interface Props {
  familyId: string;
  /** undefined = supermercado nuevo. */
  storeId?: string;
  initial: StoreDraft;
  catalog: readonly CatalogEntry[];
}

/** "papel-higienico" → "Papel higienico" cuando el producto ya no está en el catálogo. */
function prettyId(id: string): string {
  const text = id.replaceAll('-', ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function StoreEditor({ familyId, storeId, initial, catalog }: Props) {
  const toast = useToast();
  const nameId = useId();
  const [draft, setDraft] = useState(initial);
  const [editingAisle, setEditingAisle] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<'leave' | 'delete' | null>(null);
  const [triedSave, setTriedSave] = useState(false);
  const dock = useRef<HTMLDivElement>(null);
  useDockHeight(dock);

  // Un súper nuevo no existe hasta que se guarda: salir sin guardar siempre pregunta.
  const dirty = !storeId || JSON.stringify(draft) !== JSON.stringify(initial);
  const problems = draftProblems(draft);
  const uncovered = uncoveredCategories(draft);
  const names = useMemo(() => new Map(catalog.map((e) => [e.id, e.name])), [catalog]);
  const aisleIndex = useMemo(() => new Map(draft.aisles.map((a, i) => [a.id, i])), [draft.aisles]);
  const editing = draft.aisles.find((a) => a.id === editingAisle) ?? null;

  function back() {
    if (dirty) setConfirm('leave');
    else navigate('familia');
  }

  function save() {
    setTriedSave(true);
    if (problems.length > 0) return;
    saveStore(familyId, normalizeDraft(draft), storeId);
    toast({ message: `Guardado: ${draft.name.trim()}` });
    navigate('familia');
  }

  function remove() {
    if (!storeId) return;
    deleteStore(familyId, storeId);
    const snapshot = normalizeDraft(initial);
    toast({
      message: `Borrado: ${initial.name}`,
      action: { label: 'Deshacer', run: () => saveStore(familyId, snapshot, storeId) },
    });
    navigate('familia');
  }

  return (
    <>
      <header className="board-header">
        <div className="board-header__row board-header__row--nav">
          <button type="button" className="icon-btn icon-btn--board" onClick={back} aria-label="Volver">
            <BackIcon />
          </button>
          <h1>{storeId ? 'Editar supermercado' : 'Nuevo supermercado'}</h1>
        </div>
      </header>

      <main className="content">
        <div className="field section">
          <label htmlFor={nameId}>Nombre</label>
          <input
            id={nameId}
            className="input"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            placeholder="Spar de la esquina"
            maxLength={40}
            autoComplete="off"
          />
          {triedSave && problems.includes('sin-nombre') && <p className="error">Ponle un nombre.</p>}
        </div>

        <section className="section" aria-labelledby="pasillos">
          <h2 id="pasillos">Pasillos, en el orden en que los recorres</h2>
          {draft.aisles.length > 0 && (
            <ol className="rows aisles">
              {draft.aisles.map((aisle, i) => (
                <li key={aisle.id} className="aisle">
                  <span className="aisle__num tabular" aria-hidden="true">
                    {i + 1}
                  </span>
                  <div className="aisle__main">
                    <input
                      className="input aisle__name"
                      value={aisle.name}
                      onChange={(e) => setDraft(renameAisle(draft, aisle.id, e.target.value))}
                      placeholder="Nombre del pasillo"
                      aria-label={`Nombre del pasillo ${i + 1}`}
                      maxLength={40}
                      autoComplete="off"
                    />
                    <button type="button" className="aisle__cats" onClick={() => setEditingAisle(aisle.id)}>
                      {aisle.categories.length > 0
                        ? aisle.categories.map((c) => getCategory(c).name).join(', ')
                        : 'Elegir qué hay en este pasillo'}
                    </button>
                  </div>
                  <div className="aisle__move">
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setDraft(moveAisle(draft, aisle.id, -1))}
                      disabled={i === 0}
                      aria-label={`Subir pasillo ${i + 1}`}
                    >
                      <ChevronUpIcon />
                    </button>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setDraft(moveAisle(draft, aisle.id, 1))}
                      disabled={i === draft.aisles.length - 1}
                      aria-label={`Bajar pasillo ${i + 1}`}
                    >
                      <ChevronDownIcon />
                    </button>
                  </div>
                </li>
              ))}
            </ol>
          )}
          {triedSave && problems.includes('sin-pasillos') && <p className="error">Añade al menos un pasillo.</p>}
          {triedSave && problems.includes('pasillo-sin-nombre') && (
            <p className="error">Hay un pasillo sin nombre.</p>
          )}
          <button
            type="button"
            className="btn btn--outline btn--block section__action"
            onClick={() => {
              const next = addAisle(draft);
              setDraft(next);
              setEditingAisle(next.aisles.at(-1)?.id ?? null);
            }}
            disabled={draft.aisles.length >= MAX_AISLES}
          >
            <PlusIcon />
            Añadir pasillo
          </button>
        </section>

        {uncovered.length > 0 && draft.aisles.length > 0 && (
          <p className="notice">
            <strong>Sin pasillo:</strong> {uncovered.map((c) => getCategory(c).name).join(', ')}. Lo de esas secciones
            aparecerá aparte, como «sin pasillo».
          </p>
        )}

        {Object.keys(draft.overrides).length > 0 && (
          <section className="section" aria-labelledby="excepciones">
            <h2 id="excepciones">Productos que están en otro sitio</h2>
            <ul className="rows">
              {Object.entries(draft.overrides)
                .filter(([, aisleId]) => aisleIndex.has(aisleId))
                .map(([itemId, aisleId]) => (
                  <li key={itemId} className="row override">
                    <span className="override__text">
                      <strong>{names.get(itemId) ?? prettyId(itemId)}</strong>
                      <span className="muted">
                        Pasillo {aisleIndex.get(aisleId)! + 1}
                      </span>
                    </span>
                    <button
                      type="button"
                      className="icon-btn"
                      onClick={() => setDraft(removeOverride(draft, itemId))}
                      aria-label={`Quitar excepción de ${names.get(itemId) ?? prettyId(itemId)}`}
                    >
                      <TrashIcon />
                    </button>
                  </li>
                ))}
            </ul>
          </section>
        )}

        {storeId && (
          <section className="section">
            <button type="button" className="btn btn--quiet btn--block" onClick={() => setConfirm('delete')}>
              Borrar este supermercado
            </button>
          </section>
        )}
      </main>

      <div className="dock" ref={dock}>
        <div className="dock__inner savebar">
          <button type="button" className="btn btn--block" onClick={save}>
            Guardar
          </button>
        </div>
      </div>

      <AisleSheet
        aisle={editing}
        number={editing ? aisleIndex.get(editing.id)! + 1 : 0}
        draft={draft}
        onClose={() => setEditingAisle(null)}
        onCategories={(cats) => editing && setDraft(setAisleCategories(draft, editing.id, cats))}
        onRemove={() => {
          if (!editing) return;
          setDraft(removeAisle(draft, editing.id));
          setEditingAisle(null);
        }}
      />

      <Sheet open={confirm === 'leave'} onClose={() => setConfirm(null)} title="¿Salir sin guardar?">
        <p className="sheet__text">Se perderán los cambios que has hecho en este supermercado.</p>
        <div className="sheet__actions">
          <button type="button" className="btn btn--block" onClick={() => setConfirm(null)}>
            Seguir editando
          </button>
          <button type="button" className="btn btn--danger btn--block" onClick={() => navigate('familia')}>
            Salir sin guardar
          </button>
        </div>
      </Sheet>

      <Sheet open={confirm === 'delete'} onClose={() => setConfirm(null)} title={`¿Borrar «${initial.name}»?`}>
        <p className="sheet__text">La lista de la compra no se toca; solo se olvida cómo está ordenado este súper.</p>
        <div className="sheet__actions">
          <button type="button" className="btn btn--block" onClick={() => setConfirm(null)}>
            No borrar
          </button>
          <button type="button" className="btn btn--danger btn--block" onClick={remove}>
            Borrar
          </button>
        </div>
      </Sheet>
    </>
  );
}

function AisleSheet({
  aisle,
  number,
  draft,
  onClose,
  onCategories,
  onRemove,
}: {
  aisle: StoreDraft['aisles'][number] | null;
  number: number;
  draft: StoreDraft;
  onClose: () => void;
  onCategories: (categories: CategoryId[]) => void;
  onRemove: () => void;
}) {
  // En qué pasillo está ahora cada categoría (para avisar al moverla).
  const owner = new Map<CategoryId, number>();
  draft.aisles.forEach((a, i) => a.categories.forEach((c) => owner.set(c, i + 1)));

  return (
    <Sheet open={aisle !== null} onClose={onClose} title={`Pasillo ${number}${aisle?.name ? `: ${aisle.name}` : ''}`}>
      {aisle && (
        <>
          <fieldset className="checks">
            <legend>¿Qué hay en este pasillo?</legend>
            {CATEGORIES.map((c) => {
              const checked = aisle.categories.includes(c.id);
              const elsewhere = !checked ? owner.get(c.id) : undefined;
              return (
                <label key={c.id} className="check">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) =>
                      onCategories(
                        e.target.checked ? [...aisle.categories, c.id] : aisle.categories.filter((x) => x !== c.id),
                      )
                    }
                  />
                  <span>
                    {c.name}
                    {elsewhere !== undefined && <span className="muted check__hint"> · ahora en el {elsewhere}</span>}
                  </span>
                </label>
              );
            })}
          </fieldset>
          <div className="sheet__actions">
            <button type="button" className="btn btn--block" onClick={onClose}>
              Listo
            </button>
            <button type="button" className="btn btn--danger btn--block" onClick={onRemove}>
              Quitar este pasillo
            </button>
          </div>
        </>
      )}
    </Sheet>
  );
}
