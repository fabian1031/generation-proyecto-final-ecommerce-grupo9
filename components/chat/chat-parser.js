/** Formato esperado: [[CART_ADD:{"id":"…","qty":1}]] — Gemini a veces cierra con un solo ] */
const CART_TAG_RE = /\[\[CART_ADD:(\{[^}]+\})\]\]?/gi;

function pushCartAction(cartActions, jsonPart) {
    try {
        const parsed = JSON.parse(jsonPart);
        const id = String(parsed.id ?? '').trim();
        const qty = Math.max(1, parseInt(parsed.qty, 10) || 1);
        if (id) cartActions.push({ id, qty });
    } catch {
        /* ignorar JSON inválido */
    }
}

function stripCartTags(text) {
    return String(text || '').replace(/\[\[CART_ADD:[^\n]*/gi, '');
}

/**
 * Extrae acciones de carrito del texto del asistente y devuelve el mensaje limpio.
 * @param {string} text
 * @returns {{ cleanText: string, cartActions: Array<{ id: string, qty: number }> }}
 */
export function parseAssistantReply(text) {
    const cartActions = [];
    let cleanText = String(text || '');

    cleanText = cleanText.replace(CART_TAG_RE, (_, jsonPart) => {
        pushCartAction(cartActions, jsonPart);
        return '';
    });

    cleanText = stripCartTags(cleanText);

    return {
        cleanText: cleanText.replace(/\n{3,}/g, '\n\n').trim(),
        cartActions,
    };
}

export function stripAssistantFormatting(text) {
    if (!text) return '';
    let t = stripCartTags(String(text)).replace(/\r\n/g, '\n');
    for (let n = 0; n < 8; n++) t = t.replace(/\*\*([^*]+)\*\*/g, '$1');
    t = t.replace(/\*([^*\n]+)\*/g, '$1');
    t = t.replace(/`([^`]+)`/g, '$1');
    t = t.replace(/^#{1,6}\s+/gm, '');
    return t.trim();
}
