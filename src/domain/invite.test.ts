import { describe, expect, it } from 'vitest';
import {
  INVITE_ALPHABET,
  formatInviteCode,
  generateInviteCode,
  inviteCodeFromHash,
  inviteLink,
  isValidInviteCode,
  normalizeInviteCode,
} from './invite';

describe('generateInviteCode', () => {
  it('genera 8 caracteres del alfabeto sin ambiguos', () => {
    for (let i = 0; i < 200; i++) {
      const code = generateInviteCode();
      expect(isValidInviteCode(code)).toBe(true);
    }
    expect(INVITE_ALPHABET).not.toMatch(/[IO01]/);
  });

  it('usa todo el alfabeto (sin sesgo por el módulo)', () => {
    const bytes = Uint8Array.from({ length: 8 }, (_, i) => i * 32 + 31); // índice 31 siempre
    expect(generateInviteCode(() => bytes)).toBe('99999999');
  });
});

describe('normalizeInviteCode / isValidInviteCode', () => {
  it('acepta minúsculas, espacios y guiones', () => {
    expect(normalizeInviteCode(' abcd-2345 ')).toBe('ABCD2345');
  });

  it('rechaza longitudes y caracteres no válidos', () => {
    expect(isValidInviteCode('ABCD234')).toBe(false);
    expect(isValidInviteCode('ABCD23450')).toBe(false);
    expect(isValidInviteCode('ABCD2O45')).toBe(false); // O no existe en el alfabeto
  });
});

describe('enlaces', () => {
  it('formatea en dos bloques', () => {
    expect(formatInviteCode('ABCD2345')).toBe('ABCD-2345');
  });

  it('crea y lee el enlace de invitación', () => {
    const link = inviteLink('ABCD2345', 'https://iagoestevez.com/LocalList/');
    expect(link).toBe('https://iagoestevez.com/LocalList/#/unirse/ABCD2345');
    expect(inviteCodeFromHash(new URL(link).hash)).toBe('ABCD2345');
  });

  it('ignora hashes que no son invitaciones o códigos inválidos', () => {
    expect(inviteCodeFromHash('')).toBeNull();
    expect(inviteCodeFromHash('#/lista')).toBeNull();
    expect(inviteCodeFromHash('#/unirse/xx')).toBeNull();
    expect(inviteCodeFromHash('#/unirse/abcd-2345')).toBe('ABCD2345');
  });
});
