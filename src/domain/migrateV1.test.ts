import { describe, expect, it } from 'vitest';
import { planV1Import } from './migrateV1';
import { MERCADONA_MELENARA } from './templates';

const plan = (data: Record<string, unknown>, existing: string[] = []) =>
  planV1Import(data, new Set(existing), MERCADONA_MELENARA);

describe('planV1Import', () => {
  it('lo no marcado va a la lista; lo marcado (ya hay en casa) solo al catálogo', () => {
    const p = plan({
      productos_p1: ['plátanos', 'Tomates'],
      productos_p4: ['Leche'],
      cantidad_Leche: 3,
      tachado_Tomates: true,
    });
    expect(p.items.map((i) => [i.id, i.name, i.qty, i.done])).toEqual([
      ['platano', 'Plátanos', 1, false],
      ['leche', 'Leche', 3, false],
    ]);
    expect(p.known.map((i) => [i.id, i.name, i.category])).toEqual([['tomate', 'Tomates', 'frutas_verduras']]);
  });

  it('solo crea excepción cuando la categoría lo llevaría a otro pasillo', () => {
    const p = plan({
      productos_p1: ['Plátanos'], // fruta → p1 por categoría: sin excepción
      productos_p5: ['Papas'], // en la V1 estaban en "Precocinados / papas" (p5), la categoría diría p1
      productos_p7: ['Regalo cumpleaños'], // "otros": sin pasillo por categoría → excepción a p7
    });
    expect(p.overrides).toEqual({ papa: 'p5', 'regalo-cumpleano': 'p7' });
  });

  it('respeta lo que ya existe en la V2 y no duplica', () => {
    const p = plan({ productos_p1: ['Leche', 'leches', 'Pan'] }, ['pan']);
    expect(p.items.map((i) => i.id)).toEqual(['leche']);
    expect(p.skipped).toEqual(['Pan']);
  });

  it('limita cantidades raras e ignora basura', () => {
    const p = plan({
      productos_p2: ['Atún', '  ', 42, '!!'],
      cantidad_Atún: 500,
      otro_campo: 'x',
    });
    expect(p.items.map((i) => [i.name, i.qty])).toEqual([['Atún', 99]]);
    expect(p.invalid).toEqual(['  ', '!!']);
  });

  it('documento vacío → nada que importar', () => {
    expect(plan({})).toEqual({ items: [], known: [], overrides: {}, skipped: [], invalid: [] });
  });
});
