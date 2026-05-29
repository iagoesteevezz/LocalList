// js/data.js
// Utilidades puras de texto. Sin dependencias de Firebase ni DOM.

export function normalizarTexto(texto) {
    return texto.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim();
}

function distanciaLevenshtein(a, b) {
    const m = [];
    for (let i = 0; i <= b.length; i++) m[i] = [i];
    for (let j = 0; j <= a.length; j++) m[0][j] = j;
    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            m[i][j] = b[i-1] === a[j-1]
                ? m[i-1][j-1]
                : Math.min(m[i-1][j-1]+1, m[i][j-1]+1, m[i-1][j]+1);
        }
    }
    return m[b.length][a.length];
}

export function sonParecidos(prod1, prod2) {
    const p1 = normalizarTexto(prod1);
    const p2 = normalizarTexto(prod2);
    if (p1 === p2) return true;

    const p1s = p1.replace(/es$/, '').replace(/s$/, '');
    const p2s = p2.replace(/es$/, '').replace(/s$/, '');
    if (p1s === p2s) return true;

    if (p1s.length > 4 && p2s.length > 4) {
        if (distanciaLevenshtein(p1s, p2s) <= (p1s.length > 7 ? 2 : 1)) return true;
    }
    return false;
}
