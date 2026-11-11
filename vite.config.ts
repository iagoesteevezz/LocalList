/// <reference types="vitest/config" />
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

// La app se publica en https://iagoestevez.com/LocalList/ (GitHub Pages),
// así que todas las rutas cuelgan de /LocalList/.
const BASE = '/LocalList/';

export default defineConfig({
  base: BASE,
  plugins: [
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
        background_color: '#f6f5f0',
        theme_color: '#2f6b2f',
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
});
