// Iconos propios: 24×24, trazo de 2px, extremos redondeados. Un solo estilo.

import type { SVGProps } from 'react';

type IconProps = SVGProps<SVGSVGElement>;

function Icon({ children, ...props }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" className="icon" aria-hidden="true" focusable="false" {...props}>
      {children}
    </svg>
  );
}

export const PlusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M12 5v14M5 12h14" />
  </Icon>
);

export const MinusIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12h14" />
  </Icon>
);

export const CheckIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M5 12.5l4.5 4.5L19 7.5" />
  </Icon>
);

export const MoreIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="5.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none" />
    <circle cx="18.5" cy="12" r="1.2" fill="currentColor" stroke="none" />
  </Icon>
);

/** Lista: tres renglones con sus marcas. */
export const ListIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="5" cy="6.5" r="1.6" />
    <circle cx="5" cy="12" r="1.6" />
    <circle cx="5" cy="17.5" r="1.6" />
    <path d="M9.5 6.5H20M9.5 12H20M9.5 17.5H17" />
  </Icon>
);

/** Familia: dos personas. */
export const PeopleIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="9" cy="8" r="3.2" />
    <path d="M3 19.5c.6-3.3 3-5.2 6-5.2s5.4 1.9 6 5.2" />
    <circle cx="17" cy="9" r="2.5" />
    <path d="M16.5 14.4c2.4.2 4 1.9 4.5 4.6" />
  </Icon>
);

/** Carro de la compra. */
export const CartIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 4h2.2l2.1 10.2a1.5 1.5 0 0 0 1.5 1.2h8.4a1.5 1.5 0 0 0 1.5-1.1L20.5 8H6.3" />
    <circle cx="9.5" cy="19.5" r="1.4" />
    <circle cx="17" cy="19.5" r="1.4" />
  </Icon>
);

/** Reloj de "sugerido antes". */
export const HistoryIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12a8 8 0 1 0 2.4-5.7" />
    <path d="M4 4.5v4h4" />
    <path d="M12 8v4.3l2.8 1.7" />
  </Icon>
);

export const CloudOffIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M7.5 18.5H17a3.5 3.5 0 0 0 1.3-6.75M15.4 7.7A5.5 5.5 0 0 0 5.6 10.2 4 4 0 0 0 5 18.3" />
    <path d="M3 3l18 18" />
  </Icon>
);
