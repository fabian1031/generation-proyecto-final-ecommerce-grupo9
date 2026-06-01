import { getChatApiUrl } from '../../services/chat-config.js';

/**
 * @param {Array<{ role: string, content: string }>} messages
 */
export async function sendChatMessage(messages) {
    const url = getChatApiUrl();
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages }),
    });

    const raw = await res.text();
    let data = {};
    try {
        data = raw ? JSON.parse(raw) : {};
    } catch {
        if (raw.trimStart().startsWith('<?php')) {
            throw new Error(
                'El chat necesita un servidor ejecutalo en coroto.online'
            );
        }
    }

    if (res.status === 405) {
        throw new Error(
            'El chat necesita un servidor ejecutalo en coroto.online'
        );
    }

    if (!res.ok) {
        throw new Error(data.error || 'No pude responder en este momento.');
    }

    if (!data.reply) {
        throw new Error('Respuesta vacía del asistente.');
    }

    return data.reply;
}
