import { defineConfig, minimal2023Preset } from '@vite-pwa/assets-generator/config';

// `npm run icons` genera favicon, apple-touch-icon e iconos PWA desde el SVG.
export default defineConfig({
  preset: {
    ...minimal2023Preset,
    // Fondo opaco en el icono de iOS: si no, iPhone pone negro detrás.
    apple: { sizes: [180], padding: 0.15, resizeOptions: { background: '#f6f5f0' } },
    maskable: { sizes: [512], padding: 0.25, resizeOptions: { background: '#f6f5f0' } },
  },
  images: ['public/icon.svg'],
});
