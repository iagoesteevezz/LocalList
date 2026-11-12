// Bienvenida: crear una familia o unirse con una invitación.
// Se ve sobre la pizarra entera: es lo primero que ve quien abre la app.

import { useEffect, useId, useState, type SubmitEvent } from 'react';
import { createFamily, joinFamily, readInvite, type Invite, type InviteLookup } from '../data/family';
import { formatInviteCode, isValidInviteCode, normalizeInviteCode } from '../domain/invite';
import { cleanName } from '../domain/text';
import { InstallHint } from './InstallHint';

type Step = 'start' | 'create' | 'join';

interface Props {
  /** Código que venía en el enlace (#/unirse/CODIGO), si lo había. */
  initialCode: string | null;
  onDone: () => void;
}

export function Onboarding({ initialCode, onDone }: Props) {
  const [step, setStep] = useState<Step>(initialCode ? 'join' : 'start');

  return (
    <main className="welcome">
      <div className="welcome__inner">
      <header className="welcome__brand">
        <img src={`${import.meta.env.BASE_URL}icon.svg`} alt="" width={64} height={64} />
        <h1>LocaLisT</h1>
        <p>La lista de la compra de la familia, ordenada por pasillos.</p>
      </header>

      {step === 'start' && (
        <div className="stack">
          <button type="button" className="btn btn--block" onClick={() => setStep('join')}>
            Tengo una invitación
          </button>
          <button type="button" className="btn btn--outline btn--block" onClick={() => setStep('create')}>
            Crear una familia nueva
          </button>
          <InstallHint />
        </div>
      )}
      {step === 'create' && <CreateForm onBack={() => setStep('start')} onDone={onDone} />}
      {step === 'join' && <JoinForm initialCode={initialCode} onBack={() => setStep('start')} onDone={onDone} />}
      </div>
    </main>
  );
}

const OFFLINE = 'No hay conexión. Inténtalo cuando tengas cobertura.';

function errorMessage(error: unknown): string {
  console.error(error);
  if (!navigator.onLine) return OFFLINE;
  return 'Algo ha fallado. Inténtalo otra vez.';
}

function CreateForm({ onBack, onDone }: { onBack: () => void; onDone: () => void }) {
  const familyId = useId();
  const nameId = useId();
  const [familyName, setFamilyName] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: SubmitEvent) {
    e.preventDefault();
    // Crear necesita al servidor: sin red, la escritura no terminaría nunca.
    if (!navigator.onLine) {
      setError(OFFLINE);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await createFamily(cleanName(familyName).slice(0, 40), cleanName(name).slice(0, 30));
      onDone();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  return (
    <form className="stack" onSubmit={submit}>
      <label htmlFor={familyId}>Nombre de la familia</label>
      <input className="input"
        id={familyId}
        value={familyName}
        onChange={(e) => setFamilyName(e.target.value)}
        placeholder="Familia Estévez"
        maxLength={40}
        required
        autoComplete="off"
      />
      <label htmlFor={nameId}>Tu nombre</label>
      <input className="input"
        id={nameId}
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Iago"
        maxLength={30}
        required
        autoComplete="given-name"
      />
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" className="btn btn--block" disabled={busy || !familyName.trim() || !name.trim()}>
        {busy ? 'Creando…' : 'Crear familia'}
      </button>
      <button type="button" className="btn btn--quiet btn--block" onClick={onBack}>
        Volver
      </button>
    </form>
  );
}

function JoinForm({
  initialCode,
  onBack,
  onDone,
}: {
  initialCode: string | null;
  onBack: () => void;
  onDone: () => void;
}) {
  const codeId = useId();
  const nameId = useId();
  const [code, setCode] = useState(initialCode ? formatInviteCode(initialCode) : '');
  const [invite, setInvite] = useState<Invite | null>(null);
  const [name, setName] = useState('');
  // Si venía un código en el enlace, empieza ya "buscando".
  const [busy, setBusy] = useState(initialCode !== null);
  const [error, setError] = useState('');

  /** Vuelca en el estado el resultado de buscar una invitación. */
  function show(result: InviteLookup | { status: 'error'; error: unknown }) {
    if (result.status === 'ok') setInvite(result.invite);
    else if (result.status === 'expired') setError('Esta invitación ha caducado. Pide una nueva.');
    else if (result.status === 'not-found') setError('No existe ninguna invitación con ese código. Revísalo.');
    else setError(errorMessage(result.error));
    setBusy(false);
  }

  function lookUp(raw: string) {
    const normalized = normalizeInviteCode(raw);
    if (!isValidInviteCode(normalized)) {
      setError('El código tiene 8 letras y números, por ejemplo ABCD-2345.');
      return;
    }
    setBusy(true);
    setError('');
    readInvite(normalized).then(show, (error: unknown) => show({ status: 'error', error }));
  }

  // Código del enlace: se busca solo al abrir (ya es válido: lo filtró inviteCodeFromHash).
  // `cancelled` evita aplicar una respuesta si la pantalla ya se cerró.
  useEffect(() => {
    if (!initialCode) return;
    let cancelled = false;
    readInvite(initialCode).then(
      (result) => !cancelled && show(result),
      (error: unknown) => !cancelled && show({ status: 'error', error }),
    );
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- solo al abrir
  }, []);

  async function join(e: SubmitEvent) {
    e.preventDefault();
    if (!invite) return;
    if (!navigator.onLine) {
      setError(OFFLINE);
      return;
    }
    setBusy(true);
    setError('');
    try {
      await joinFamily(invite, cleanName(name).slice(0, 30));
      onDone();
    } catch (err) {
      setError(errorMessage(err));
      setBusy(false);
    }
  }

  if (invite) {
    return (
      <form className="stack" onSubmit={join}>
        <p className="lead">
          Vas a unirte a <strong>{invite.familyName}</strong>.
        </p>
        <label htmlFor={nameId}>¿Cómo te llamas?</label>
        <input className="input"
          id={nameId}
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Mamá"
          maxLength={30}
          required
          autoComplete="given-name"
        />
        {error && <p className="error" role="alert">{error}</p>}
        <button type="submit" className="btn btn--block" disabled={busy || !name.trim()}>
          {busy ? 'Uniéndote…' : 'Unirme'}
        </button>
        <button type="button" className="btn btn--quiet btn--block" onClick={() => setInvite(null)}>
          No es esta familia
        </button>
      </form>
    );
  }

  return (
    <form
      className="stack"
      onSubmit={(e) => {
        e.preventDefault();
        lookUp(code);
      }}
    >
      <label htmlFor={codeId}>Código de invitación</label>
      <input
        id={codeId}
        className="input code-input"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="ABCD-2345"
        maxLength={12}
        required
        autoComplete="off"
        autoCapitalize="characters"
        autoCorrect="off"
        spellCheck={false}
        inputMode="text"
      />
      {error && <p className="error" role="alert">{error}</p>}
      <button type="submit" className="btn btn--block" disabled={busy || !code.trim()}>
        {busy ? 'Buscando…' : 'Continuar'}
      </button>
      <button type="button" className="btn btn--quiet btn--block" onClick={onBack}>
        Volver
      </button>
    </form>
  );
}
