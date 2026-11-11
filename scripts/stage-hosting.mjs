// Prepara .hosting/ para Firebase Hosting: el build vive en /LocalList/
// (igual que en GitHub Pages), así que se copia dist/ a .hosting/LocalList/.

import { cpSync, rmSync } from 'node:fs';

rmSync('.hosting', { recursive: true, force: true });
cpSync('dist', '.hosting/LocalList', { recursive: true });
console.log('Listo: .hosting/LocalList/ (https://localist-v2.web.app/LocalList/)');
