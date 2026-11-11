# LocaLisT

Lista de la compra familiar en tiempo real, ordenada por los pasillos del
supermercado en el que estás. PWA pensada para usarse de pie, en el pasillo,
con una mano.

> **Estado:** V2 en desarrollo en la rama `v2-react`.
> La versión en producción (https://iagoestevez.com/LocalList/) sigue siendo
> la V1 de la rama `main` (tag `v1-final`) hasta que se apruebe el cambio.

## Stack

| Pieza | Elección | Por qué |
|---|---|---|
| UI | React 19 + TypeScript | Re-render declarativo (la V1 perdía el foco al redibujar todo) |
| Build | Vite 8 | Rápido, simple, base `/LocalList/` para GitHub Pages |
| PWA | vite-plugin-pwa (Workbox) | Precachea la app: abre sin cobertura |
| Datos | Firebase Firestore (proyecto nuevo) | Tiempo real + caché offline |
| Auth | Firebase anónimo + invitación por enlace | El login con Google no funciona fiable en iPhone como PWA |
| Tests | Vitest | Misma config que Vite |

## Comandos

```bash
npm install
npm run dev        # servidor de desarrollo (http://localhost:5173/LocalList/)
npm run check      # tipos + lint + tests + build (lo mismo que la CI)
npm run preview    # sirve el build, con service worker real
npm run icons      # regenera iconos PWA desde public/icon.svg

npm run dev:emu    # app + emuladores de Firebase (datos falsos, nada real)
npm run test:rules # tests de las reglas de Firestore contra el emulador
```

Los emuladores necesitan Java 21 o superior. Usan el proyecto `demo-localist`,
que no existe en la nube: es imposible tocar datos reales desde ahí.

## Firebase

- Proyecto: `localist-v2`. Reglas en `firebase/firestore.rules`, con tests en
  `firebase/rules.test.ts`.
- Desplegar reglas (solo tras pasar `npm run test:rules`):
  `npx firebase login` y luego `npx firebase deploy --only firestore:rules`.
- Sesión **anónima**: no hay login. Se entra a una familia con un código de
  invitación (8 caracteres, caduca en 7 días). En iPhone, la app instalada no
  comparte datos con Safari: hay que unirse desde la app ya instalada.

Para probar en el móvil en la misma wifi: `npm run dev -- --host` y abre la
IP que muestra.

## Estructura

```
src/
  App.tsx            raíz de la app
  domain/            lógica pura (texto, categorías, duplicados, ruta, invitaciones) + tests
  data/              Firebase: inicialización, sesión, familia
  screens/           pantallas
  lib/               utilidades y hooks sin UI
  pwa/               registro del service worker y aviso de actualización
  styles/            CSS
public/              iconos y estáticos
scripts/             utilidades de Node (respaldo y migración de la V1)
firebase/            reglas de Firestore
docs/legacy-brand/   logos de la V1
```

## Datos y privacidad

- `backups/` está en `.gitignore`: contiene datos reales de la familia y el
  repo es público. Respaldo de la V1: `node scripts/backup-v1.mjs`.
- `firebase/v1-produccion.rules`: reglas endurecidas para la V1. Se aplican a
  mano en la consola de Firebase; no se despliegan desde aquí.

## Notas

- `npm audit` avisa de vulnerabilidades moderadas en `workbox-build`
  (deepmerge, glob, minimatch). Solo se usa al compilar; no llega al navegador.
- Las dependencias se instalaron con `npm install --before=<fecha>` y versión
  exacta, para no coger paquetes recién publicados.
