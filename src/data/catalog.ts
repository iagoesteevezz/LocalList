// Catálogo: productos que la familia ha apuntado alguna vez (para sugerirlos).

import { collection, limit, onSnapshot, orderBy, query } from 'firebase/firestore';
import { useEffect, useState } from 'react';
import { isCategoryId } from '../domain/categories';
import type { CatalogEntry } from '../domain/suggest';
import { db } from './firebase';

export function useCatalog(familyId: string): CatalogEntry[] {
  const [entries, setEntries] = useState<CatalogEntry[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'families', familyId, 'catalog'), orderBy('uses', 'desc'), limit(400));
    return onSnapshot(
      q,
      (snap) => {
        setEntries(
          snap.docs.map((d) => {
            const data = d.data();
            return {
              id: d.id,
              name: String(data.name ?? d.id),
              category: isCategoryId(data.category) ? data.category : 'otros',
              uses: typeof data.uses === 'number' ? data.uses : 0,
            };
          }),
        );
      },
      // Sin catálogo la app funciona igual (solo no hay sugerencias).
      (error) => console.warn('catálogo no disponible', error),
    );
  }, [familyId]);

  return entries;
}
