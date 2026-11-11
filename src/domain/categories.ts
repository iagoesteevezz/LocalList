// Categorías de producto y detección automática.
//
// Cómo encaja con los supermercados: cada PASILLO de un súper declara qué
// CATEGORÍAS contiene. Así un producto nuevo cae en su pasillo sin que nadie
// tenga que asignarlo a mano (el gran fallo de la V2 anterior).
// Por eso las categorías son algo más finas que las de una lista normal:
// cuanto más finas, mejor encajan en súpers con distribuciones distintas.

import { tokens } from './text';

export const CATEGORY_IDS = [
  'frutas_verduras',
  'carne',
  'pescado',
  'charcuteria',
  'lacteos_huevos',
  'panaderia',
  'desayuno',
  'despensa',
  'pasta_salsas',
  'snacks',
  'congelados',
  'precocinados',
  'bebidas',
  'limpieza',
  'higiene',
  'mascotas',
  'otros',
] as const;

export type CategoryId = (typeof CATEGORY_IDS)[number];

export interface Category {
  id: CategoryId;
  name: string;
  emoji: string;
}

/** En este orden se muestran los grupos en la lista de casa. */
export const CATEGORIES: readonly Category[] = [
  { id: 'frutas_verduras', name: 'Fruta y verdura', emoji: '🥬' },
  { id: 'carne', name: 'Carne', emoji: '🥩' },
  { id: 'pescado', name: 'Pescado y marisco', emoji: '🐟' },
  { id: 'charcuteria', name: 'Charcutería', emoji: '🥓' },
  { id: 'lacteos_huevos', name: 'Lácteos y huevos', emoji: '🥛' },
  { id: 'panaderia', name: 'Pan y bollería', emoji: '🍞' },
  { id: 'desayuno', name: 'Desayuno', emoji: '🥣' },
  { id: 'despensa', name: 'Despensa', emoji: '🫙' },
  { id: 'pasta_salsas', name: 'Pasta y salsas', emoji: '🍝' },
  { id: 'snacks', name: 'Picoteo y dulces', emoji: '🥜' },
  { id: 'congelados', name: 'Congelados', emoji: '🧊' },
  { id: 'precocinados', name: 'Platos preparados', emoji: '🍕' },
  { id: 'bebidas', name: 'Bebidas', emoji: '🥤' },
  { id: 'limpieza', name: 'Limpieza y hogar', emoji: '🧽' },
  { id: 'higiene', name: 'Higiene personal', emoji: '🧴' },
  { id: 'mascotas', name: 'Mascotas', emoji: '🐾' },
  { id: 'otros', name: 'Otros', emoji: '🛒' },
];

const BY_ID = new Map(CATEGORIES.map((c) => [c.id, c]));

export function getCategory(id: string): Category {
  return BY_ID.get(id as CategoryId) ?? BY_ID.get('otros')!;
}

export function isCategoryId(value: unknown): value is CategoryId {
  return typeof value === 'string' && BY_ID.has(value as CategoryId);
}

// ─── Diccionario ────────────────────────────────────────────────────────────
// Se escribe en lenguaje natural; se normaliza al cargar (minúsculas, sin
// tildes, en singular), así que "Plátanos" y "platano" son lo mismo.
// Las frases de varias palabras ganan a las de una ("pasta de dientes" gana a
// "pasta"). Incluye vocabulario canario: papas, millo, gofio, mojo, cotufas…

