// Comprueba que la carga inicial (JS que pide index.html) no supera el límite.
// Se ejecuta tras el build (npm run check y la CI). Si falla: algo pesado ha
// entrado en el paquete; mirad qué antes de subir el límite.

import { readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';

const LIMIT_KB = 240; // hoy ≈229 KB comprimidos (Firebase ≈141, React ≈68, app ≈20)

const html = readFileSync('dist/index.html', 'utf8');
const files = [...html.matchAll(/(?:src|href)="\/LocalList\/(assets\/[^"]+\.js)"/g)].map((m) => m[1]);

let total = 0;
for (const file of files) {
  const kb = gzipSync(readFileSync(`dist/${file}`)).length / 1024;
  total += kb;
  console.log(`  ${kb.toFixed(1).padStart(6)} KB  ${file}`);
}
console.log(`  ${total.toFixed(1).padStart(6)} KB  total inicial (límite ${LIMIT_KB} KB)`);

if (total > LIMIT_KB) {
  console.error(`La carga inicial pesa ${total.toFixed(1)} KB y el límite es ${LIMIT_KB} KB.`);
  process.exit(1);
}
