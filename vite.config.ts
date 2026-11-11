/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

// La app se publica en https://iagoestevez.com/LocalList/ (GitHub Pages),
// así que todas las rutas cuelgan de /LocalList/.
const BASE = '/LocalList/';

/**
 * Política de seguridad de contenido (CSP), solo en producción.
 * GitHub Pages no permite cabeceras propias, así que va como <meta>.
 * - Scripts: solo los de la propia web (nada en línea, nada de terceros).
 * - Conexiones: solo a las APIs de Google que usa Firebase.
 * Si se cuela un XSS, el navegador no ejecutará scripts ajenos ni enviará datos fuera.
 */
function contentSecurityPolicy(mode: string): string {
  return [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'", // el <style> de la pantalla de arranque
  // Firestore carga una imagen de 1px de www.google.com para comprobar si hay red.
  "img-src 'self' data: https://www.google.com",
  // En modo emuladores (pruebas locales) también se permiten los emuladores.
  `connect-src https://*.googleapis.com${mode === 'emulators' ? ' http://127.0.0.1:*' : ''}`,
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  ].join('; ');
}

function csp(mode: string): Plugin {
  return {
    name: 'localist-csp',
    apply: 'build',
    transformIndexHtml: (html) =>
      html.replace(
        '<meta charset="UTF-8" />',
        `<meta charset="UTF-8" />
    <meta http-equiv="Content-Security-Policy" content="${contentSecurityPolicy(mode)}" />`,
      ),
  };
}

export default defineConfig(({ mode }) => ({
  base: BASE,
  resolve: {
    alias: {
      // Firestore importa re2js solo para su API de "pipelines", que no usamos.
      // Ver src/vendor-stubs/re2js.ts. Ahorra ≈46 KB comprimidos.
      re2js: fileURLToPath(new URL('./src/vendor-stubs/re2js.ts', import.meta.url)),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Firebase y React en archivos aparte: cambian poco. Al publicar una
        // versión nueva, el móvil solo descarga el código de la app (unos KB).
        codeSplitting: {
          groups: [
            { name: 'firebase', test: /node_modules[\\/](@firebase|firebase|idb|tslib)[\\/]/ },
            { name: 'react', test: /node_modules[\\/](react|react-dom|scheduler)[\\/]/ },
          ],
        },
      },
    },
  },
  plugins: [
    csp(mode),
    react(),
    VitePWA({
      // 'prompt': cuando hay versión nueva NO se recarga sola; la app muestra
      // un aviso y el usuario decide. Recargar a mitad de la compra sería un error.
      registerType: 'prompt',
      // Iconos generados con `npm run icons` desde public/icon.svg
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: {
        id: BASE,
        name: 'LocaLisT',
        short_name: 'LocaLisT',
        description: 'La lista de la compra de la familia, ordenada por pasillos.',
        lang: 'es',
        start_url: BASE,
        scope: BASE,
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#1f3a2d',
        theme_color: '#1f3a2d',
        icons: [
          { src: 'pwa-64x64.png', sizes: '64x64', type: 'image/png' },
          { src: 'pwa-192x192.png', sizes: '192x192', type: 'image/png' },
          { src: 'pwa-512x512.png', sizes: '512x512', type: 'image/png' },
          { src: 'maskable-icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Precachea todo el "shell" para que la app abra sin cobertura.
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: `${BASE}index.html`,
        cleanupOutdatedCaches: true,
        // En la primera instalación, el SW controla la pestaña sin recargar:
        // la app queda lista para funcionar sin red desde la primera visita.
        clientsClaim: true,
      },
    }),
  ],
  test: {
    // Se lanza con scripts/vitest.mjs (ver allí el porqué).
    include: ['src/**/*.test.{ts,tsx}'],
  },
}));
