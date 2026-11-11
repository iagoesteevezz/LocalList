// Edición de supermercados: operaciones puras sobre un borrador.
// La pantalla edita una copia y solo al pulsar "Guardar" se escribe todo junto.

import { CATEGORY_IDS, type CategoryId } from './categories';
import type { StoreTemplate } from './templates';
import type { Aisle, Store } from './types';

export type StoreDraft = Omit<Store, 'id'>;

export const MAX_AISLES = 40;

/** Id corto y aleatorio para un pasillo nuevo (estable aunque se renombre o se mueva). */
export function newAisleId(): string {
  return 'a' + crypto.randomUUID().replaceAll('-', '').slice(0, 10);
}

export function emptyDraft(): StoreDraft {
  return { name: '', icon: 'cart', aisles: [], overrides: {} };
}

export function draftFromTemplate(template: StoreTemplate): StoreDraft {
  return structuredClone(template);
}

export function addAisle(draft: StoreDraft, name = '', id = newAisleId()): StoreDraft {
  if (draft.aisles.length >= MAX_AISLES) return draft;
  return { ...draft, aisles: [...draft.aisles, { id, name, categories: [] }] };
}

export function renameAisle(draft: StoreDraft, aisleId: string, name: string): StoreDraft {
  return { ...draft, aisles: draft.aisles.map((a) => (a.id === aisleId ? { ...a, name } : a)) };
}

/** Mueve un pasillo una posición arriba (-1) o abajo (+1) en el recorrido. */
export function moveAisle(draft: StoreDraft, aisleId: string, delta: -1 | 1): StoreDraft {
  const from = draft.aisles.findIndex((a) => a.id === aisleId);
  const to = from + delta;
  if (from === -1 || to < 0 || to >= draft.aisles.length) return draft;
  const aisles = [...draft.aisles];
  const [moved] = aisles.splice(from, 1);
  aisles.splice(to, 0, moved!);
  return { ...draft, aisles };
}

/** Quita el pasillo y las excepciones que apuntaban a él (esos productos vuelven a ir por categoría). */
export function removeAisle(draft: StoreDraft, aisleId: string): StoreDraft {
  const overrides = Object.fromEntries(Object.entries(draft.overrides).filter(([, a]) => a !== aisleId));
  return { ...draft, aisles: draft.aisles.filter((a) => a.id !== aisleId), overrides };
}

/**
 * Fija las categorías de un pasillo. Una categoría solo puede estar en UN
 * pasillo: si se marca aquí, se quita de donde estuviera.
 */
export function setAisleCategories(draft: StoreDraft, aisleId: string, categories: readonly CategoryId[]): StoreDraft {
  const chosen = new Set(categories);
  const aisles: Aisle[] = draft.aisles.map((a) =>
    a.id === aisleId
      ? { ...a, categories: CATEGORY_IDS.filter((c) => chosen.has(c)) }
      : { ...a, categories: a.categories.filter((c) => !chosen.has(c)) },
  );
  return { ...draft, aisles };
}

export function removeOverride(draft: StoreDraft, itemId: string): StoreDraft {
  const overrides = { ...draft.overrides };
  delete overrides[itemId];
  return { ...draft, overrides };
}

/** Categorías que no están en ningún pasillo: sus productos saldrán como "sin pasillo". */
export function uncoveredCategories(draft: StoreDraft): CategoryId[] {
  const covered = new Set(draft.aisles.flatMap((a) => a.categories));
  return CATEGORY_IDS.filter((c) => c !== 'otros' && !covered.has(c));
}

export type DraftProblem = 'sin-nombre' | 'sin-pasillos' | 'pasillo-sin-nombre';

export function draftProblems(draft: StoreDraft): DraftProblem[] {
  const problems: DraftProblem[] = [];
  if (!draft.name.trim()) problems.push('sin-nombre');
  if (draft.aisles.length === 0) problems.push('sin-pasillos');
  if (draft.aisles.some((a) => !a.name.trim())) problems.push('pasillo-sin-nombre');
  return problems;
}

/** Limpia el borrador para guardarlo: nombres recortados y sin campos vacíos. */
export function normalizeDraft(draft: StoreDraft): StoreDraft {
  return {
    name: draft.name.trim().slice(0, 40),
    icon: draft.icon || 'cart',
    aisles: draft.aisles.map((a) => ({ id: a.id, name: a.name.trim().slice(0, 40), categories: [...a.categories] })),
    overrides: { ...draft.overrides },
  };
}
