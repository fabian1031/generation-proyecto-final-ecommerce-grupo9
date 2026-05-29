const CONFIRM_RE =
    /\b(s[ií]|ok|dale|listo|confirmo|agr[eé]gal[oa]|al carrito|añádel[oa]|añadel[oa]|ponlo|m[eé]telo)\b/i;

const SINGLE_PRODUCT_RE =
    /\b(ese|esa|eso|el último|la última|solo|solamente|nomas|no más|agr[eé]galo|uno|una)\b/i;

const NUM_WORDS = {
    uno: 1,
    una: 1,
    un: 1,
    dos: 2,
    tres: 3,
    cuatro: 4,
    cinco: 5,
    seis: 6,
    siete: 7,
    ocho: 8,
    nueve: 9,
    diez: 10,
};

const STOP_WORDS = new Set([
    'agregame',
    'agrega',
    'agregalo',
    'agregalos',
    'añade',
    'añademe',
    'anade',
    'pon',
    'ponme',
    'mete',
    'metelo',
    'al',
    'carrito',
    'el',
    'la',
    'los',
    'las',
    'de',
    'del',
    'un',
    'una',
    'unos',
    'unas',
    'por',
    'favor',
    'quiero',
    'necesito',
    'dame',
    'me',
    'producto',
    'productos',
    'pieza',
    'piezas',
    'unidad',
    'unidades',
    'ud',
    'uds',
    'cosa',
    'cosas',
    'cualquier',
    'cualquiera',
]);

function toQuantity(value) {
    const n = NUM_WORDS[String(value).toLowerCase()] ?? parseInt(value, 10);
    if (!Number.isFinite(n) || n < 1) return 1;
    return Math.min(n, 20);
}

/**
 * Cantidad mencionada en un texto (usuario o asistente).
 * @param {string} text
 * @returns {number}
 */
