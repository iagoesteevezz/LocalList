// Pantalla oculta (#/importar-v1) para traer la lista de la V1, una sola vez.
// 1) Lee la V1 y enseña qué va a importar (no escribe nada).
// 2) Al pulsar "Importar", escribe la lista, el catálogo y las excepciones del súper.
// Se puede repetir sin duplicar: lo que ya existe en la V2 se respeta.

import { useEffect, useMemo, useState } from 'react';
import { useItems } from '../data/items';
import { saveStore, setOverride } from '../data/stores';
import type { Family } from '../data/useSession';
import { readV1List, writeV1Import } from '../data/v1';
import { planV1Import, type V1Data } from '../domain/migrateV1';
import { MERCADONA_MELENARA } from '../domain/templates';
import type { Store } from '../domain/types';
import { navigate } from '../lib/useHashRoute';
import { BackIcon } from '../ui/icons';
import { useToast } from '../ui/useToast';

type Load = { status: 'loading' } | { status: 'error'; message: string } | { status: 'ok'; data: V1Data };

/** El súper de la plantilla: tiene los pasillos p1..p7 de la V1. */
function isMercadona(store: Store): boolean {
  return MERCADONA_MELENARA.aisles.every((a) => store.aisles.some((b) => b.id === a.id));
}

export function ImportV1Screen({ family, stores }: { family: Family; stores: readonly Store[] }) {
  const toast = useToast();
  const { items, loaded } = useItems(family.id);
  const [load, setLoad] = useState<Load>({ status: 'loading' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const target = stores.find(isMercadona);

  useEffect(() => {
    let cancelled = false;
    readV1List().then(
      (data) => !cancelled && setLoad({ status: 'ok', data }),
      (e: unknown) => !cancelled && setLoad({ status: 'error', message: e instanceof Error ? e.message : String(e) }),
    );
    return () => {
      cancelled = true;
    };
  }, []);

  const plan = useMemo(
    () =>
      load.status === 'ok' && loaded
        ? planV1Import(load.data, new Set(items.map((i) => i.id)), MERCADONA_MELENARA)
        : null,
    [load, loaded, items],
  );

  async function run() {
    if (!plan) return;
    setBusy(true);
    setError('');
    try {
      await writeV1Import(family.id, plan);
      if (target) {
        for (const [itemId, aisleId] of Object.entries(plan.overrides)) setOverride(family.id, target.id, itemId, aisleId);
      } else {
        saveStore(family.id, {
          ...structuredClone(MERCADONA_MELENARA),
          overrides: { ...MERCADONA_MELENARA.overrides, ...plan.overrides },
        });
      }
      toast({ message: `Importados ${plan.items.length + plan.known.length} productos de la versión anterior` });
      navigate('lista');
    } catch (e) {
      console.error(e);
      setError('No se pudo importar. Comprueba la conexión e inténtalo otra vez.');
      setBusy(false);
    }
  }

  return (
    <>
      <header className="board-header">
        <div className="board-header__row board-header__row--nav">
          <button type="button" className="icon-btn icon-btn--board" onClick={() => navigate('familia')} aria-label="Volver">
            <BackIcon />
          </button>
          <h1>Traer la lista antigua</h1>
        </div>
      </header>

      <main className="content">
        {load.status === 'loading' && <p className="section muted">Leyendo la lista antigua…</p>}
        {load.status === 'error' && (
          <p className="section error" role="alert">
            No se pudo leer la lista antigua ({load.message}).
          </p>
        )}

        {plan && (
          <>
            <section className="section" aria-labelledby="falta">
              <h2 id="falta">Entrará en la lista ({plan.items.length})</h2>
              {plan.items.length > 0 ? (
                <ul className="rows">
                  {plan.items.map((i) => (
                    <li key={i.id} className="member">
                      <strong>{i.name}</strong>
                      {i.qty > 1 && <span className="member__role tabular">×{i.qty}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted section__hint">Nada pendiente en la lista antigua.</p>
              )}
            </section>

            {plan.known.length > 0 && (
              <section className="section" aria-labelledby="conocidos">
                <h2 id="conocidos">Ya los teníais (solo para sugerirlos) ({plan.known.length})</h2>
                <p className="muted section__hint">{plan.known.map((i) => i.name).join(', ')}</p>
              </section>
            )}

            {plan.skipped.length > 0 && (
              <p className="notice">
                <strong>Ya estaban en la lista nueva, no se tocan:</strong> {plan.skipped.join(', ')}.
              </p>
            )}

            <section className="section">
              <p className="muted section__hint">
                {target
                  ? `Se usará el súper «${target.name}» para colocar cada producto en su pasillo.`
                  : 'Se creará el súper «Mercadona Cruce de Melenara» con sus pasillos.'}
              </p>
              {error && (
                <p className="error" role="alert">
                  {error}
                </p>
              )}
              <button
                type="button"
                className="btn btn--block"
                onClick={run}
                disabled={busy || plan.items.length + plan.known.length === 0}
              >
                {busy ? 'Importando…' : 'Importar'}
              </button>
            </section>
          </>
        )}
      </main>
    </>
  );
}
