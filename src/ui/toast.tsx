// Avisos breves con acción opcional ("Deshacer", "Sumar 1").
// Uno a la vez: un aviso nuevo sustituye al anterior.

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { ToastContext, type ToastOptions } from './useToast';

interface ToastState extends ToastOptions {
  id: number;
}

export function ToastProvider({ children }: { children: (toast: ReactNode) => ReactNode }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const nextId = useRef(0);

  const show = useCallback((options: ToastOptions) => {
    nextId.current += 1;
    setToast({ ...options, id: nextId.current });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const ms = toast.duration ?? (toast.action ? 6000 : 3500);
    const timer = window.setTimeout(() => setToast((t) => (t?.id === toast.id ? null : t)), ms);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const view = (
    // La región existe siempre para que los lectores de pantalla anuncien los cambios.
    <div role="status" aria-live="polite">
      {toast && (
        <div className="toast" key={toast.id}>
          <span className="toast__msg">{toast.message}</span>
          {toast.action && (
            <button
              type="button"
              className="btn"
              onClick={() => {
                toast.action?.run();
                setToast(null);
              }}
            >
              {toast.action.label}
            </button>
          )}
        </div>
      )}
    </div>
  );

  return <ToastContext.Provider value={show}>{children(view)}</ToastContext.Provider>;
}
