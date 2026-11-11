// La firma de LocaLisT: un trazo de tiza, a mano, que tacha el nombre.
// pathLength=1 permite animar el dibujo con stroke-dashoffset de 1 a 0.

export function ChalkStrike({ drawing }: { drawing: boolean }) {
  return (
    <svg
      className={drawing ? 'strike strike--drawing' : 'strike'}
      viewBox="0 0 100 14"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M1.5 8.6C14 6.4 27 9.8 41 7.6S69 6.1 82 7.9c6.2.8 11.4.5 16.5-.9"
        pathLength={1}
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}
