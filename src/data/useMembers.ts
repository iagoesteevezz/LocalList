import { collection, onSnapshot } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { db } from './firebase';

export interface Member {
  uid: string;
  name: string;
  role: 'owner' | 'member';
}

/** Miembros de la familia, en tiempo real. */
export function useMembers(familyId: string): Member[] {
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    return onSnapshot(collection(db, 'families', familyId, 'members'), (snap) => {
      setMembers(
        snap.docs
          .map((d) => ({ uid: d.id, name: d.get('name') as string, role: d.get('role') as Member['role'] }))
          .sort((a, b) => (a.role === b.role ? a.name.localeCompare(b.name, 'es') : a.role === 'owner' ? -1 : 1)),
      );
    });
  }, [familyId]);

  return members;
}
