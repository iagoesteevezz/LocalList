// Sustituto de la librería `re2js` (≈46 KB comprimidos menos en la app).
//
// Firestore la importa siempre, pero solo la usa en tres expresiones de la API
// de "pipelines" (like, regexContains, regexMatch), que LocaLisT no usa.
// vite.config.ts redirige `re2js` aquí. Si algún día se usaran esas
// expresiones, esto falla con un mensaje claro: quitad el alias y listo.

export class RE2JS {
  static compile(): never {
    throw new Error('re2js no está incluido en LocaLisT (ver src/vendor-stubs/re2js.ts)');
  }
}
