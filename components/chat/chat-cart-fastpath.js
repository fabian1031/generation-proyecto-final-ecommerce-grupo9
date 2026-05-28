const CONFIRM_RE =
    /\b(s[ií]|ok|dale|listo|confirmo|agr[eé]galo|agr[eé]ga|al carrito|añade|anade|ponlo|metelo|mételo)\b/i;

/**
 * ¿El usuario confirma agregar algo al carrito?
 */
export function isCartConfirmation(text) {
    return CONFIRM_RE.test(String(text || ''));
}

/**
 * Intenta obtener el id del producto mencionado en el último mensaje del asistente.
 * @param {string} text
 * @param {Map<string, { id: string, name?: string }>} productsById
 */
export function extractProductIdFromAssistantText(text, productsById) {
    const haystack = String(text || '');

    const idTagMatches = [...haystack.matchAll(/\bid=([^\s|,\]]+)/gi)];
    if (idTagMatches.length > 0) {
        return String(idTagMatches[idTagMatches.length - 1][1]);
    }

    let lastMatchId = null;
    for (const product of productsById.values()) {
        const name = product.name?.trim();
        if (!name || name.length < 4) continue;
        if (haystack.toLowerCase().includes(name.toLowerCase())) {
            lastMatchId = String(product.id);
        }
    }

    return lastMatchId;
}

/**
 * @param {Array<{ role: string, content: string }>} history
 * @param {Map<string, object>} productsById
 */
export function findProductIdForCartConfirmation(history, productsById) {
    const botMessages = history.filter((m) => m.role === 'assistant').slice(-3);

    for (let i = botMessages.length - 1; i >= 0; i--) {
        const id = extractProductIdFromAssistantText(botMessages[i].content, productsById);
        if (id && productsById.has(id)) return id;
    }

    return null;
}
