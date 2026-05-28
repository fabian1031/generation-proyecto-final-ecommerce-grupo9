import { getRootPath } from '../../services/utils.service.js';

export function getChatApiUrl() {
    return `${getRootPath()}api/chat.php`;
}

/**
 * @param {Array<{ role: string, content: string }>} messages
 */
export async function sendChatMessage(messages) {
    const res = await fetch(getChatApiUrl(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
        throw new Error(data.error || 'No pude responder en este momento.');
    }

    if (!data.reply) {
        throw new Error('Respuesta vacía del asistente.');
    }

    return data.reply;
}
