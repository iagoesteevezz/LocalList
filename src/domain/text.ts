// Utilidades de texto para nombres de producto. Sin dependencias: se testean solas.

/** Palabras que no aportan significado al comparar ("pasta DE dientes"). */
const STOPWORDS = new Set([
  'de', 'del', 'la', 'el', 'los', 'las', 'un', 'una', 'unos', 'unas',
  'con', 'sin', 'para', 'y', 'e', 'en', 'a', 'al', 'o',
]);

const MAX_NAME_LENGTH = 60;

/**
 * Minúsculas, sin tildes ni diéresis, sin signos, espacios simples.
 * "  Champiñones  (bandeja)! " → "champinones bandeja"
 */
export function normalize(text: string): string {
  return text
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

/**
 * Singular aproximado en español. No es perfecto (no hace falta):
 * solo tiene que hacer que "tomates" y "tomate" acaben igual.
 *   nueces → nuez · limones → limon · tomates → tomate · huevos → huevo
 */
export function singular(word: string): string {
  if (word.length <= 3 || /\d/.test(word)) return word;
  if (word.endsWith('ces')) return word.slice(0, -3) + 'z';
  // "es" tras consonante: limon-es, pan-es, yogur-es, red-es, reloj-es, ley-es
  if (/[lnrdjy]es$/.test(word)) return word.slice(0, -2);
  if (word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

/** Palabras significativas, normalizadas y en singular. */
export function tokens(text: string): string[] {
  return normalize(text)
    .split(' ')
    .filter((w) => w && !STOPWORDS.has(w))
    .map(singular);
}

/**
 * Clave estable de un producto: dos nombres con la misma clave son
 * EL MISMO producto. "Tomates" y "tomate" → "tomate".
 * Devuelve '' si el nombre no tiene ninguna palabra útil.
 */
export function productKey(name: string): string {
  return tokens(name).join(' ');
}

/**
 * ID del documento en Firestore a partir de la clave.
 * Usar la clave como ID hace que dos personas añadiendo "leche" a la vez
 * escriban el MISMO documento, en vez de crear un duplicado.
 * Solo [a-z0-9-]: válido en Firestore y en URLs.
 */
export function productId(name: string): string | null {
  const id = productKey(name).replaceAll(' ', '-').slice(0, 80);
  return id || null;
}

/**
 * Nombre a mostrar: espacios limpios, longitud máxima y primera letra
 * en mayúscula ("  leche   entera" → "Leche entera").
 */
export function cleanName(input: string): string {
  const name = input.replace(/\s+/g, ' ').trim().slice(0, MAX_NAME_LENGTH).trim();
  return name.charAt(0).toLocaleUpperCase('es') + name.slice(1);
}

/**
 * Distancia de edición: cuántas inserciones, borrados, cambios de letra o
 * intercambios de dos letras vecinas separan `a` de `b`
 * (Damerau-Levenshtein, variante OSA).
 * El intercambio cuenta como UN error: "nautral" está a 1 de "natural",
 * que es la errata típica al escribir con el pulgar.
 */
export function editDistance(a: string, b: string): number {
  if (a === b) return 0;
  // d[i][j] = distancia entre los i primeros caracteres de a y los j primeros de b
  const d: number[][] = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) d[i]![0] = i; // borrar i letras
  for (let j = 0; j <= b.length; j++) d[0]![j] = j; // insertar j letras
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let best = Math.min(
        d[i - 1]![j]! + 1, // borrar
        d[i]![j - 1]! + 1, // insertar
        d[i - 1]![j - 1]! + cost, // cambiar
      );
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
        best = Math.min(best, d[i - 2]![j - 2]! + 1); // intercambiar vecinas
      }
      d[i]![j] = best;
    }
  }
  return d[a.length]![b.length]!;
}
