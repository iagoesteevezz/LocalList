import { describe, expect, it } from 'vitest';
import { CATEGORIES, CATEGORY_IDS, detectCategory, getCategory } from './categories';

describe('detectCategory', () => {
  // Casos que la V2 anterior clasificaba mal por buscar subcadenas
  // ("te" dentro de "aceite", "ron" dentro de "macarrones"...).
  it.each([
    ['Aceite', 'despensa'],
    ['Detergente', 'limpieza'],
    ['Cacahuetes', 'snacks'],
    ['Macarrones', 'pasta_salsas'],
    ['Pasta de dientes', 'higiene'],
    ['Crema solar', 'higiene'],
    ['Pañuelos', 'limpieza'],
  ])('regresión: %s → %s', (name, expected) => {
    expect(detectCategory(name)).toBe(expected);
  });

  it.each([
    ['Leche', 'lacteos_huevos'],
    ['Huevos', 'lacteos_huevos'],
    ['Plátanos', 'frutas_verduras'],
    ['Pan de molde', 'panaderia'],
    ['Salchichas', 'charcuteria'],
    ['Pechuga de pollo', 'carne'],
    ['Té verde', 'desayuno'],
    ['Ron miel', 'bebidas'],
    ['Sal', 'despensa'],
  ])('%s → %s', (name, expected) => {
    expect(detectCategory(name)).toBe(expected);
  });

  it('la frase más larga gana a la palabra suelta', () => {
    expect(detectCategory('Tomate frito')).toBe('pasta_salsas');
    expect(detectCategory('Tomates')).toBe('frutas_verduras');
    expect(detectCategory('Papas fritas')).toBe('snacks');
    expect(detectCategory('Crema de cacao')).toBe('desayuno');
    expect(detectCategory('Atún en lata')).toBe('despensa');
    expect(detectCategory('Atún fresco')).toBe('pescado');
  });

  it('a igual longitud, gana la palabra que va primero', () => {
    expect(detectCategory('Zumo de naranja')).toBe('bebidas');
    expect(detectCategory('Yogur de fresa')).toBe('lacteos_huevos');
    expect(detectCategory('Helado de chocolate')).toBe('congelados');
  });

  it('entiende vocabulario canario', () => {
    expect(detectCategory('Papas')).toBe('frutas_verduras');
    expect(detectCategory('Millo')).toBe('frutas_verduras');
    expect(detectCategory('Gofio')).toBe('desayuno');
    expect(detectCategory('Mojo picón')).toBe('pasta_salsas');
    expect(detectCategory('Cotufas')).toBe('snacks');
    expect(detectCategory('Clipper de fresa')).toBe('bebidas');
  });

  // Productos reales de la familia que la primera versión del diccionario no conocía.
  it.each([
    ['Fairy', 'limpieza'],
    ['Somát lavaplatos', 'limpieza'],
    ['Clinex', 'limpieza'],
    ['Perfumador lavadora', 'limpieza'],
    ['Mecheros', 'limpieza'],
    ['Anti mosquitos caja pastillas', 'limpieza'],
    ['Ali Oli', 'pasta_salsas'],
    ['Stevia', 'despensa'],
    ['Kebab', 'precocinados'],
    ['Friskis Gelín', 'mascotas'],
    ['Salva slip', 'higiene'],
    ['Discos desmaquilladores', 'higiene'],
    ['Alcohol 70 spray', 'higiene'],
    ['Sérum Repair Plex pelo', 'higiene'],
    ['Gotas hidratantes ojos', 'higiene'],
    ['Vitamina C', 'higiene'],
    ['Agua micelar', 'higiene'],
  ])('vocabulario de casa: %s → %s', (name, expected) => {
    expect(detectCategory(name)).toBe(expected);
  });

  it('no inventa: lo desconocido va a "otros"', () => {
    expect(detectCategory('Regalo cumpleaños')).toBe('otros');
    expect(detectCategory('')).toBe('otros');
  });
});

describe('catálogo de categorías', () => {
  it('cada id tiene su categoría visible y viceversa', () => {
    expect(CATEGORIES.map((c) => c.id)).toEqual([...CATEGORY_IDS]);
  });

  it('getCategory cae en "otros" con ids desconocidos', () => {
    expect(getCategory('no-existe').id).toBe('otros');
  });
});
