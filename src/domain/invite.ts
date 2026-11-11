// Códigos de invitación a la familia.
//
// 8 caracteres de un alfabeto sin letras que se confunden (sin I, O, 0, 1):
// 32^8 ≈ 1,1 billones de combinaciones. Como las reglas impiden LISTAR
// invitaciones y caducan en 7 días, adivinar uno no es viable.
// Se generan con crypto (Math.random no es apto para esto).

export const INVITE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const INVITE_LENGTH = 8;
export const INVITE_DAYS = 7;

const VALID = new RegExp(`^[${INVITE_ALPHABET}]{${INVITE_LENGTH}}$`);

export function generateInviteCode(random: (n: number) => Uint8Array = randomBytes): string {
  // 256 es múltiplo de 32: el módulo no introduce sesgo.
  return Array.from(random(INVITE_LENGTH), (b) => INVITE_ALPHABET[b % INVITE_ALPHABET.length]).join('');
}

function randomBytes(n: number): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(n));
}

/**
 * Lo que escribe la persona → código canónico.
 * Acepta minúsculas, espacios y guiones ("abcd-2345 " → "ABCD2345").
 */
export function normalizeInviteCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

export function isValidInviteCode(code: string): boolean {
  return VALID.test(code);
}

/** "ABCD2345" → "ABCD-2345": más fácil de leer en voz alta o copiar. */
export function formatInviteCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

/** Enlace que abre la app con el código ya puesto. */
export function inviteLink(code: string, baseUrl: string): string {
  return new URL(`#/unirse/${code}`, baseUrl).toString();
}

/** Extrae el código de un hash "#/unirse/ABCD2345", si lo hay y es válido. */
export function inviteCodeFromHash(hash: string): string | null {
  const match = /^#\/unirse\/([^/?#]+)/.exec(hash);
  if (!match) return null;
  const code = normalizeInviteCode(decodeURIComponent(match[1]!));
  return isValidInviteCode(code) ? code : null;
}
