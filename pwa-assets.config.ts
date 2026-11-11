import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// `npm run icons` genera favicon, apple-touch-icon e iconos PWA desde el SVG.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    // Fondo opaco (la pizarra) en el icono de iOS: si no, iPhone pone negro detrás.
    apple: { sizes: [180], padding: 0, resizeOptions: { background: '#1f3a2d' } },
    maskable: { sizes: [512], padding: 0.1, resizeOptions: { background: '#1f3a2d' } },
  },
  images: ['public/icon.svg'],
});
