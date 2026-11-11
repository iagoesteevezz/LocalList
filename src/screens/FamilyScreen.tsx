// Pestaña Familia: quién está, invitar a alguien, salir.

import { useRef, useState, type ReactNode } from 'react';
import { createInvite, leaveFamily, type Invite } from '../data/family';
import { useMembers } from '../data/useMembers';
import type { Family } from '../data/useSession';
import { formatInviteCode, inviteLink } from '../domain/invite';
import { useDockHeight } from '../lib/useViewportVars';
import { Sheet } from '../ui/Sheet';

interface Props {
  uid: string;
  family: Family;
  toastView: ReactNode;
  tabBar: ReactNode;
}

export function FamilyScreen({ uid, family, toastView, tabBar }: Props) {
  const members = useMembers(family.id);
  const [confirmLeave, setConfirmLeave] = useState(false);
  const dock = useRef<HTMLDivElement>(null);
  useDockHeight(dock);

  return (
    <>
      <header className="board-header">
        <div className="board-header__row">
          <h1>{family.name}</h1>
        </div>
      </header>

      <main className="content">
        <section className="section" aria-labelledby="miembros">
          <h2 id="miembros">Quién usa la lista</h2>
          <ul className="rows">
            {members.map((m) => (
              <li key={m.uid} className="member">
                <strong>{m.name}</strong>
                {m.uid === uid && <span className="muted">(tú)</span>}
                {m.role === 'owner' && <span className="member__role">creó la familia</span>}
              </li>
            ))}
          </ul>
        </section>

        <InviteSection family={family} />

        <section className="section">
          <button type="button" className="btn btn--quiet btn--block" onClick={() => setConfirmLeave(true)}>
            Salir de la familia
          </button>
        </section>
      </main>

      <div className="dock" ref={dock}>
        <div className="dock__inner">{toastView}</div>
        {tabBar}
      </div>

      <Sheet open={confirmLeave} onClose={() => setConfirmLeave(false)} title={`¿Salir de «${family.name}»?`}>
        <p className="sheet__text">
          Dejarás de ver la lista en este móvil. La lista no se borra: los demás la siguen teniendo. Para volver
          necesitarás una invitación nueva.
        </p>
        <div className="sheet__actions">
          <button type="button" className="btn btn--block" onClick={() => setConfirmLeave(false)}>
            Quedarme
          </button>
          <button type="button" className="btn btn--danger btn--block" onClick={() => void leaveFamily(family.id)}>
            Salir
          </button>
        </div>
      </Sheet>
    </>
  );
}

function InviteSection({ family }: { family: Family }) {
  const [invite, setInvite] = useState<Invite | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  async function create() {
    setBusy(true);
    setError('');
    try {
      setInvite(await createInvite(family.id, family.name));
    } catch {
      setError(navigator.onLine ? 'No se pudo crear la invitación. Inténtalo otra vez.' : 'Para invitar hace falta conexión.');
    } finally {
      setBusy(false);
    }
  }

  const link = invite && inviteLink(invite.code, new URL(import.meta.env.BASE_URL, location.origin).toString());
  const text =
    invite &&
    `Únete a «${family.name}» en LocaLisT. Abre la app y escribe el código ${formatInviteCode(invite.code)} (o toca: ${link})`;

  return (
    <section className="section" aria-labelledby="invitar">
      <h2 id="invitar">Invitar a alguien de casa</h2>
      <div className="panel">
        {!invite ? (
          <>
            <p className="muted">Crea un código para que otra persona use esta misma lista. Sirve durante 7 días.</p>
            {error && (
              <p className="error" role="alert">
                {error}
              </p>
            )}
            <button type="button" className="btn btn--block" onClick={create} disabled={busy}>
              {busy ? 'Creando…' : 'Crear código'}
            </button>
          </>
        ) : (
          <>
            <p className="invite-code tabular" aria-label={`Código: ${invite.code.split('').join(' ')}`}>
              {formatInviteCode(invite.code)}
            </p>
            <p className="muted">
              Sirve hasta el {invite.expiresAt.toLocaleDateString('es', { day: 'numeric', month: 'long' })}.
            </p>
            {'share' in navigator ? (
              <button
                type="button"
                className="btn btn--block"
                onClick={() => void navigator.share({ title: 'LocaLisT', text: text ?? '' }).catch(() => {})}
              >
                Enviar por WhatsApp u otra app
              </button>
            ) : (
              <button
                type="button"
                className="btn btn--block"
                onClick={() => void navigator.clipboard.writeText(text ?? '').then(() => setCopied(true))}
              >
                {copied ? 'Copiado' : 'Copiar invitación'}
              </button>
            )}
          </>
        )}
      </div>
    </section>
  );
}
