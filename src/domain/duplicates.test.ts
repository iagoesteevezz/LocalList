import { describe, expect, it } from 'vitest';
import { findMatch } from './duplicates';

const list = (...names: string[]) => names.map((name) => ({ name }));

describe('findMatch', () => {
  it('detecta el mismo producto (plural, mayúsculas, tildes)', () => {
    expect(findMatch('salchichas', list('Salchicha'))?.kind).toBe('same');
    expect(findMatch('ATUN', list('Atún'))?.kind).toBe('same');
    expect(findMatch('pasta de dientes', list('Pasta dientes'))?.kind).toBe('same');
  });

  it('detecta erratas como "parecido", no como "igual"', () => {
    expect(findMatch('yogur nautral', list('Yogur natural'))?.kind).toBe('similar');
    expect(findMatch('mantequlla', list('Mantequilla'))?.kind).toBe('similar');
  });

  it('prefiere el igual aunque antes haya uno parecido', () => {
    const match = findMatch('Leche entera', list('Leche entero', 'Leche entera'));
    expect(match).toEqual({ kind: 'same', item: { name: 'Leche entera' } });
  });

  it('no confunde productos distintos que se escriben parecido', () => {
    expect(findMatch('pollo', list('Bollo'))).toBeNull(); // ambas palabras reales
    expect(findMatch('pasa', list('Pasta'))).toBeNull(); // palabra corta
    expect(findMatch('jamón cocido', list('Jamón serrano'))).toBeNull();
    expect(findMatch('leche', list('Leche entera'))).toBeNull(); // distinto nº de palabras
    expect(findMatch('limón', list('Melón'))).toBeNull();
  });

  it('ignora nombres vacíos', () => {
    expect(findMatch('   ', list('Leche'))).toBeNull();
  });
});
