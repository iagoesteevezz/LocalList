// Operaciones de familia: crear, invitar, unirse, salir.
// Las reglas (firebase/firestore.rules) validan cada una; aquí solo se arma
// la escritura tal y como las reglas la esperan.

import {
  Timestamp,
  collection,
  deleteDoc,
  doc,
  getDoc,
  serverTimestamp,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import { INVITE_DAYS, generateInviteCode } from '../domain/invite';
import { auth, db } from './firebase';

function currentUid(): string {
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('No hay sesión');
  return uid;
}

/** Crea la familia y te hace su "owner". Devuelve el id de la familia. */
export async function createFamily(familyName: string, memberName: string): Promise<string> {
  const uid = currentUid();
  const familyRef = doc(collection(db, 'families'));
  const batch = writeBatch(db);
  batch.set(familyRef, { name: familyName, createdBy: uid, createdAt: serverTimestamp() });
  batch.set(doc(familyRef, 'members', uid), {
    name: memberName,
    role: 'owner',
    invite: null,
    joinedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'users', uid), { familyId: familyRef.id, updatedAt: serverTimestamp() });
  await batch.commit();
  return familyRef.id;
}

export interface Invite {
  code: string;
  familyId: string;
  familyName: string;
  expiresAt: Date;
}

/** Crea una invitación válida INVITE_DAYS días. */
export async function createInvite(familyId: string, familyName: string): Promise<Invite> {
  const uid = currentUid();
  const code = generateInviteCode();
  const expiresAt = new Date(Date.now() + INVITE_DAYS * 86_400_000);
  await setDoc(doc(db, 'invites', code), {
    familyId,
    familyName,
    createdBy: uid,
    createdAt: serverTimestamp(),
    expiresAt: Timestamp.fromDate(expiresAt),
  });
  return { code, familyId, familyName, expiresAt };
}

export type InviteLookup =
  | { status: 'ok'; invite: Invite }
  | { status: 'not-found' }
  | { status: 'expired' };

export async function readInvite(code: string): Promise<InviteLookup> {
  const snap = await getDoc(doc(db, 'invites', code));
  if (!snap.exists()) return { status: 'not-found' };
  const data = snap.data();
  const expiresAt = (data.expiresAt as Timestamp).toDate();
  if (expiresAt.getTime() <= Date.now()) return { status: 'expired' };
  return {
    status: 'ok',
    invite: { code, familyId: data.familyId as string, familyName: data.familyName as string, expiresAt },
  };
}

/** Te une a la familia de la invitación (ya comprobada con readInvite). */
export async function joinFamily(invite: Invite, memberName: string): Promise<void> {
  const uid = currentUid();
  const batch = writeBatch(db);
  batch.set(doc(db, 'families', invite.familyId, 'members', uid), {
    name: memberName,
    role: 'member',
    invite: invite.code,
    joinedAt: serverTimestamp(),
  });
  batch.set(doc(db, 'users', uid), { familyId: invite.familyId, updatedAt: serverTimestamp() });
  await batch.commit();
}

/** Sales de la familia: borra tu miembro y tu vínculo. Los datos de la familia se quedan. */
export async function leaveFamily(familyId: string): Promise<void> {
  const uid = currentUid();
  await deleteDoc(doc(db, 'families', familyId, 'members', uid));
  await deleteDoc(doc(db, 'users', uid));
}
