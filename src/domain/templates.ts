// Plantillas de supermercado para no empezar de cero.
// Sustituyen a la "comunidad" de la V2 anterior (que permitía XSS y vandalismo):
// las plantillas viven en el código y las revisa quien mantiene la app.

import type { Store } from './types';

export type StoreTemplate = Omit<Store, 'id'>;

/**
 * Mercadona Cruce de Melenara (Telde), según la distribución de la V1.
 * Los ids "p1".."p7" coinciden con los campos productos_p1..7 de la V1,
 * lo que simplifica la migración.
 */
export const MERCADONA_MELENARA: StoreTemplate = {
  name: 'Mercadona Cruce de Melenara',
  icon: '🛒',
  aisles: [
    { id: 'p1', name: 'Fruta, verdura y congelados', icon: '🍎', categories: ['frutas_verduras', 'congelados'] },
    { id: 'p2', name: 'Carne, embutido, arroz y latas', icon: '🥩', categories: ['carne', 'pescado', 'charcuteria', 'despensa'] },
    { id: 'p3', name: 'Salsas, pasta y frutos secos', icon: '🍝', categories: ['pasta_salsas'] },
    { id: 'p4', name: 'Nevera y bebidas', icon: '🥛', categories: ['lacteos_huevos', 'bebidas'] },
    { id: 'p5', name: 'Precocinados y papas', icon: '🍕', categories: ['precocinados', 'snacks'] },
    { id: 'p6', name: 'Cereales, leche y cuidado personal', icon: '🥣', categories: ['desayuno', 'higiene'] },
    { id: 'p7', name: 'Pan, galletas, café y limpieza', icon: '🍞', categories: ['panaderia', 'limpieza', 'mascotas'] },
  ],
  // Lo que en este súper no está donde diría su categoría.
  overrides: {
    leche: 'p6',
    galleta: 'p7',
    cafe: 'p7',
    almendra: 'p3',
    nuez: 'p3',
    cacahuete: 'p3',
    pistacho: 'p3',
    anacardo: 'p3',
    'fruto-seco': 'p3',
  },
};

export const TEMPLATES: readonly StoreTemplate[] = [MERCADONA_MELENARA];
