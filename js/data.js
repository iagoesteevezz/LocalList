// js/data.js
// Datos estáticos y utilidades puras (sin dependencias de Firebase ni DOM).
// En Fase 3, ESTRUCTURA_PASILLOS dejará de ser estática y vendrá de Firestore.

// ─── ESTRUCTURA DEL SUPERMERCADO ACTUAL ───────────────────────────────────────
// TODO (Fase 3): Sustituir por carga dinámica desde Firestore.

export const ESTRUCTURA_PASILLOS = [
    { id: 1, nombre: "1. Frutas /verduras / congelados", iconos: ["🍎", "❄️"] },
    { id: 2, nombre: "2. Carnes / embutidos / Arroz / Latas", iconos: ["🥩", "🥓"] },
    { id: 3, nombre: "3. Salsas / Pasta / Frutos secos ", iconos: ["🍝", "🍅"] },
    { id: 4, nombre: "4. Nevera / bebidas", iconos: ["🥛", "🥤"] },
    { id: 5, nombre: "5. Precocinados / papas", iconos: ["🍟", "🍕"] },
    { id: 6, nombre: "6. Cereales / Leche / Cuidado", iconos: ["🥣", "🧴"] },
    { id: 7, nombre: "7. Pan / galletas / café / limpieza", iconos: ["🍞", "🧹"] }
];

// ─── UTILIDADES DE TEXTO ──────────────────────────────────────────────────────

function normalizarTexto(texto) {
    return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function distanciaLevenshtein(a, b) {
    const matriz = [];
    for (let i = 0; i <= b.length; i++) { matriz[i] = [i]; }
    for (let j = 0; j <= a.length; j++) { matriz[0][j] = j; }
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matriz[i][j] = matriz[i - 1][j - 1];
            } else {
                matriz[i][j] = Math.min(
                    matriz[i - 1][j - 1] + 1,
                    matriz[i][j - 1] + 1,
                    matriz[i - 1][j] + 1
                );
            }
        }
    }
    return matriz[b.length][a.length];
}

export function sonParecidos(prod1, prod2) {
    let p1 = normalizarTexto(prod1);
    let p2 = normalizarTexto(prod2);

    if (p1 === p2) return true;

    let p1s = p1.replace(/es$/, '').replace(/s$/, '');
    let p2s = p2.replace(/es$/, '').replace(/s$/, '');

    if (p1s === p2s) return true;

    if (p1s.length > 4 && p2s.length > 4) {
        const margen = p1s.length > 7 ? 2 : 1;
        if (distanciaLevenshtein(p1s, p2s) <= margen) return true;
    }

    return false;
}
