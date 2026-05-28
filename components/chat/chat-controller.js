import { cartService } from '../../services/cartSevices.js';
import { productService } from '../../services/product.service.js';
import { formatPrice, getPagesPath } from '../../services/utils.service.js';
import { Product } from '../../models/Product.js';
import { sendChatMessage } from './chat-api.service.js';
import { parseAssistantReply, stripAssistantFormatting } from './chat-parser.js';
import {
    findProductIdForCartConfirmation,
    isCartConfirmation,
} from './chat-cart-fastpath.js';

/** Solo entre llamadas a Gemini (no aplica al agregar al carrito rápido). */
const MIN_MS_BETWEEN_GEMINI = 1200;

export class CorotoChatController {
    #history = [];
    #productsById = new Map();
    #lastRequestAt = 0;

    constructor(rootEl) {
        this.panel = rootEl.querySelector('#coroto-chat-panel');
        this.launch = rootEl.querySelector('#fab-coroto-chat');
        this.closeBtn = rootEl.querySelector('#coroto-chat-close');
        this.form = rootEl.querySelector('#coroto-chat-form');
        this.input = rootEl.querySelector('#coroto-chat-input');
        this.messagesEl = rootEl.querySelector('#coroto-chat-messages');
        this.chipsEl = rootEl.querySelector('#coroto-chat-chips');
        this.submitBtn = this.form?.querySelector('button[type="submit"]');
    }

