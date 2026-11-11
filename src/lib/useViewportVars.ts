import { useEffect, type RefObject } from 'react';

/**
 * Teclado en iPhone: Safari no encoge la página al abrir el teclado, así que
 * lo fijado abajo (el campo de añadir) quedaría tapado. Con visualViewport se
 * calcula cuánto tapa el teclado y se expone como --kb; la clase
 * .keyboard-open oculta las pestañas mientras se escribe.
 */
export function useKeyboardInset() {
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const root = document.documentElement;
    const update = () => {
      const covered = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
      root.style.setProperty('--kb', `${Math.round(covered)}px`);
      root.classList.toggle('keyboard-open', covered > 80);
    };
    update();
    vv.addEventListener('resize', update);
    vv.addEventListener('scroll', update);
    return () => {
      vv.removeEventListener('resize', update);
      vv.removeEventListener('scroll', update);
      root.style.removeProperty('--kb');
      root.classList.remove('keyboard-open');
    };
  }, []);
}

/** Mide lo fijado abajo y lo expone como --dock-h, para que el contenido no quede debajo. */
export function useDockHeight(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const root = document.documentElement;
    const observer = new ResizeObserver(() => {
      root.style.setProperty('--dock-h', `${Math.ceil(el.getBoundingClientRect().height)}px`);
    });
    observer.observe(el);
    return () => {
      observer.disconnect();
      root.style.removeProperty('--dock-h');
    };
  }, [ref]);
}
