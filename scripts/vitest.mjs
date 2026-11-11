// Lanza Vitest con la letra de unidad en mayúscula (solo afecta a Windows).
//
// Problema: VS Code abre la terminal en "c:\..." (minúscula). Vitest 5 carga
// entonces su propio módulo dos veces (c:\… y C:\…) y TODOS los tests fallan
// con "Cannot read properties of undefined (reading 'config')".
// Arrancarlo desde "C:\..." lo evita. En Linux/macOS (y en la CI) no cambia nada.

import { spawnSync } from 'node:child_process';

const cwd = process.cwd().replace(/^[a-z]:/, (drive) => drive.toUpperCase());
const result = spawnSync(
  process.execPath,
  ['node_modules/vitest/vitest.mjs', ...process.argv.slice(2)],
  { cwd, stdio: 'inherit' },
);
process.exit(result.status ?? 1);
