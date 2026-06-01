import { cartService } from '../../services/cartSevices.js';
import { fetchCatalog, onCatalogReady } from '../../services/catalog.service.js';
import { productService } from '../../services/product.service.js';
import { formatPrice, getPagesPath } from '../../services/utils.service.js';
import { Product } from '../../models/Product.js';
import { sendChatMessage } from './chat-api.service.js';
import { parseAssistantReply, stripAssistantFormatting } from './chat-parser.js';
import {
    extractProductIdsFromText,
    findCartActionsForConfirmation,
    isCartConfirmation,
    messageOffersCartAdd,
    parseDirectAddRequest,
    parseRandomAddRequest,
    inferOrderQuantity,
    isShortConfirmation,
    parseRequestedQuantity,
    pickDiverseProducts,
} from './chat-cart-fastpath.js';

/** Solo entre llamadas a Gemini (no aplica al agregar al carrito rápido). */
const MIN_MS_BETWEEN_GEMINI = 1200;

export class CorotoChatController {
    #history = [];
    #productsById = new Map();
    #lastRequestAt = 0;
    /** @type {{ actions: Array<{ id: string, qty: number }>, pickOne?: boolean } | null} */
    #pendingCart = null;
    #unsubscribeCatalog = null;

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

        this.#unsubscribeCatalog = onCatalogReady((products) => this.#setCatalog(products));
        await this.#loadCatalog();
        this.#bindEvents();
        if (this.#productsById.size === 0) {
            this.#appendBotMessage(
                'Hola, soy CoroTIA el asistente inteligente de Coroto.\n\nAhora mismo no puedo ver el catálogo (revisa que la API de productos esté activa). Cuando vuelva a estar disponible, te ayudo a elegir hardware según tu presupuesto.'
            );
        } else {
            this.#appendBotMessage(
                'Hola, soy CoroTIA el asistente inteligente de Coroto.\n\nCuéntame tu presupuesto o qué necesitas (oficina, upgrade, gaming…) y te recomiendo opciones del catálogo.\n\nSi te gusta algo, te lo agrego al carrito cuando confirmes.'
            );
        }
        this.chipsEl?.classList.add('ai-chat-chips--visible');
    }

    #setCatalog(products) {
        this.#productsById = new Map(products.map((p) => [String(p.id), p]));
    }

    async #loadCatalog() {
        const products = await fetchCatalog();
        this.#setCatalog(products);
    }

    async #ensureCatalog() {
        if (this.#productsById.size > 0) {
            return true;
        }
        const products = await fetchCatalog({ force: true });
        this.#setCatalog(products);
        return this.#productsById.size > 0;
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
            const pending = this.#resolvePendingCart(text);
            if (pending.length > 0) {
                this.#pendingCart = null;
                await this.#completeCartAdd(pending, { fastPath: true });
                return;
            }

            const cartActions = findCartActionsForConfirmation(this.#history, this.#productsById, text);
            if (cartActions.length > 0) {
                await this.#completeCartAdd(cartActions, { fastPath: true });
                return;
            }

            this.#appendBotMessage(
                '¿Cuál producto agrego? Dime el nombre o pídeme una recomendación primero.'
            );
            this.#history.push({
                role: 'assistant',
                content: '¿Cuál producto agrego? Dime el nombre o pídeme una recomendación primero.',
            });
            return;
        }

        this.#pendingCart = null;

        const directAdd = parseDirectAddRequest(text, this.#productsById);
        if (directAdd) {
            if (!(await this.#ensureCatalog())) {
                this.#appendBotMessage(
                    'No tengo acceso al catálogo en este momento. Intenta de nuevo cuando la tienda termine de cargar los productos.'
                );
                this.#history.push({
                    role: 'assistant',
                    content: 'No tengo acceso al catálogo en este momento.',
                });
                return;
            }

            const proposal = this.#proposeProducts(directAdd.productIds, directAdd.qty, {
                pickOne: directAdd.ambiguous,
            });
            this.#appendBotMessage(proposal);
            this.#history.push({ role: 'assistant', content: proposal });
            return;
        }

        const randomCount = parseRandomAddRequest(text);
        if (randomCount !== null) {
            if (!(await this.#ensureCatalog())) {
                this.#appendBotMessage(
                    'No tengo acceso al catálogo en este momento. Intenta de nuevo cuando la tienda termine de cargar los productos.'
                );
                this.#history.push({
                    role: 'assistant',
                    content: 'No tengo acceso al catálogo en este momento.',
                });
                return;
            }
            const productIds = pickDiverseProducts(this.#productsById, randomCount);
            if (productIds.length > 0) {
                const proposal = this.#proposeProducts(productIds, 1, { random: true });
                this.#appendBotMessage(proposal);
                this.#history.push({ role: 'assistant', content: proposal });
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
            const displayText = stripAssistantFormatting(cleanText || rawReply);

            if (cartActions.length > 0) {
                await this.#completeCartAdd(cartActions, {
                    fastPath: false,
                    fallbackText: displayText,
                    fromGemini: true,
                });
                return;
            }

            if (displayText) {
                this.#appendBotMessage(displayText);
                this.#history.push({ role: 'assistant', content: displayText });
                this.#rememberProductsFromReply(displayText);
            }
        } catch (err) {
            typing.remove();
            console.error('[CoroTIA]', err);
            const raw = err instanceof Error ? err.message : '';
            const friendly =
                !raw || /undefined|null|properties/i.test(raw)
                    ? 'No pude completar la acción. Intenta de nuevo en unos segundos.'
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
    async #completeCartAdd(actions, { fastPath = false, fallbackText = '', fromGemini = false } = {}) {
        const typing = fastPath ? this.#showTyping() : null;
        if (fastPath) this.#setLoading(true);

        try {
            let toProcess = actions;
            let alternativesNotice = '';

            if (fromGemini) {
                const validated = this.#validateGeminiCartActions(actions);
                toProcess = validated.validActions;
                if (validated.alternativeActions.length > 0) {
                    alternativesNotice = this.#buildAlternativesProposal(validated.alternativeActions);
                    this.#pendingCart = {
                        actions: validated.alternativeActions.map(({ id, qty }) => ({
                            id: String(id),
                            qty,
                        })),
                        pickOne: validated.alternativeActions.length > 1,
                    };
                }
            }

            const { added, failed } = await this.#processCartActions(toProcess);
            typing?.remove();

            if (added.length > 0) {
                let displayText = this.#buildCartConfirmation(added);
                if (alternativesNotice) {
                    displayText = `${displayText}\n\n${alternativesNotice}`;
                }
                this.#appendBotMessage(displayText);
                this.#history.push({ role: 'assistant', content: displayText });
                this.#notifyCartAdded(added);
                return;
            }

            if (alternativesNotice) {
                this.#appendBotMessage(alternativesNotice);
                this.#history.push({ role: 'assistant', content: alternativesNotice });
                return;
            }

            this.#pendingCart = null;

            let displayText = fallbackText;

            if (failed.length > 0) {
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

    #proposeProducts(productIds, qty = 1, { pickOne = false, random = false } = {}) {
        const actions = productIds.map((id) => {
            const product = this.#productsById.get(String(id));
            const stock = Number(product?.stock) || 1;
            const offerQty = random ? 1 : Math.min(Math.max(1, qty), stock);
            return { id: String(id), qty: offerQty };
        });

        this.#pendingCart = { actions, pickOne };

        return this.#formatProposalMessage(productIds, qty, { pickOne, random });
    }

    #formatProposalMessage(productIds, qty = 1, { pickOne = false, random = false } = {}) {
        const lines = productIds
            .map((id) => {
                const product = this.#productsById.get(String(id));
                if (!product) return null;
                const name = product.name ?? 'Producto';
                const price = formatPrice(Number(product.price) || 0);
                const lineQty = random ? 1 : Math.min(qty, Number(product.stock) || qty);
                const label = lineQty > 1 ? `${name} (x${lineQty})` : name;
                return `• ${label} — ${price}`;
            })
            .filter(Boolean);

        let intro;
        if (pickOne) {
            intro = 'Tengo estas opciones:';
        } else if (random) {
            intro =
                lines.length === 1
                    ? 'Te propongo esto del catálogo:'
                    : 'Te propongo estas opciones del catálogo:';
        } else {
            intro = lines.length === 1 ? 'Te propongo esto:' : 'Te propongo estas opciones:';
        }

        const confirm = pickOne
            ? '\n\n¿Cuál quieres? Dime el nombre o confirma una con "sí".'
            : '\n\n¿Los agrego al carrito? Responde sí, dale o agrégalo.';

        return `${intro}\n${lines.join('\n')}${confirm}`;
    }

    #resolvePendingCart(userText) {
        if (!this.#pendingCart?.actions?.length) return [];

        const { actions, pickOne } = this.#pendingCart;

        if (actions.length === 1) {
            return actions;
        }

        const ids = extractProductIdsFromText(userText, this.#productsById);
        const matched = actions.filter((a) => ids.includes(a.id));
        if (matched.length > 0) {
            return matched;
        }

        if (!pickOne && isShortConfirmation(userText)) {
            return actions;
        }

        if (isShortConfirmation(userText) && actions.length === 1) {
            return actions;
        }

        return [];
    }

    /** Guarda en memoria lo que Gemini recomendó para que "sí" funcione. */
    #rememberProductsFromReply(text) {
        if (!messageOffersCartAdd(text)) return;

        const ids = extractProductIdsFromText(text, this.#productsById);
        if (ids.length === 0) return;

        const qty = inferOrderQuantity(this.#history, text);

        this.#pendingCart = {
            actions: ids.map((id) => ({
                id,
                qty: ids.length === 1 ? qty : 1,
            })),
            pickOne: ids.length > 1,
        };
    }

    #validateGeminiCartActions(actions) {
        const validActions = [];
        const alternativeActions = [];
        const exclude = new Set();

        for (const { id, qty } of actions) {
            const key = String(id).trim();
            const product = this.#productsById.get(key);

            if (product && this.#isValidProduct(product)) {
                validActions.push({ id: key, qty });
                exclude.add(key);
                continue;
            }

            const [altId] = pickDiverseProducts(this.#productsById, 1, exclude);
            if (altId) {
                exclude.add(altId);
                alternativeActions.push({ id: altId, qty, replacedId: key });
            }
        }

        return { validActions, alternativeActions };
    }

    #buildAlternativesProposal(alternativeActions) {
        const lines = alternativeActions
            .map(({ id, qty }) => {
                const product = this.#productsById.get(String(id));
                if (!product) return null;
                const name = product.name ?? 'Producto';
                const price = formatPrice(Number(product.price) || 0);
                const offerQty = Math.min(Math.max(1, qty), Number(product.stock) || qty);
                const label = offerQty > 1 ? `${name} (x${offerQty})` : name;
                return `• ${label} — ${price}`;
            })
            .filter(Boolean);

        if (lines.length === 0) {
            return 'Ese producto no está disponible. Pídeme otra opción del catálogo.';
        }

        return `Ese producto no está disponible. Te sugiero:\n${lines.join('\n')}\n\n¿Los agrego? Responde sí, dale o agrégalo.`;
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
        if (added.length === 0 || typeof Swal === 'undefined') return;

        const pages = getPagesPath();
        const multiple = added.length > 1;
        Swal.fire({
            icon: 'success',
            title: multiple ? `${added.length} productos en el carrito` : 'Producto en el carrito',
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
