import { getRootPath } from './utils.service.js';

/** URL del endpoint del chat (PHP). Sobrescribir en producción si hace falta. */
const DEFAULT_CHAT_API = `${getRootPath()}api/chat.php`;

/** Live Server no ejecuta PHP; el chat va al servidor PHP en :8080 si está activo. */
const LIVE_SERVER_PHP_PROXY = 'http://127.0.0.1:8080/api/chat.php';

export function getChatApiUrl() {
    if (typeof window.__COROTO_CHAT_API__ === 'string' && window.__COROTO_CHAT_API__) {
        return window.__COROTO_CHAT_API__;
    }

    const { hostname, port } = window.location;
    const isLiveServer =
        (hostname === '127.0.0.1' || hostname === 'localhost') && port === '5500';

    if (isLiveServer) {
        return LIVE_SERVER_PHP_PROXY;
    }

    return DEFAULT_CHAT_API;
}