export function parseRequestedQuantity(text) {
    const t = String(text || '').toLowerCase();
    let qty = 1;

    const patterns = [
        /\b(?:agreg|añad|anad|pon|mete|necesito|quiero|dame)\w*\s+(\d+|uno|una|un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b/,
        /\b(\d+|uno|una|un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+(?:unidades?|uds?|piezas?|memorias?|rams?|m[oó]dulos?|discos?|gpus?|cpus?|procesadores?|laptops?|port[aá]tiles?)\b/,
        /\b(?:las|los)\s+(dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez|\d+)\b/,
        /\b(?:por|de)\s+las\s+(dos|tres|cuatro|cinco|\d+)\s+unidades\b/,
        /\b(\d+)\s*x\b/,
        /\b(dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\s+unidades\b/,
    ];

    for (const pattern of patterns) {
        const match = t.match(pattern);
        if (match) {
            qty = Math.max(qty, toQuantity(match[1]));
        }
    }

    return qty;
}

/**
 * Cantidad para agregar al carrito según el historial reciente.
 * @param {Array<{ role: string, content: string }>} history
 * @param {string} [currentUserText]
 * @returns {number}
 */
export function inferOrderQuantity(history, currentUserText = '') {
    let qty = parseRequestedQuantity(currentUserText);

    for (let i = history.length - 1; i >= 0; i--) {
        const message = history[i];
        if (message.role === 'assistant') {
            qty = Math.max(qty, parseRequestedQuantity(message.content));
        }
        if (message.role === 'user' && !isShortConfirmation(message.content)) {
            qty = Math.max(qty, parseRequestedQuantity(message.content));
            break;
        }
    }

    return qty;
}

/**
 * ¿Es una confirmación corta ("sí", "dale", etc.)?
 */
export function isShortConfirmation(text) {
    const t = String(text || '').trim();
    return t.length <= 24 && /^(s[ií]|ok|dale|listo|confirmo|agregame|añademe|sí quiero)/i.test(t);
}

/**
 * @param {string} text
 * @returns {string[]}
 */
function extractSearchTokens(text) {
    const t = String(text || '')
        .toLowerCase()
        .replace(/(\d)\s*(gb|tb|mhz|ddr)\b/gi, '$1$2');

    const words = t
        .replace(/[^\w\sáéíóúüñ]/g, ' ')
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 2 && !STOP_WORDS.has(w) && !(w in NUM_WORDS));

    return [...new Set(words)];
}

/**
 * @param {string[]} tokens
 * @param {object} product
 * @param {number} qty
 */
function scoreProductMatch(tokens, product, qty) {
    const blob = `${product.name ?? ''} ${product.brand ?? ''} ${product.category ?? ''} ${product.description ?? ''}`.toLowerCase();
    let score = 0;

    for (const token of tokens) {
        const variants = [token];
        if (token.endsWith('s') && token.length > 3) {
            variants.push(token.slice(0, -1));
        }

        const matched = variants.some((v) => blob.includes(v));
        if (matched) {
            score += token.length >= 4 ? 4 : 2;
        }
    }

    if (tokens.some((t) => t.includes('ddr3')) && blob.includes('ddr4') && !blob.includes('ddr3')) {
        score -= 25;
    }
    if (tokens.some((t) => t.includes('ddr4')) && blob.includes('ddr3') && !blob.includes('ddr4')) {
        score -= 25;
    }

    if (
        (tokens.includes('memoria') || tokens.includes('memorias') || tokens.includes('ram')) &&
        String(product.category ?? '').toLowerCase() === 'ram'
    ) {
        score += 6;
    }

    if (qty > 1 && /\bkit\b/i.test(product.name ?? '') && !tokens.includes('kit')) {
        score -= 8;
    }

    return score;
}

/**
 * Busca productos del catálogo que coincidan con la descripción del usuario.
 * @param {string} text
 * @param {Map<string, object>} productsById
 * @param {number} qty
 * @returns {Array<{ id: string, score: number }>}
 */
export function rankProductsByQuery(text, productsById, qty = 1) {
    const tokens = extractSearchTokens(text);
    if (tokens.length === 0) return [];

    const ranked = [...productsById.values()]
        .map((product) => ({
            id: String(product.id),
            score: scoreProductMatch(tokens, product, qty),
        }))
        .filter((entry) => entry.score > 0)
        .sort((a, b) => b.score - a.score);

    return ranked;
}

/**
 * Pedido directo: "agregame 2 memorias ram ddr3" (producto concreto, no aleatorio).
 * @returns {{ qty: number, productIds: string[], ambiguous: boolean }|null}
 */
export function parseDirectAddRequest(text, productsById) {
    if (parseRandomAddRequest(text) !== null) return null;

    const t = String(text || '').trim();
    if (!/\b(agreg|añad|anad|pon|mete)\w*\b/i.test(t)) return null;
    if (/^(agregame|añademe|ponme)(\s*(por favor|plis|ya))?\.?!?$/i.test(t)) return null;

    const qty = parseRequestedQuantity(text);
    const ranked = rankProductsByQuery(text, productsById, qty);
    if (ranked.length === 0) return null;

    const top = ranked[0];
    const second = ranked[1];
    const ambiguous = Boolean(second && second.score >= top.score * 0.85);

    if (ambiguous) {
        return {
            qty,
            productIds: ranked.slice(0, 4).map((r) => r.id),
            ambiguous: true,
        };
    }

    return { qty, productIds: [top.id], ambiguous: false };
}

/**
 * Cantidad asociada a un id en un mensaje del asistente (cantidad=N).
 * @param {string} text
 * @param {string} productId
 * @returns {number|null}
 */
export function extractQuantityFromProposal(text, productId) {
    const haystack = String(text || '');
    const key = String(productId).trim();

    for (const line of haystack.split('\n')) {
        if (!line.includes(`id=${key}`)) continue;
        const match = line.match(/cantidad=(\d+)/i);
        if (match) return Math.max(1, parseInt(match[1], 10));
    }

    const global = haystack.match(/cantidad=(\d+)/i);
    if (global) return Math.max(1, parseInt(global[1], 10));

    return null;
}

/**
 * ¿Es un pedido nuevo (no una confirmación corta de algo ya recomendado)?
 */
export function isNewCartRequest(text) {
    const t = String(text || '').trim();
    if (!t) return false;

    if (t.length <= 28 && /^(s[ií]|ok|dale|listo|confirmo|agregame|añademe|sí quiero)/i.test(t)) {
        return false;
    }

    return (
        /\b\d+\s*(productos?|piezas?|items?|cosas?)\b/i.test(t) ||
        /\b(cualquier\s*(cosa|producto|lo)|lo\s+que\s+sea|aleator|random|da igual)\b/i.test(t) ||
        /\b(busco|recomiend)\w*/i.test(t) ||
        /\bagreg\w*\s+\d+/i.test(t) ||
        (t.length > 45 && /\b(quiero|necesito)\b/i.test(t))
    );
}

/**
 * ¿El usuario confirma agregar algo al carrito (tras una recomendación previa)?
 */
export function isCartConfirmation(text) {
    const t = String(text || '').trim();
    if (!t || isNewCartRequest(t)) return false;

    return (
        CONFIRM_RE.test(t) ||
        /^(agregame|añademe|ponme)(\s*(por favor|plis|ya))?\.?!?$/i.test(t)
    );
}

/**
 * ¿Pide agregar N productos al azar / de cualquier categoría?
 * @returns {number|null}
 */
export function parseRandomAddRequest(text) {
    const t = String(text || '').trim().toLowerCase();
    const wantsRandom =
        /\b(cualquier\s*(cosa|producto|lo)|lo\s+que\s+sea|aleator|random|da igual|variado|variados|sorpr[eé]nd)\w*\b/.test(
            t
        ) || /\bproductos?\s+de\s+cualquier\b/.test(t);
    const wantsAdd =
        /\b(agreg|añad|anad|pon|mete|recomiend|prop[oó]n|sorpr[eé]nd)\w*\b/.test(t);

    if (!wantsRandom) return null;
    if (!wantsAdd && !/\bsorpr[eé]nd/i.test(t)) return null;

    const numMatch = t.match(
        /\b(\d+|uno|una|un|dos|tres|cuatro|cinco|seis|siete|ocho|nueve|diez)\b/
    );
    const count = numMatch ? (NUM_WORDS[numMatch[1]] ?? parseInt(numMatch[1], 10)) : 1;

    if (!Number.isFinite(count) || count < 1 || count > 20) return null;
    return count;
}

/**
 * Elige productos de categorías distintas para evitar sesgo hacia una sola línea.
 * @param {Map<string, object>} productsById
 * @param {number} count
 * @param {Set<string>} [excludeIds]
 * @returns {string[]}
 */
export function pickDiverseProducts(productsById, count, excludeIds = new Set()) {
    const products = [...productsById.values()].filter(
        (p) => !excludeIds.has(String(p.id))
    );
    if (products.length === 0 || count < 1) return [];

    const byCategory = new Map();
    for (const product of products) {
        const category = product.category?.trim() || 'Otros';
        if (!byCategory.has(category)) byCategory.set(category, []);
        byCategory.get(category).push(product);
    }

    const categories = [...byCategory.keys()].sort(() => Math.random() - 0.5);
    const picked = [];
    const seen = new Set();
    let categoryIndex = 0;
    let guard = 0;

    while (picked.length < count && categories.length > 0 && guard < products.length * 2) {
        guard += 1;
        const category = categories[categoryIndex % categories.length];
        const pool = byCategory
            .get(category)
            .filter((product) => !seen.has(String(product.id)));

        if (pool.length === 0) {
            categories.splice(categoryIndex % categories.length, 1);
            continue;
        }

        const product = pool[Math.floor(Math.random() * pool.length)];
        const id = String(product.id);
        seen.add(id);
        picked.push(id);
        categoryIndex += 1;
    }

    for (const product of products) {
        if (picked.length >= count) break;
        const id = String(product.id);
        if (seen.has(id)) continue;
        seen.add(id);
        picked.push(id);
    }

    return picked.slice(0, count);
}

/**
 * ¿Pide agregar un solo producto (no toda la recomendación)?
 */
export function wantsSingleProduct(text) {
    return SINGLE_PRODUCT_RE.test(String(text || ''));
}

const NAME_STOP_WORDS = new Set(['monitor', 'memoria', 'portátil', 'portatil', 'kit', 'tarjeta']);

/**
 * @param {string} name
 * @param {string} haystack lowercase
 */
function scoreProductNameMatch(name, haystack) {
    const full = String(name || '')
        .trim()
        .toLowerCase();
    if (!full) return 0;
    if (haystack.includes(full)) return 100;

    const tokens = full
        .replace(/[^\w\sáéíóúüñ]/g, ' ')
        .split(/\s+/)
        .filter((t) => t.length >= 3 && !NAME_STOP_WORDS.has(t));

    if (tokens.length === 0) return 0;

    let hits = 0;
    for (const token of tokens) {
        if (haystack.includes(token)) hits += 1;
    }

    const ratio = hits / tokens.length;
    return Math.round(ratio * 85) + (hits >= 2 ? 15 : 0);
}

/**
 * Extrae productos mencionados en un texto (nombre completo o parcial).
 * @param {string} text
 * @param {Map<string, { id: string, name?: string }>} productsById
 * @returns {string[]}
 */
export function extractProductIdsFromText(text, productsById) {
    const haystack = String(text || '').toLowerCase();
    const ids = [];
    const seen = new Set();

    const pushId = (id) => {
        const key = String(id).trim();
        if (!key || seen.has(key) || !productsById.has(key)) return;
        seen.add(key);
        ids.push(key);
    };

    for (const match of haystack.matchAll(/\bid=([^\s|,\]]+)/gi)) {
        pushId(match[1]);
    }

    const scored = [...productsById.values()]
        .map((product) => ({
            id: String(product.id),
            score: scoreProductNameMatch(product.name, haystack),
        }))
        .filter((entry) => entry.score >= 55)
        .sort((a, b) => b.score - a.score);

    if (scored.length > 0) {
        pushId(scored[0].id);
        if (scored.length > 1 && scored[0].score < scored[1].score + 15) {
            for (const entry of scored.slice(1, 4)) {
                pushId(entry.id);
            }
        }
    }

    return ids;
}

/**
 * ¿El mensaje del asistente ofrece agregar algo al carrito?
 */
export function messageOffersCartAdd(text) {
    return /\b(agreg|añad|carrito|gustar[ií]a|quieres que|te lo agrego|confirm)\w*/i.test(
        String(text || '')
    );
}

/**
 * Resuelve qué productos (y cantidad) agregar al confirmar el carrito.
 * @param {Array<{ role: string, content: string }>} history
 * @param {Map<string, object>} productsById
 * @param {string} [userText]
 * @returns {Array<{ id: string, qty: number }>}
 */
export function findCartActionsForConfirmation(history, productsById, userText = '') {
    const userQty = parseRequestedQuantity(userText);
    const fromUser = extractProductIdsFromText(userText, productsById);

    if (fromUser.length > 0) {
        const ids = wantsSingleProduct(userText) ? fromUser.slice(-1) : fromUser;
        return ids.map((id) => ({
            id,
            qty: extractQuantityFromProposal(userText, id) ?? userQty,
        }));
    }

    const inferredQty = inferOrderQuantity(history, userText);

    const botMessages = history.filter((m) => m.role === 'assistant').slice(-3);

    for (let i = botMessages.length - 1; i >= 0; i--) {
        const content = botMessages[i].content;
        const ids = extractProductIdsFromText(content, productsById);
        if (ids.length === 0) continue;

        let resolved = ids;
        if (wantsSingleProduct(userText) && ids.length > 1) {
            resolved = [ids[ids.length - 1]];
        } else if (ids.length > 1 && /¿cu[aá]l prefieres/i.test(content)) {
            const picked = extractProductIdsFromText(userText, productsById);
            if (picked.length === 1) {
                resolved = picked;
            } else {
                return [];
            }
        }

        return resolved.map((id) => ({
            id,
            qty: inferredQty,
        }));
    }

    return [];
}

/** @deprecated Usar findCartActionsForConfirmation */
export function findProductIdsForCartConfirmation(history, productsById, userText = '') {
    return findCartActionsForConfirmation(history, productsById, userText).map((a) => a.id);
}

/** @deprecated Usar extractProductIdsFromText */
export function extractProductIdFromAssistantText(text, productsById) {
    const ids = extractProductIdsFromText(text, productsById);
    return ids.length > 0 ? ids[ids.length - 1] : null;
}

/** @deprecated Usar findCartActionsForConfirmation */
export function findProductIdForCartConfirmation(history, productsById) {
    const actions = findCartActionsForConfirmation(history, productsById);
    return actions.length > 0 ? actions[0].id : null;
}
