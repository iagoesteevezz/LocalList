import { defineConfig } from 'vitest/config';

// Tests de reglas de Firestore: necesitan el emulador (npm run test:rules).
export default defineConfig({
  test: {
    include: ['firebase/**/*.test.ts'],
    environment: 'node',
    testTimeout: 15_000,
    // Todos comparten el mismo emulador: en serie para que no se pisen.
    fileParallelism: false,
  },
});
