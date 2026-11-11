import { describe, expect, it } from 'vitest';
import {
  addAisle,
  draftFromTemplate,
  draftProblems,
  emptyDraft,
  moveAisle,
  normalizeDraft,
  removeAisle,
  removeOverride,
  renameAisle,
  setAisleCategories,
  uncoveredCategories,
} from './storeEdit';
import { MERCADONA_MELENARA } from './templates';

const ids = (d: { aisles: { id: string }[] }) => d.aisles.map((a) => a.id);

describe('edición de supermercados', () => {
  it('la plantilla se copia (editar el borrador no toca la plantilla)', () => {
    const draft = draftFromTemplate(MERCADONA_MELENARA);
    const edited = renameAisle(draft, 'p1', 'Otra cosa');
    expect(MERCADONA_MELENARA.aisles[0]!.name).not.toBe('Otra cosa');
    expect(edited.aisles[0]!.name).toBe('Otra cosa');
  });

  it('añade pasillos con id propio y estable', () => {
    let d = addAisle(emptyDraft(), 'Fruta', 'x1');
    d = addAisle(d, 'Carne', 'x2');
    expect(ids(d)).toEqual(['x1', 'x2']);
    expect(addAisle(emptyDraft()).aisles[0]!.id).toMatch(/^a[0-9a-f]{10}$/);
  });

  it('mueve pasillos sin cambiar su id', () => {
    const d = draftFromTemplate(MERCADONA_MELENARA);
    expect(ids(moveAisle(d, 'p3', -1)).slice(0, 4)).toEqual(['p1', 'p3', 'p2', 'p4']);
    expect(ids(moveAisle(d, 'p1', -1))).toEqual(ids(d)); // ya es el primero
    expect(ids(moveAisle(d, 'p7', 1))).toEqual(ids(d)); // ya es el último
  });

  it('al borrar un pasillo se quitan sus excepciones', () => {
    const d = draftFromTemplate(MERCADONA_MELENARA);
    const without = removeAisle(d, 'p6');
    expect(ids(without)).not.toContain('p6');
    expect(without.overrides.leche).toBeUndefined();
    expect(without.overrides.galleta).toBe('p7');
  });

  it('una categoría solo puede estar en un pasillo', () => {
    const d = draftFromTemplate(MERCADONA_MELENARA);
    const moved = setAisleCategories(d, 'p3', ['pasta_salsas', 'snacks']);
    expect(moved.aisles.find((a) => a.id === 'p3')!.categories).toEqual(['pasta_salsas', 'snacks']);
    expect(moved.aisles.find((a) => a.id === 'p5')!.categories).toEqual(['precocinados']);
  });

  it('detecta categorías sin pasillo', () => {
    expect(uncoveredCategories(draftFromTemplate(MERCADONA_MELENARA))).toEqual([]);
    const d = setAisleCategories(draftFromTemplate(MERCADONA_MELENARA), 'p7', ['panaderia']);
    expect(uncoveredCategories(d)).toEqual(['limpieza', 'mascotas']);
  });

  it('quita una excepción', () => {
    const d = removeOverride(draftFromTemplate(MERCADONA_MELENARA), 'leche');
    expect(d.overrides.leche).toBeUndefined();
  });

  it('valida lo mínimo para guardar', () => {
    expect(draftProblems(emptyDraft())).toEqual(['sin-nombre', 'sin-pasillos']);
    const d = addAisle({ ...emptyDraft(), name: 'Spar' }, '  ');
    expect(draftProblems(d)).toEqual(['pasillo-sin-nombre']);
    expect(draftProblems(draftFromTemplate(MERCADONA_MELENARA))).toEqual([]);
  });

  it('normaliza antes de guardar', () => {
    const d = normalizeDraft(addAisle({ ...emptyDraft(), name: '  Spar  ' }, ' Fruta ', 'x1'));
    expect(d).toEqual({ name: 'Spar', icon: 'cart', aisles: [{ id: 'x1', name: 'Fruta', categories: [] }], overrides: {} });
  });
});
