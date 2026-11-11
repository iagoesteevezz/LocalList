// scripts/backup-v1.mjs
// Copia de seguridad (solo lectura) del documento de producción de la V1.
// Uso: node scripts/backup-v1.mjs
// Escribe en backups/ (ignorado por git: son datos personales de la familia).
//
// Lee por la API REST pública de Firestore. Funciona sin login porque las
// reglas de la V1 permiten leer supermercados/{docId}. Cuando esas reglas
// se cierren, este script dejará de funcionar (es lo esperado).

import { mkdir, writeFile } from 'node:fs/promises';

const PROJECT = 'locallist-18b64';
const API_KEY = 'AIzaSyDPb6Ira09z5sUQ4AtD6uyibVKQsQshGgc'; // clave pública de la web V1
const DOC = 'supermercados/mercadona_cruce';

const url =
  `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)` +
  `/documents/${DOC}?key=${API_KEY}`;

const res = await fetch(url);
if (!res.ok) {
  console.error(`Error ${res.status}: ${await res.text()}`);
  process.exit(1);
}
const raw = await res.json();

// Convierte el formato tipado de la API REST ({stringValue: ...}) a JSON normal.
function plain(value) {
  if ('stringValue' in value) return value.stringValue;
  if ('integerValue' in value) return Number(value.integerValue);
  if ('doubleValue' in value) return value.doubleValue;
  if ('booleanValue' in value) return value.booleanValue;
  if ('nullValue' in value) return null;
  if ('timestampValue' in value) return value.timestampValue;
  if ('arrayValue' in value) return (value.arrayValue.values ?? []).map(plain);
  if ('mapValue' in value) {
    return Object.fromEntries(
      Object.entries(value.mapValue.fields ?? {}).map(([k, v]) => [k, plain(v)]),
    );
  }
  return value;
}

const data = Object.fromEntries(Object.entries(raw.fields ?? {}).map(([k, v]) => [k, plain(v)]));
const backup = {
  source: `${PROJECT}/${DOC}`,
  exportedAt: new Date().toISOString(),
  updateTime: raw.updateTime,
  data,
  raw, // formato original, por si hiciera falta reconstruir tipos exactos
};

await mkdir('backups', { recursive: true });
const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
const file = `backups/v1-mercadona_cruce-${stamp}.json`;
await writeFile(file, JSON.stringify(backup, null, 2) + '\n', 'utf8');

const productos = Object.keys(data)
  .filter((k) => k.startsWith('productos_p'))
  .reduce((n, k) => n + data[k].length, 0);
console.log(`OK: ${file} (${productos} productos, ${Object.keys(data).length} campos)`);