    async init() {
        if (!this.panel || !this.launch || !this.form || !this.input || !this.messagesEl) {
            return;
        }

        await this.#loadCatalog();
        this.#bindEvents();
        this.#appendBotMessage(
            'Hola, soy CorTIA el asistente inteligente de Coroto.\n\nCuéntame tu presupuesto o qué pieza buscas (GPU, CPU, laptop…) y te recomiendo opciones del catálogo.\n\nSi te gusta algo, te lo agrego al carrito cuando confirmes.'
        );
        this.chipsEl?.classList.add('ai-chat-chips--visible');
    }

    async #loadCatalog() {
        try {
            const data = await productService.getAll();
            const products = data.map((p) => new Product(p)).filter((p) => p.isActive !== false && p.stock > 0);
            this.#productsById = new Map(products.map((p) => [String(p.id), p]));
        } catch {
            this.#productsById = new Map();
        }
    }

    #bindEvents() {
        this.launch.addEventListener('click', () => (this.panel.hidden ? this.#openChat() : this.#closeChat()));
        this.closeBtn?.addEventListener('click', () => this.#closeChat());
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !this.panel.hidden) this.#closeChat();
        });
        this.panel.addEventListener('click', (e) => {
            if (e.target === this.panel) this.#closeChat();
        });

        this.form.addEventListener('submit', (e) => this.#onSubmit(e));

        this.chipsEl?.querySelectorAll('[data-prompt]').forEach((btn) => {
            btn.addEventListener('click', () => {
                const q = btn.getAttribute('data-prompt');
                if (!q) return;
                this.input.value = q;
                this.input.focus();
                this.form.requestSubmit();
            });
        });
    }

    #openChat(focusInput = true) {
        this.panel.hidden = false;
        this.launch.setAttribute('aria-expanded', 'true');
        document.body.classList.add('ai-chat-open');
        if (focusInput) requestAnimationFrame(() => this.input.focus());
    }

    #closeChat() {
        this.panel.hidden = true;
        this.launch.setAttribute('aria-expanded', 'false');
        document.body.classList.remove('ai-chat-open');
    }

    #appendUserMessage(text) {
        const row = document.createElement('div');
        row.className = 'ai-msg-row ai-msg-row-user';
        const bubble = document.createElement('div');
        bubble.className = 'ai-msg-user';
        bubble.textContent = text;
        row.appendChild(bubble);
        this.messagesEl.appendChild(row);
        this.#scrollMessages();
    }

    #appendBotMessage(text) {
        const row = document.createElement('div');
        row.className = 'ai-msg-row ai-msg-row-bot';
        const avatar = document.createElement('div');
        avatar.className = 'ai-msg-avatar';
        avatar.textContent = 'IA';
        const bubble = document.createElement('div');
        bubble.className = 'ai-msg-bot';
        bubble.textContent = stripAssistantFormatting(text);
        row.appendChild(avatar);
        row.appendChild(bubble);
        this.messagesEl.appendChild(row);
        this.#scrollMessages();
    }

    #scrollMessages() {
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }

    #showTyping() {
        const row = document.createElement('div');
        row.className = 'ai-msg-row ai-msg-row-bot ai-msg-typing-row';
        const avatar = document.createElement('div');
        avatar.className = 'ai-msg-avatar ai-msg-avatar-pulse';
        avatar.textContent = 'IA';
        const wrap = document.createElement('div');
        wrap.className = 'ai-typing-bubble';
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            dot.className = 'ai-typing-dot';
            wrap.appendChild(dot);
        }
        row.appendChild(avatar);
        row.appendChild(wrap);
        this.messagesEl.appendChild(row);
        this.#scrollMessages();
        return row;
    }

    #setLoading(loading) {
        this.input.disabled = loading;
        if (this.submitBtn) this.submitBtn.disabled = loading;
    }

    async #onSubmit(e) {
        e.preventDefault();
        const text = this.input.value.trim();
        if (!text) return;

        this.input.value = '';
        this.#appendUserMessage(text);
        this.#history.push({ role: 'user', content: text });

        if (isCartConfirmation(text)) {
            const productId = findProductIdForCartConfirmation(this.#history, this.#productsById);
            if (productId) {
                await this.#completeCartAdd([{ id: productId, qty: 1 }], { fastPath: true });
                return;
            }
        }

        const now = Date.now();
        const waitMs = MIN_MS_BETWEEN_GEMINI - (now - this.#lastRequestAt);
        if (waitMs > 0) {
            await new Promise((r) => setTimeout(r, waitMs));
        }

        this.#lastRequestAt = Date.now();
        const typing = this.#showTyping();
        this.#setLoading(true);

        try {
            const rawReply = await sendChatMessage(this.#history);
            typing.remove();

            const { cleanText, cartActions } = parseAssistantReply(rawReply);
            let displayText = cleanText || stripAssistantFormatting(rawReply);

            if (cartActions.length > 0) {
                await this.#completeCartAdd(cartActions, { fastPath: false, fallbackText: displayText });
                return;
            }

            if (displayText) {
                this.#appendBotMessage(displayText);
                this.#history.push({ role: 'assistant', content: displayText });
            }
        } catch (err) {
            typing.remove();
            console.error('[CoroTIA]', err);
            const raw = err instanceof Error ? err.message : '';
            const friendly =
                !raw || /undefined|null|properties/i.test(raw)
                    ? 'No pude completar la acción. Reinicia PHP (para leer .env) y verifica que json-server esté activo.'
                    : raw;
            this.#appendBotMessage(friendly);
            this.#history.pop();
        } finally {
            this.#setLoading(false);
            this.input.focus();
        }
    }

    /**
     * Agrega al carrito, muestra mensaje en el chat y luego el modal (sin bloquear el chat).
     */
    async #completeCartAdd(actions, { fastPath = false, fallbackText = '' } = {}) {
        const typing = fastPath ? this.#showTyping() : null;
        if (fastPath) this.#setLoading(true);

        try {
            const { added, failed } = await this.#processCartActions(actions);
            typing?.remove();

            let displayText = fallbackText;

            if (added.length > 0) {
                displayText = this.#buildCartConfirmation(added);
                this.#appendBotMessage(displayText);
                this.#history.push({ role: 'assistant', content: displayText });
                this.#notifyCartAdded(added);
            } else if (failed.length > 0) {
                displayText =
                    displayText ||
                    'No pude agregar ese producto (sin stock o no disponible). ¿Te sugiero otra opción?';
                this.#appendBotMessage(displayText);
                this.#history.push({ role: 'assistant', content: displayText });
            } else if (fastPath) {
                this.#appendBotMessage(
                    '¿Cuál producto agrego? Dime el nombre o pídeme una recomendación primero.'
                );
                this.#history.push({
                    role: 'assistant',
                    content: '¿Cuál producto agrego? Dime el nombre o pídeme una recomendación primero.',
                });
            }
        } finally {
            if (fastPath) {
                typing?.remove();
                this.#setLoading(false);
                this.input.focus();
            }
        }
    }

    #isValidProduct(product) {
        if (!product) return false;
        const id = product.id;
        const stock = Number(product.stock);
        const price = Number(product.price);
        return (
            id !== undefined &&
            id !== null &&
            String(id).trim() !== '' &&
            !Number.isNaN(stock) &&
            stock > 0 &&
            !Number.isNaN(price) &&
            price >= 0
        );
    }

    #productToCartItem(product) {
        return {
            id: String(product.id),
            name: product.name ?? 'Producto',
            brand: product.brand ?? '',
            price: Number(product.price) || 0,
            status: product.status ?? '',
            stock: Number(product.stock) || 0,
            category: product.category ?? '',
            description: product.description ?? '',
            image: product.image ?? '',
            isActive: product.isActive !== false,
        };
    }

    #buildCartConfirmation(added) {
        const lines = added.map(({ product, qty }) => {
            const price = formatPrice((Number(product.price) || 0) * qty);
            const name = product.name ?? 'Producto';
            const label = qty > 1 ? `${name} (x${qty})` : name;
            return `• ${label} — ${price}`;
        });

        return `Listo, agregué al carrito:\n${lines.join('\n')}\n\nRevisa tu carrito cuando quieras para finalizar la compra.`;
    }

    #notifyCartAdded(added) {
        const first = added[0]?.product;
        if (!first?.name || typeof Swal === 'undefined') return;

        const pages = getPagesPath();
        Swal.fire({
            icon: 'success',
            title: 'Producto en el carrito',
            text: '¿Quieres ir al carrito ahora?',
            showCancelButton: true,
            confirmButtonText: 'Ver carrito',
            cancelButtonText: 'Seguir comprando',
        }).then((result) => {
            if (result?.isConfirmed) {
                window.location.href = `${pages}cart.html`;
            }
        });
    }

    async #resolveProduct(id) {
        let product = this.#productsById.get(String(id));
        if (this.#isValidProduct(product)) return product;

        try {
            const data = await productService.getById(id);
            if (!data || typeof data !== 'object') return null;

            product = new Product(data);
            if (!this.#isValidProduct(product)) return null;

            this.#productsById.set(String(id), product);
            return product;
        } catch {
            return null;
        }
    }

    async #processCartActions(actions) {
        const added = [];
        const failed = [];

        for (const { id, qty } of actions) {
            const product = await this.#resolveProduct(id);

            if (!product) {
                failed.push(id);
                continue;
            }

            const stock = Number(product.stock);
            const times = Math.min(Math.max(1, qty), stock);
            const cartItem = this.#productToCartItem(product);

            for (let i = 0; i < times; i++) {
                cartService.add(cartItem);
            }
            added.push({ product, qty: times });
        }

        return { added, failed };
    }
}
