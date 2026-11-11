// Tests de las reglas de Firestore contra el emulador.
// Ejecutar con: npm run test:rules  (arranca y para el emulador solo)

import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  Timestamp,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch,
  increment,
  type Firestore,
} from 'firebase/firestore';
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest';

let env: RulesTestEnvironment;

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-localist',
    firestore: { rules: readFileSync('firebase/firestore.rules', 'utf8') },
  });
});

afterAll(() => env.cleanup());
beforeEach(() => env.clearFirestore());

const db = (uid: string | null): Firestore =>
  (uid ? env.authenticatedContext(uid) : env.unauthenticatedContext()).firestore() as unknown as Firestore;

const FID = 'fam1';
const CODE = 'ABCD2345';
const inDays = (d: number) => Timestamp.fromMillis(Date.now() + d * 86_400_000);

/** Crea una familia como lo hará la app: familia + miembro owner + users en un batch. */
function createFamilyBatch(fs: Firestore, uid: string, fid = FID) {
  const batch = writeBatch(fs);
  batch.set(doc(fs, 'families', fid), { name: 'Familia', createdBy: uid, createdAt: serverTimestamp() });
  batch.set(doc(fs, 'families', fid, 'members', uid), {
    name: 'Iago', role: 'owner', invite: null, joinedAt: serverTimestamp(),
  });
  batch.set(doc(fs, 'users', uid), { familyId: fid, updatedAt: serverTimestamp() });
  return batch.commit();
}

/** Datos de partida sin pasar por las reglas. */
async function seed(opts: { invite?: { expiresAt: Timestamp; familyId?: string } } = {}) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    const fs = ctx.firestore();
    await setDoc(doc(fs, 'families', FID), { name: 'Familia', createdBy: 'owner', createdAt: Timestamp.now() });
    await setDoc(doc(fs, 'families', FID, 'members', 'owner'), {
      name: 'Iago', role: 'owner', invite: null, joinedAt: Timestamp.now(),
    });
    await setDoc(doc(fs, 'families', 'otra'), { name: 'Otra', createdBy: 'x', createdAt: Timestamp.now() });
    if (opts.invite) {
      await setDoc(doc(fs, 'invites', CODE), {
        familyId: opts.invite.familyId ?? FID, familyName: 'Familia', createdBy: 'owner',
        createdAt: Timestamp.now(), expiresAt: opts.invite.expiresAt,
      });
    }
  });
}

function joinBatch(fs: Firestore, uid: string, code: string, fid = FID) {
  const batch = writeBatch(fs);
  batch.set(doc(fs, 'families', fid, 'members', uid), {
    name: 'Mamá', role: 'member', invite: code, joinedAt: serverTimestamp(),
  });
  batch.set(doc(fs, 'users', uid), { familyId: fid, updatedAt: serverTimestamp() });
  return batch.commit();
}

const item = (uid: string, extra: Record<string, unknown> = {}) => ({
  name: 'Leche', qty: 1, done: false, category: 'lacteos_huevos',
  updatedAt: serverTimestamp(), updatedBy: uid, ...extra,
});

// ─────────────────────────────────────────────────────────────────────────────

describe('crear familia', () => {
  it('un usuario con sesión crea su familia (familia + owner + users en batch)', async () => {
    await assertSucceeds(createFamilyBatch(db('u1'), 'u1'));
  });

  it('sin sesión, no', async () => {
    await assertFails(setDoc(doc(db(null), 'families', FID), { name: 'X', createdBy: 'x', createdAt: serverTimestamp() }));
  });

  it('no se puede crear la familia sin su miembro owner', async () => {
    const fs = db('u1');
    await assertFails(setDoc(doc(fs, 'families', FID), { name: 'Familia', createdBy: 'u1', createdAt: serverTimestamp() }));
  });

  it('no se puede hacer owner de una familia que ya existe', async () => {
    await seed();
    const fs = db('intruso');
    await assertFails(setDoc(doc(fs, 'families', FID, 'members', 'intruso'), {
      name: 'X', role: 'owner', invite: null, joinedAt: serverTimestamp(),
    }));
  });
});

describe('invitaciones y unirse', () => {
  it('con invitación vigente, alguien se une', async () => {
    await seed({ invite: { expiresAt: inDays(7) } });
    await assertSucceeds(joinBatch(db('mama'), 'mama', CODE));
  });

  it('con invitación caducada, no', async () => {
    await seed({ invite: { expiresAt: inDays(-1) } });
    await assertFails(joinBatch(db('mama'), 'mama', CODE));
  });

  it('una invitación de OTRA familia no sirve para esta', async () => {
    await seed({ invite: { expiresAt: inDays(7), familyId: 'otra' } });
    await assertFails(joinBatch(db('mama'), 'mama', CODE, FID));
  });

  it('sin invitación, no', async () => {
    await seed();
    await assertFails(joinBatch(db('mama'), 'mama', 'ZZZZ2222'));
  });

  it('no se puede unir haciéndose pasar por otro uid', async () => {
    await seed({ invite: { expiresAt: inDays(7) } });
    const fs = db('mama');
    await assertFails(setDoc(doc(fs, 'families', FID, 'members', 'otro'), {
      name: 'X', role: 'member', invite: CODE, joinedAt: serverTimestamp(),
    }));
  });

  it('el código se puede leer pero no listar', async () => {
    await seed({ invite: { expiresAt: inDays(7) } });
    const fs = db('cualquiera');
    await assertSucceeds(getDoc(doc(fs, 'invites', CODE)));
    await assertFails(getDocs(collection(fs, 'invites')));
  });

  it('un miembro crea invitaciones; un extraño no', async () => {
    await seed();
    const invite = (uid: string) => ({
      familyId: FID, familyName: 'Familia', createdBy: uid,
      createdAt: serverTimestamp(), expiresAt: inDays(7),
    });
    await assertSucceeds(setDoc(doc(db('owner'), 'invites', 'QWER2345'), invite('owner')));
    await assertFails(setDoc(doc(db('extraño'), 'invites', 'QWER2346'), invite('extraño')));
  });

  it('las invitaciones no pueden durar más de 8 días ni tener códigos raros', async () => {
    await seed();
    const fs = db('owner');
    const base = { familyId: FID, familyName: 'Familia', createdBy: 'owner', createdAt: serverTimestamp() };
    await assertFails(setDoc(doc(fs, 'invites', 'QWER2345'), { ...base, expiresAt: inDays(30) }));
    await assertFails(setDoc(doc(fs, 'invites', 'qwer0101'), { ...base, expiresAt: inDays(7) }));
  });
});