const DICTIONARY: Record<Exclude<CategoryId, 'otros'>, string[]> = {
  frutas_verduras: [
    'manzana', 'pera', 'naranja', 'mandarina', 'limón', 'lima', 'plátano', 'banana',
    'uva', 'fresa', 'melón', 'sandía', 'kiwi', 'mango', 'piña', 'papaya', 'aguacate',
    'nectarina', 'melocotón', 'ciruela', 'cereza', 'frambuesa', 'arándano', 'granada',
    'higo', 'tomate', 'lechuga', 'zanahoria', 'calabacín', 'pepino', 'cebolla',
    'cebolleta', 'ajo', 'puerro', 'patata', 'papa', 'batata', 'boniato', 'pimiento',
    'brócoli', 'coliflor', 'col', 'repollo', 'espinaca', 'acelga', 'apio', 'champiñón',
    'seta', 'berenjena', 'calabaza', 'rábano', 'nabo', 'espárrago', 'alcachofa',
    'judía verde', 'habichuela', 'millo', 'mazorca', 'perejil', 'cilantro', 'hierbabuena',
    'rúcula', 'canónigo', 'ensalada', 'fruta', 'verdura',
  ],
  carne: [
    'pollo', 'pechuga', 'muslo', 'contramuslo', 'alita', 'ternera', 'cerdo', 'cordero',
    'conejo', 'pavo', 'filete', 'chuleta', 'costilla', 'lomo', 'solomillo', 'carne picada',
    'carne', 'hamburguesa', 'albóndiga', 'secreto', 'presa', 'cabrito',
  ],
  pescado: [
    'pescado', 'salmón', 'merluza', 'bacalao', 'sardina', 'boquerón', 'dorada', 'lubina',
    'cherne', 'vieja', 'gamba', 'langostino', 'mejillón', 'calamar', 'pulpo', 'sepia',
    'chipirón', 'almeja', 'marisco', 'atún fresco', 'emperador', 'rape', 'panga',
  ],
  charcuteria: [
    'jamón', 'jamón serrano', 'jamón cocido', 'jamón york', 'chorizo', 'salchichón',
    'fuet', 'mortadela', 'salchicha', 'bacon', 'beicon', 'panceta', 'embutido',
    'pavo en lonchas', 'fiambre', 'morcilla', 'sobrasada', 'paté', 'lacón',
  ],
  lacteos_huevos: [
    'leche', 'yogur', 'yogurt', 'queso', 'queso fresco', 'queso rallado', 'mantequilla',
    'nata', 'nata para cocinar', 'huevo', 'kéfir', 'cuajada', 'natilla', 'flan',
    'margarina', 'requesón', 'batido', 'bebida de avena', 'bebida de soja',
  ],
  panaderia: [
    'pan', 'pan de molde', 'barra', 'baguette', 'chapata', 'pan integral',
    'bollo', 'croissant', 'cruasán', 'magdalena', 'bizcocho', 'donut', 'napolitana',
    'ensaimada', 'tostada', 'biscote', 'pan tostado', 'tortilla de trigo', 'wrap',
  ],
  desayuno: [
    'cereal', 'muesli', 'avena', 'copos de avena', 'granola', 'galleta', 'cacao',
    'cola cao', 'colacao', 'nesquik', 'café', 'cápsula', 'té', 'infusión', 'manzanilla',
    'poleo', 'mermelada', 'miel', 'crema de cacao', 'nocilla', 'nutella', 'gofio',
  ],
  despensa: [
    'arroz', 'lenteja', 'garbanzo', 'alubia', 'judía', 'legumbre', 'harina', 'azúcar',
    'sal', 'aceite', 'aceite de oliva', 'vinagre', 'levadura', 'conserva', 'lata',
    'atún', 'atún en lata', 'sardinas en lata', 'maíz', 'millo en lata', 'cuscús',
    'quinoa', 'pan rallado', 'bicarbonato', 'edulcorante',
  ],
  pasta_salsas: [
    'pasta', 'macarrón', 'espagueti', 'spaghetti', 'fideo', 'tallarín', 'lasaña placas',
    'placas de lasaña', 'canelones placas', 'salsa', 'tomate frito', 'tomate triturado',
    'mayonesa', 'ketchup', 'kétchup', 'mostaza', 'mojo', 'mojo picón', 'alioli',
    'pimienta', 'orégano', 'pimentón', 'comino', 'especia', 'caldo', 'pastilla de caldo',
    'avecrem', 'sopa', 'puré', 'crema de verduras',
  ],
  snacks: [
    'papas fritas', 'papas de bolsa', 'patatas fritas', 'chip', 'nacho', 'cotufa',
    'palomita', 'fruto seco', 'almendra', 'nuez', 'cacahuete', 'pistacho', 'anacardo',
    'pipa', 'aceituna', 'chocolate', 'bombón', 'golosina', 'chuche', 'chicle',
    'turrón', 'barrita',
  ],
  congelados: [
    'congelado', 'helado', 'polo', 'croqueta', 'nugget', 'varita de merluza',
    'palito de merluza', 'guisante', 'menestra', 'hielo', 'pizza congelada',
    'verdura congelada', 'gamba congelada',
  ],
  precocinados: [
    'pizza', 'lasaña', 'canelón', 'empanadilla', 'empanada', 'tortilla de patata',
    'tortilla', 'gazpacho', 'salmorejo', 'hummus', 'surimi', 'gula', 'precocinado',
    'plato preparado', 'sándwich', 'ensalada preparada',
  ],
  bebidas: [
    'agua', 'agua con gas', 'refresco', 'zumo', 'néctar', 'coca cola', 'cocacola',
    'fanta', 'sprite', 'nestea', 'aquarius', 'clipper', 'tónica', 'gaseosa', 'cerveza',
    'vino', 'cava', 'sidra', 'ron', 'ron miel', 'whisky', 'ginebra', 'vodka', 'licor',
    'vermut', 'bebida isotónica', 'bebida energética', 'limonada',
  ],
  limpieza: [
    'detergente', 'suavizante', 'lejía', 'amoniaco', 'friegasuelos', 'limpiacristales',
    'desengrasante', 'lavavajillas', 'pastilla lavavajillas', 'jabón de platos',
    'friegaplatos', 'quitamanchas', 'limpiador', 'bayeta', 'estropajo', 'esponja',
    'fregona', 'escoba', 'guante', 'bolsa de basura', 'papel higiénico',
    'papel de cocina', 'rollo de cocina', 'servilleta', 'pañuelo', 'papel de aluminio',
    'papel de plata', 'film transparente', 'papel de horno', 'ambientador', 'insecticida',
    'pila', 'bombilla', 'vela',
  ],
  higiene: [
    'champú', 'acondicionador', 'gel', 'gel de ducha', 'jabón', 'jabón de manos',
    'pasta de dientes', 'dentífrico', 'cepillo de dientes', 'enjuague bucal',
    'colutorio', 'hilo dental', 'desodorante', 'colonia', 'perfume', 'crema',
    'crema hidratante', 'crema de manos', 'crema solar', 'protector solar', 'loción',
    'espuma de afeitar', 'cuchilla', 'maquinilla', 'compresa', 'tampón',
    'salvaslip', 'toallita', 'pañal', 'algodón', 'bastoncillo', 'tirita', 'laca',
    'gomina', 'mascarilla',
  ],
  mascotas: [
    'pienso', 'comida de perro', 'comida de gato', 'comida para perro',
    'comida para gato', 'arena de gato', 'arena para gato', 'snack de perro', 'lata de gato',
  ],
};

