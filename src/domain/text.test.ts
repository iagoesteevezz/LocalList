import { describe, expect, it } from 'vitest';
import { cleanName, editDistance, normalize, productId, productKey, singular } from './text';

describe('normalize', () => {
  it('quita tildes, eñes, mayúsculas y signos', () => {
    expect(normalize('  Champiñones  (Bandeja)! ')).toBe('champinones bandeja');
    expect(normalize('Coca-Cola Zero')).toBe('coca cola zero');
    expect(normalize('Pingüino')).toBe('pinguino');
  });
});

describe('singular', () => {
  it.each([
    ['tomates', 'tomate'],
    ['patatas', 'patata'],
    ['huevos', 'huevo'],
    ['limones', 'limon'],
    ['yogures', 'yogur'],
    ['nueces', 'nuez'],
    ['guisantes', 'guisante'],
    ['champinones', 'champinon'],
    ['arroz', 'arroz'],
    ['pan', 'pan'],
    ['gas', 'gas'], // palabras cortas se dejan igual
  ])('%s → %s', (plural, expected) => {
    expect(singular(plural)).toBe(expected);
  });
});

describe('productKey / productId', () => {
  it('trata plural y singular como el mismo producto', () => {
    expect(productKey('Salchichas')).toBe(productKey('salchicha'));
    expect(productKey('Tomates')).toBe(productKey('tomate'));
  });

  it('ignora palabras vacías y tildes', () => {
    expect(productKey('Pasta de dientes')).toBe('pasta diente');
    expect(productKey('Atún')).toBe(productKey('atun'));
  });

  it('genera ids válidos para Firestore', () => {
    expect(productId('Papel higiénico')).toBe('papel-higienico');
    expect(productId('Leche 1/2 desnatada')).toBe('leche-1-2-desnatada');
    expect(productId('a/b/../c')).toMatch(/^[a-z0-9-]+$/);
  });

  it('devuelve null si no hay nada útil', () => {
    expect(productId('  !!  ')).toBeNull();
    expect(productId('🍌')).toBeNull();
    expect(productId('de la')).toBeNull();
  });
});

describe('cleanName', () => {
  it('limpia espacios y pone mayúscula inicial', () => {
    expect(cleanName('  leche    entera ')).toBe('Leche entera');
    expect(cleanName('ñame')).toBe('Ñame');
  });

  it('limita la longitud', () => {
    expect(cleanName('x'.repeat(200))).toHaveLength(60);
  });
});

describe('editDistance', () => {
  it('cuenta ediciones', () => {
    expect(editDistance('pollo', 'bollo')).toBe(1); // cambio
    expect(editDistance('mantequilla', 'mantequlla')).toBe(1); // borrado
    expect(editDistance('', 'abc')).toBe(3);
    expect(editDistance('igual', 'igual')).toBe(0);
  });

  it('un intercambio de letras vecinas cuenta como un error', () => {
    expect(editDistance('natural', 'nautral')).toBe(1);
    expect(editDistance('leche', 'lehce')).toBe(1);
  });
});
