// Pantalla provisional de la Fase 3: familia, miembros e invitación.
// En la Fase 4 se convierte en la lista de la compra.

import { useState } from 'react';
import { createInvite, leaveFamily, type Invite } from '../data/family';
import type { Family } from '../data/useSession';
import { useMembers } from '../data/useMembers';
import { formatInviteCode, inviteLink } from '../domain/invite';

interface Props {
  uid: string;
  family: Family;
}

export function FamilyHome({ uid, family }: Props) {
  const members = useMembers(family.id);

  return (
    <main className="screen">
      <h1>{family.name}</h1>

      <section className="stack" aria-labelledby="miembros">
        <h2 id="miembros">Miembros</h2>
        <ul className="members">
          {members.map((m) => (
            <li key={m.uid}>
              {m.name}
              {m.uid === uid && <span className="muted"> (tú)</span>}
              {m.role === 'owner' && <span className="muted"> · creó la familia</span>}
            </li>
          ))}
        </ul>
      </section>

      <InviteSection family={family} />

      <section className="stack">
        <button
          type="button"
          className="ghost danger"
          onClick={() => {
            if (window.confirm(`¿Salir de «${family.name}»? Necesitarás una invitación para volver.`)) {
              void leaveFamily(family.id);
            }
          }}
        >
          Salir de la familia
        </button>
      </section>
    </main>
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
      setError(navigator.onLine ? 'No se pudo crear la invitación.' : 'Necesitas conexión para invitar.');
    } finally {
      setBusy(false);
    }
  }

  if (!invite) {
    return (
      <section className="stack" aria-labelledby="invitar">
        <h2 id="invitar">Invitar</h2>
        <p className="muted">Crea un código para que alguien de casa se una. Caduca en 7 días.</p>
        {error && <p className="error" role="alert">{error}</p>}
        <button type="button" onClick={create} disabled={busy}>
          {busy ? 'Creando…' : 'Crear invitación'}
        </button>
      </section>
    );
  }

  const link = inviteLink(invite.code, new URL(import.meta.env.BASE_URL, location.origin).toString());
  const text = `Únete a «${family.name}» en LocaLisT con el código ${formatInviteCode(invite.code)}: ${link}`;

  return (
    <section className="stack" aria-labelledby="invitar">
      <h2 id="invitar">Invitación</h2>
      <p className="invite-code" aria-label={`Código ${invite.code.split('').join(' ')}`}>
        {formatInviteCode(invite.code)}
      </p>
      <p className="muted">
        Válida hasta el {invite.expiresAt.toLocaleDateString('es', { day: 'numeric', month: 'long' })}.
      </p>
      {'share' in navigator ? (
        <button type="button" onClick={() => void navigator.share({ title: 'LocaLisT', text }).catch(() => {})}>
          Enviar por WhatsApp u otra app
        </button>
      ) : (
        <button
          type="button"
          onClick={() =>
            void navigator.clipboard.writeText(text).then(() => {
              setCopied(true);
            })
          }
        >
          {copied ? 'Copiado ✓' : 'Copiar invitación'}
        </button>
      )}
    </section>
  );
}
