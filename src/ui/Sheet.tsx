// Hoja inferior sobre <dialog>: el navegador ya gestiona el foco,
// la tecla Escape y lo que hay detrás (inerte).

import { useEffect, useId, useRef, type ReactNode } from 'react';

interface Props {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Sheet({ open, onClose, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={titleId}
      onClose={onClose}
      // Tocar fuera de la hoja (el fondo) la cierra.
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {open && (
        <div className="sheet__body">
          <h2 id={titleId} className="sheet__title">
            {title}
          </h2>
          {children}
        </div>
      )}
    </dialog>
  );
}
