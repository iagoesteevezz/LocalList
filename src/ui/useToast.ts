import { createContext, useContext } from 'react';

export interface ToastOptions {
  message: string;
  action?: { label: string; run: () => void };
  /** ms; por defecto 6 s (con acción) o 3,5 s (sin acción). */
  duration?: number;
}

export const ToastContext = createContext<(options: ToastOptions) => void>(() => {});

/** Muestra un aviso breve, con acción opcional ("Deshacer", "Sumar 1"). */
export function useToast() {
  return useContext(ToastContext);
}
