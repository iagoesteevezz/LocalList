// Consejo de instalación para iPhone/iPad en Safari.
//
// IMPORTANTE en iOS: la app instalada en la pantalla de inicio NO comparte
// datos con Safari. Si alguien se une a la familia en Safari y luego la
// instala, en la app instalada tendrá que volver a meter el código.
// Por eso se recomienda instalar PRIMERO y unirse desde la app instalada.

interface NavigatorWithStandalone extends Navigator {
  standalone?: boolean;
}

function isIosSafariBrowser(): boolean {
  const nav = navigator as NavigatorWithStandalone;
  const isIos = /iPhone|iPad|iPod/.test(nav.userAgent) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
  return isIos && nav.standalone === false;
}

export function InstallHint() {
  if (!isIosSafariBrowser()) return null;
  return (
    <aside className="hint">
      <strong>Instálala primero en el iPhone:</strong> pulsa{' '}
      <span aria-label="el botón Compartir">Compartir ⬆︎</span> y luego <strong>«Añadir a pantalla de inicio»</strong>.
      Después ábrela desde el icono y únete ahí con el código.
    </aside>
  );
}
