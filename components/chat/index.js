import { getRootPath } from '../../services/utils.service.js';
import { createChatWidgetMarkup } from './chat-widget.js';
import { CorotoChatController } from './chat-controller.js';

let initialized = false;

function injectChatStyles() {
    if (document.getElementById('coroto-chat-styles')) {
        return Promise.resolve();
    }

    return new Promise((resolve) => {
        const link = document.createElement('link');
        link.id = 'coroto-chat-styles';
        link.rel = 'stylesheet';
        link.href = `${getRootPath()}styles/chat.css`;
        link.onload = () => resolve();
        link.onerror = () => resolve();
        document.head.appendChild(link);
    });
}

/**
 * Monta el asistente flotante en cualquier página que cargue el navbar.
 */
export async function initCorotoChat() {
    if (initialized || document.getElementById('fab-coroto-chat')) {
        return;
    }

    await injectChatStyles();

    const host = document.createElement('div');
    host.id = 'coroto-chat-root';
    host.innerHTML = createChatWidgetMarkup();
    document.body.appendChild(host);

    const controller = new CorotoChatController(host);
    await controller.init();

    initialized = true;
}