interface Entry {
  words: string[];
  category: CategoryId;
}

// Se construye una vez: frases normalizadas, de más largas a más cortas.
const ENTRIES: Entry[] = Object.entries(DICTIONARY)
  .flatMap(([category, phrases]) =>
    phrases.map((phrase) => ({ words: tokens(phrase), category: category as CategoryId })),
  )
  .filter((e) => e.words.length > 0)
  .sort((a, b) => b.words.length - a.words.length);

/** Vocabulario conocido (palabras sueltas), para el detector de duplicados. */
export const KNOWN_WORDS: ReadonlySet<string> = new Set(ENTRIES.flatMap((e) => e.words));

function indexOfSequence(haystack: string[], needle: string[]): number {
  outer: for (let i = 0; i + needle.length <= haystack.length; i++) {
    for (let j = 0; j < needle.length; j++) {
      if (haystack[i + j] !== needle[j]) continue outer;
    }
    return i;
  }
  return -1;
}

/**
 * Categoría más probable de un producto.
 * Regla: gana la frase del diccionario con MÁS palabras; si empatan, la que
 * aparece ANTES en el nombre (en español el sustantivo principal va primero:
 * "zumo de naranja" es bebida, no fruta).
 */
export function detectCategory(name: string): CategoryId {
  const words = tokens(name);
  let best: { len: number; pos: number; category: CategoryId } | null = null;

  for (const entry of ENTRIES) {
    // ENTRIES está ordenado por longitud: si ya hay una más larga, no hay mejora posible.
    if (best && entry.words.length < best.len) break;
    const pos = indexOfSequence(words, entry.words);
    if (pos === -1) continue;
    if (!best || pos < best.pos) {
      best = { len: entry.words.length, pos, category: entry.category };
    }
  }
  return best?.category ?? 'otros';
}