describe('privacidad de la familia', () => {
  beforeEach(() => seed());

  it('un extraño no puede leer la familia, sus miembros ni su lista', async () => {
    const fs = db('extraño');
    await assertFails(getDoc(doc(fs, 'families', FID)));
    await assertFails(getDocs(collection(fs, 'families', FID, 'members')));
    await assertFails(getDocs(collection(fs, 'families', FID, 'items')));
    await assertFails(getDocs(collection(fs, 'families')));
  });

  it('un extraño no puede escribir en la lista', async () => {
    await assertFails(setDoc(doc(db('extraño'), 'families', FID, 'items', 'leche'), item('extraño')));
  });

  it('nadie puede apuntar su usuario a una familia ajena', async () => {
    const fs = db('extraño');
    await assertFails(setDoc(doc(fs, 'users', 'extraño'), { familyId: FID, updatedAt: serverTimestamp() }));
  });

  it('nadie lee el perfil de otro usuario', async () => {
    await assertFails(getDoc(doc(db('owner'), 'users', 'otro')));
  });

  it('ni los miembros pueden borrar la familia', async () => {
    await assertFails(deleteDoc(doc(db('owner'), 'families', FID)));
  });
});

describe('lista (items)', () => {
  beforeEach(() => seed());
  const fs = () => db('owner');

  it('un miembro añade, marca, cambia cantidad y borra', async () => {
    const ref = doc(fs(), 'families', FID, 'items', 'leche');
    await assertSucceeds(setDoc(ref, item('owner')));
    await assertSucceeds(updateDoc(ref, { done: true, doneAt: serverTimestamp(), updatedAt: serverTimestamp(), updatedBy: 'owner' }));
    await assertSucceeds(updateDoc(ref, { qty: increment(1), updatedAt: serverTimestamp(), updatedBy: 'owner' }));
    await assertSucceeds(deleteDoc(ref));
  });

  it('rechaza datos inválidos', async () => {
    const ref = doc(fs(), 'families', FID, 'items', 'leche');
    await assertFails(setDoc(ref, item('owner', { qty: 0 })));
    await assertFails(setDoc(ref, item('owner', { qty: 1.5 })));
    await assertFails(setDoc(ref, item('owner', { name: '' })));
    await assertFails(setDoc(ref, item('owner', { name: 'x'.repeat(61) })));
    await assertFails(setDoc(ref, item('owner', { hack: true })));
    await assertFails(setDoc(ref, item('owner', { updatedBy: 'otro' })));
    await assertFails(setDoc(ref, item('owner', { updatedAt: Timestamp.fromMillis(0) })));
  });

  it('rechaza ids de producto con caracteres raros', async () => {
    await assertFails(setDoc(doc(fs(), 'families', FID, 'items', 'Leche Entera'), item('owner')));
  });
});

describe('supermercados', () => {
  beforeEach(() => seed());

  it('un miembro crea un súper válido; uno sin pasillos-lista no', async () => {
    const ref = doc(db('owner'), 'families', FID, 'stores', 's1');
    const store = { name: 'Mercadona', icon: '🛒', aisles: [], overrides: {}, updatedAt: serverTimestamp() };
    await assertSucceeds(setDoc(ref, store));
    await assertFails(setDoc(ref, { ...store, aisles: 'no' }));
  });
});

describe('miembros', () => {
  beforeEach(async () => {
    await seed({ invite: { expiresAt: inDays(7) } });
    await joinBatch(db('mama'), 'mama', CODE);
  });

  it('cada uno cambia su nombre, pero no su rol', async () => {
    const ref = doc(db('mama'), 'families', FID, 'members', 'mama');
    await assertSucceeds(updateDoc(ref, { name: 'Mami' }));
    await assertFails(updateDoc(ref, { role: 'owner' }));
  });

  it('un miembro no expulsa a otro; el owner sí', async () => {
    await assertFails(deleteDoc(doc(db('mama'), 'families', FID, 'members', 'owner')));
    await assertSucceeds(deleteDoc(doc(db('owner'), 'families', FID, 'members', 'mama')));
  });

  it('tras salir, ya no ve la lista', async () => {
    await assertSucceeds(deleteDoc(doc(db('mama'), 'families', FID, 'members', 'mama')));
    await assertFails(getDocs(collection(db('mama'), 'families', FID, 'items')));
  });
});
