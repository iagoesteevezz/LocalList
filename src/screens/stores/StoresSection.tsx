// Lista de supermercados de la familia, dentro de la pestaña Familia.

import { useState } from 'react';
import type { Store } from '../../domain/types';
import { TEMPLATES } from '../../domain/templates';
import { navigate } from '../../lib/useHashRoute';
import { ChevronRightIcon, StoreIcon } from '../../ui/icons';
import { Sheet } from '../../ui/Sheet';

export function StoresSection({ stores }: { stores: readonly Store[] }) {
  const [choosing, setChoosing] = useState(false);

  return (
    <section className="section" aria-labelledby="supers">
      <h2 id="supers">Supermercados</h2>
      {stores.length > 0 && (
        <ul className="rows">
          {stores.map((s) => (
            <li key={s.id} className="row">
              <a className="row__link" href={`#/super/${s.id}`}>
                <StoreIcon />
                <span className="row__link-text">
                  <strong>{s.name}</strong>
                  <span className="muted">
                    {s.aisles.length === 1 ? '1 pasillo' : `${s.aisles.length} pasillos`}
                  </span>
                </span>
                <ChevronRightIcon />
              </a>
            </li>
          ))}
        </ul>
      )}
      {stores.length === 0 && (
        <p className="muted section__hint">
          Añade el súper donde compráis y la lista se ordenará por sus pasillos.
        </p>
      )}
      <button type="button" className="btn btn--outline btn--block section__action" onClick={() => setChoosing(true)}>
        Añadir supermercado
      </button>

      <Sheet open={choosing} onClose={() => setChoosing(false)} title="Añadir supermercado">
        <div className="sheet__actions">
          {TEMPLATES.map((t, i) => (
            <button
              key={t.name}
              type="button"
              className="btn btn--block"
              onClick={() => {
                setChoosing(false);
                navigate(`super/nuevo/${i}`);
              }}
            >
              {t.name}
            </button>
          ))}
          <button
            type="button"
            className="btn btn--outline btn--block"
            onClick={() => {
              setChoosing(false);
              navigate('super/nuevo/blanco');
            }}
          >
            Otro súper (empezar en blanco)
          </button>
        </div>
        <p className="muted">Podrás cambiar nombres, pasillos y su orden después.</p>
      </Sheet>
    </section>
  );
}
