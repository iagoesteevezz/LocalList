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

// ─── CATEGORIAS GENERICAS ────────────────────────────────────────────────────
// Cada categoria tiene un id estable (clave para el diccionario de pasillos),
// un nombre visible, un emoji y una lista de palabras clave normalizadas.
// El orden importa: la primera coincidencia gana.

export const CATEGORIAS = [
    {
        id: 'frutas_verduras', nombre: 'Fruta y Verdura', emoji: '🥦',
        keywords: ['manzana','pera','naranja','limon','platano','uva','fresa','melon',
            'sandia','kiwi','mango','pina','tomate','lechuga','zanahoria','calabacin',
            'pepino','cebolla','ajo','patata','papa','pimiento','brocoli','espinaca',
            'apio','champiñon','seta','aguacate','nectarina','melocoton','ciruela',
            'cereza','frambuesa','mora','arandano','granada','higo','alcachofa',
            'coliflor','berenjena','calabaza','rabano','nabo','puerro','esparago',
            'fruta','verdura','ensalada','berros','rucula','canons','mandarina']
    },
    {
        id: 'carnes_pescados', nombre: 'Carne y Pescado', emoji: '🥩',
        keywords: ['pollo','ternera','cerdo','cordero','pavo','pato','conejo',
            'filete','chuleta','lomo','costilla','salmon','merluza','atun','bacalao',
            'sardina','boquerones','gambas','langostino','mejillon','calamar','pulpo',
            'sepia','dorada','lubina','trucha','rape','mero','panga','tilapia',
            'jamon','chorizo','salchicha','embutido','mortadela','fuet','salchichon',
            'carne','pescado','marisco']
    },
    {
        id: 'lacteos_huevos', nombre: 'Lacteos y Huevos', emoji: '🥛',
        keywords: ['leche','yogur','queso','mantequilla','nata','crema','huevo',
            'kefir','cuajada','flan','natillas','requesón','requesон','lacteo',
            'margarina','lactonesa']
    },
    {
        id: 'panaderia', nombre: 'Pan y Bolleria', emoji: '🍞',
        keywords: ['pan','barra','baguette','hogaza','croissant','bollo','magdalena',
            'bizcocho','galleta','tostada','crackers','tortita','rosquilla','donut',
            'napolitana','panecillo','chapata','molde','integral']
    },
    {
        id: 'congelados', nombre: 'Congelados', emoji: '❄️',
        keywords: ['congelado','helado','croqueta','nugget','guisante congelado',
            'espinacas congeladas','maiz congelado','pizza congelada','palito merluza']
    },
    {
        id: 'bebidas', nombre: 'Bebidas', emoji: '🥤',
        keywords: ['agua','refresco','zumo','cerveza','vino','cava','ron','whisky',
            'vodka','gin','cafe','te','infusion','cola','fanta','sprite','nestea',
            'gatorade','botella','bebida','limonada','naranjada','sidra','tonica',
            'vermut','brandy','licor']
    },
    {
        id: 'despensa', nombre: 'Despensa', emoji: '🫙',
        keywords: ['arroz','pasta','macarrones','espagueti','fideos','harina',
            'azucar','sal','aceite','vinagre','salsa','tomate frito','ketchup',
            'mayonesa','mostaza','mermelada','miel','colacao','nesquik','cacao',
            'cereal','avena','granola','frutos secos','almendra','nuez','pistacho',
            'cacahuete','conserva','lenteja','garbanzo','alubia','legumbre',
            'caldo','sopa','crema sopa','pure']
    },
    {
        id: 'limpieza', nombre: 'Limpieza', emoji: '🧹',
        keywords: ['detergente','suavizante','limpiacristales','fregasuelos',
            'desengrasante','bayeta','estropajo','esponja','guante','bolsa basura',
            'papel higienico','papel cocina','servilleta','panuelo','friegaplatos',
            'lavavajillas','amoniaco','lejia','quitamanchas','pastilla lavadora',
            'limpiador','escoba','fregona','rollo cocina']
    },
    {
        id: 'higiene', nombre: 'Higiene Personal', emoji: '🧴',
        keywords: ['champu','acondicionador','gel','jabon','dentifrico','pasta dientes',
            'cepillo','enjuague','desodorante','colonia','crema','locion','afeitado',
            'maquinilla','tampax','compresa','higienico','toallita']
    },
    {
        id: 'precocinados', nombre: 'Precocinados', emoji: '🍕',
        keywords: ['pizza','lasana','canelones','empanadilla','empanada',
            'precocinado','hamburguesa','surimi']
    },
    {
        id: 'otros', nombre: 'Otros', emoji: '🛒',
        keywords: []
    }
];

/** Devuelve el id de categoria que mejor encaja con el nombre del producto. */
// Cache de keywords normalizados (se construye una sola vez)
const _kwCache = new Map();
function _normKw(kw) {
    if (!_kwCache.has(kw)) _kwCache.set(kw, normalizarTexto(kw));
    return _kwCache.get(kw);
}

export function detectarCategoria(nombre) {
    const norm = normalizarTexto(nombre);
    for (const cat of CATEGORIAS) {
        if (cat.id === 'otros') continue;
        for (const kw of cat.keywords) {
            if (norm.includes(_normKw(kw))) return cat.id;
        }
    }
    return 'otros';
}

/** Dado un id de categoria, devuelve el objeto completo (o 'otros'). */
export function getCategoria(id) {
    return CATEGORIAS.find(c => c.id === id) || CATEGORIAS[CATEGORIAS.length - 1];
}
