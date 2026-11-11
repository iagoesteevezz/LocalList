import { describe, expect, it } from 'vitest';
import { decideAdd } from './add';
import type { Item } from './types';

const item = (name: string, extra: Partial<Item> = {}): Item => ({
  id: name.toLowerCase(),
  name,
  qty: 1,
  done: false,
  category: 'otros',
  ...extra,
});

describe('decideAdd', () => {
  it('rechaza nombres vacíos', () => {
    expect(decideAdd('   ', []).kind).toBe('invalid');
    expect(decideAdd('!!', []).kind).toBe('invalid');
  });

  it('añade lo nuevo con nombre limpio, id y categoría', () => {
    expect(decideAdd('  leche   entera', [])).toEqual({
      kind: 'add',
      item: { id: 'leche-entera', name: 'Leche entera', category: 'lacteos_huevos' },
    });
  });

  it('si ya está pendiente, lo dice (para ofrecer sumar 1)', () => {
    const leche = item('Leche');
    expect(decideAdd('leches', [leche])).toEqual({ kind: 'already-pending', existing: leche });
  });

  it('si estaba en el carro, vuelve a la lista', () => {
    const leche = item('Leche', { done: true });
    expect(decideAdd('Leche', [leche])).toEqual({ kind: 'back-from-cart', existing: leche });
  });

  it('una probable errata pregunta antes', () => {
    const yogur = item('Yogur natural', { id: 'yogur-natural' });
    const decision = decideAdd('yogur nautral', [yogur]);
    expect(decision.kind).toBe('maybe-typo');
  });

  it('usa la categoría que la familia corrigió en el catálogo', () => {
    const decision = decideAdd('Leche', [], [{ id: 'leche', name: 'Leche', category: 'desayuno', uses: 3 }]);
    expect(decision).toEqual({ kind: 'add', item: { id: 'leche', name: 'Leche', category: 'desayuno' } });
  });
});
