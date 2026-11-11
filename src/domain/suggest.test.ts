import { describe, expect, it } from 'vitest';
import { suggest, type CatalogEntry } from './suggest';

const entry = (name: string, uses = 1): CatalogEntry => ({
  id: name.toLowerCase().replaceAll(' ', '-'),
  name,
  category: 'otros',
  uses,
});

const catalog = [
  entry('Leche', 10),
  entry('Lechuga', 3),
  entry('Pan de molde', 5),
  entry('Mantequilla', 2),
  entry('Champiñones', 1),
];

const names = (list: CatalogEntry[]) => list.map((e) => e.name);

describe('suggest', () => {
  it('necesita al menos dos letras', () => {
    expect(suggest('l', catalog, new Set())).toEqual([]);
  });

  it('busca por inicio de cualquier palabra, sin tildes', () => {
    expect(names(suggest('le', catalog, new Set()))).toEqual(['Leche', 'Lechuga']);
    expect(names(suggest('mol', catalog, new Set()))).toEqual(['Pan de molde']);
    expect(names(suggest('champi', catalog, new Set()))).toEqual(['Champiñones']);
  });

  it('prioriza lo que empieza por lo escrito y luego lo más usado', () => {
    const list = [entry('Pan de molde', 1), entry('Molde de horno', 1), entry('Molletes', 9)];
    expect(names(suggest('mol', list, new Set()))).toEqual(['Molletes', 'Molde de horno', 'Pan de molde']);
  });

  it('no sugiere lo que ya está pendiente', () => {
    expect(names(suggest('le', catalog, new Set(['leche'])))).toEqual(['Lechuga']);
  });

  it('no sugiere lo que ya está escrito entero', () => {
    expect(names(suggest('leche', catalog, new Set()))).toEqual([]);
  });

  it('respeta el máximo', () => {
    const many = Array.from({ length: 10 }, (_, i) => entry(`Pera ${i}`));
    expect(suggest('pe', many, new Set(), 3)).toHaveLength(3);
  });
});
