# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Principal: la madre de la familia.** No es técnica. Usa un iPhone con la app
  instalada desde Safari. Compra de pie en el pasillo del supermercado, con el
  carro en una mano y el móvil en la otra. Usa gafas de cerca y le cuesta leer
  letra pequeña.
- **Resto de la familia de casa.** Añaden lo que falta desde casa, a cualquier
  hora, desde sus móviles.
- **El desarrollador** (estudiante de DAM, hijo de la usuaria principal) mantiene
  la app y quiere aprender del proceso.

## Product Purpose

Lista de la compra compartida por la familia, en tiempo real. En casa se apunta
lo que falta; en el súper, la app ordena la lista según el recorrido de ese
supermercado para no dar vueltas ni olvidar nada.

Éxito: la madre completa una compra sin ayuda, sin olvidar productos y sin
pelearse con la app.

## Positioning

Ordena la lista por los pasillos reales del súper en el que estás (con la
distribución de cada local, empezando por el Mercadona Cruce de Melenara, en
Telde, Gran Canaria). Un producto apuntado una vez cae solo en su pasillo.

## Operating Context

- En casa: alguien se acuerda de algo y lo apunta en segundos.
- En el súper: mala cobertura (zonas sin señal), luz de fluorescentes, una sola
  mano libre, prisas, interrupciones. Marca lo que mete en el carro; lo marcado
  no desaparece, baja al final de su pasillo.
- Varias personas pueden tocar la lista a la vez (uno añade desde casa mientras
  otra compra).
- Vocabulario canario en los productos (papas, millo, gofio, mojo, cotufas).

## Capabilities and Constraints

- PWA en https://iagoestevez.com/LocalList/ (GitHub Pages). React + Vite + TS.
  Firebase Firestore (proyecto `localist-v2`) con caché offline.
- Sin cuentas: sesión anónima y entrada a la familia con código de invitación.
- Funciona sin conexión; sincroniza al volver.
- Supermercados con pasillos ordenados; cada pasillo declara categorías;
  excepciones por producto. Plantilla del Mercadona de Melenara.
- Detección de repetidos y erratas sin bloquear.
- Pendiente de decidir: notificaciones, historial de compras, precios (no
  existen; no inventarlos).

## Brand Commitments

- Nombre: **LocaLisT** (con esa grafía).
- Idioma: español de España. Tuteo, cercano y breve («Añade lo que falte»,
  «Ya está en la lista»).
- El logo de la V1 (cesta con fruta, en `docs/legacy-brand/`) es referencia, no
  compromiso: el usuario autorizó rediseñar todo salvo la idea.

## Evidence on Hand

- Lista real de la familia en la V1 (3 productos al 11-nov-2026), respaldada en
  `backups/` (no versionado).
- Distribución de 7 pasillos del Mercadona Cruce de Melenara (de la V1).
- No hay testimonios, métricas ni capturas de usuarios: no inventarlos.

## Product Principles

1. **A prueba de errores.** Nada destructivo sin deshacer; nada que bloquee sin
   ofrecer salida.
2. **Una mano, un vistazo.** Lo importante se alcanza con el pulgar y se lee sin
   gafas de cerca.
3. **Funciona en el sótano.** Sin cobertura la app abre, apunta y marca igual.
4. **La lista es de la familia.** Cambios de otros aparecen solos sin
   interrumpir lo que estás haciendo.
5. **Cero configuración para ella.** Lo configura quien sabe; ella solo usa.

## Accessibility & Inclusion

- Texto base grande y alto contraste por defecto (presbicia): mínimo WCAG AA,
  objetivo AAA en el texto de la lista.
- Respetar el tamaño de texto del sistema sin que se rompa el diseño.
- Objetivos táctiles de al menos 48 px; uso con una mano.
- No depender solo del color para indicar estado.
- Modo claro y oscuro; movimiento reducido respetado.
