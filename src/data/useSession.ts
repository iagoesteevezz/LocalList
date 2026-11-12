// Estado de la sesión: ¿quién soy y de qué familia?
//
//   loading → (sin cuenta y sin red) needs-network
//           → no-family  (pantalla de bienvenida: crear o unirse)
//           → ready      (la app)
//
// La identidad es anónima y se guarda en el dispositivo. Si se pierde,
// basta con volver a entrar con un código de invitación: los datos son de
// la familia, no de la persona.

import { onAuthStateChanged, signInAnonymously } from 'firebase/auth';
import { doc, onSnapshot, type FirestoreError } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { auth, db } from './firebase';

export interface Family {
  id: string;
  name: string;
}

export type Session =
  | { status: 'loading' }
  | { status: 'needs-network' }
  | { status: 'error'; message: string }
  | { status: 'no-family'; uid: string }
  | { status: 'ready'; uid: string; family: Family };

function describe(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

export function useSession(): Session {
  const [uid, setUid] = useState<string | null>(null);
  const [authState, setAuthState] = useState<'loading' | 'needs-network' | 'error' | 'ok'>('loading');
  const [authError, setAuthError] = useState('');

  // undefined = aún no lo sabemos; null = no tiene familia.
  const [familyId, setFamilyId] = useState<string | null | undefined>(undefined);
  const [family, setFamily] = useState<Family | null | undefined>(undefined);

  // 1) Sesión anónima.
  useEffect(() => {
    return onAuthStateChanged(auth, (user) => {
      if (user) {
        setUid(user.uid);
        setAuthState('ok');
        return;
      }
      setUid(null);
      signInAnonymously(auth).catch((error: unknown) => {
        if (!navigator.onLine) {
          setAuthState('needs-network');
        } else {
          setAuthError(describe(error));
          setAuthState('error');
        }
      });
    });
  }, []);

  // Si estaba esperando red para la primera sesión, reintenta al volver.
  useEffect(() => {
    if (authState !== 'needs-network') return;
    const retry = () => {
      setAuthState('loading');
      signInAnonymously(auth).catch(() => setAuthState('needs-network'));
    };
    window.addEventListener('online', retry);
    return () => window.removeEventListener('online', retry);
  }, [authState]);

  // 2) ¿De qué familia soy? (users/{uid})
  useEffect(() => {
    if (!uid) return;
    return onSnapshot(
      doc(db, 'users', uid),
      { includeMetadataChanges: true },
      (snap) => {
        // Recién creada/unida: la escritura aún no ha llegado al servidor.
        // Si nos suscribiéramos ya a la familia, el servidor todavía no nos
        // vería como miembros y lo denegaría. Esperamos a la confirmación.
        if (snap.metadata.hasPendingWrites) return;
        if (snap.exists()) setFamilyId(snap.get('familyId') as string);
        // Sin datos en caché: si el servidor contesta, no tiene familia.
        // Si no hay red, tampoco consta familia en este móvil: se muestra la
        // bienvenida (antes se quedaba en "Abriendo…" para siempre). Si al
        // volver la red el servidor dice otra cosa, este listener se actualiza solo.
        else if (!snap.metadata.fromCache || !navigator.onLine) setFamilyId(null);
      },
      (error: FirestoreError) => {
        setAuthError(error.message);
        setAuthState('error');
      },
    );
  }, [uid]);

  // 3) Datos de la familia. Si ya no soy miembro, las reglas deniegan → sin familia.
  useEffect(() => {
    if (!familyId) return;
    return onSnapshot(
      doc(db, 'families', familyId),
      { includeMetadataChanges: true },
      (snap) => {
        if (snap.exists()) setFamily({ id: snap.id, name: snap.get('name') as string });
        else if (!snap.metadata.fromCache) setFamily(null);
      },
      (error: FirestoreError) => {
        if (error.code === 'permission-denied') setFamily(null);
        else {
          setAuthError(error.message);
          setAuthState('error');
        }
      },
    );
  }, [familyId]);

  if (authState === 'needs-network') return { status: 'needs-network' };
  if (authState === 'error') return { status: 'error', message: authError };
  if (!uid || familyId === undefined) return { status: 'loading' };
  if (familyId === null) return { status: 'no-family', uid };
  // El familyId cambió y aún no han llegado sus datos.
  if (family === undefined || (family && family.id !== familyId)) return { status: 'loading' };
  if (family === null) return { status: 'no-family', uid };
  return { status: 'ready', uid, family };
}
