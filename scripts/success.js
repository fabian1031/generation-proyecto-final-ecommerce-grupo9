import { formatPrice } from '../services/utils.service.js';
import { sendOrderConfirmation } from '../services/email.service.js';
import { runSuccessTimeline } from './success-timeline.js';

const ORDER_KEY = 'corotoOrder';
const EMAIL_SENT_KEY = 'corotoEmailSent';
const SALES_HISTORY_KEY = 'salesHistory';

const transactionId = new URLSearchParams(window.location.search).get('id');

const timelineWrap = document.getElementById('successTimelineWrap');
const content = document.getElementById('successContent');
const errorView = document.getElementById('successError');

function formatDate(isoDate) {
    return new Date(isoDate).toLocaleString('es-CO', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function capitalize(text = '') {
    return text.toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase());
}

function saveOrderToSalesHistory(order) {
    try {
        const raw = localStorage.getItem(SALES_HISTORY_KEY);
        const history = raw ? JSON.parse(raw) : [];
        const sale = {
            id_pedido: order.id_pedido,
            id_transaccion: order.id_transaccion || transactionId || null,
            order_id: order.order_id || null,
            createdAt: order.createdAt || new Date().toISOString(),
            subtotal: order.subtotal,
            iva: order.iva,
            total: order.total,
            items: order.items,
            customer: order.customer,
        };
        if (!history.some((s) => s.id_pedido === sale.id_pedido)) {
            history.push(sale);
            localStorage.setItem(SALES_HISTORY_KEY, JSON.stringify(history));
        }
    } catch (err) {
        console.error('[SalesHistory]', err);
    }
}

function renderOrder(order) {
    document.getElementById('successSubtotal').textContent = formatPrice(order.subtotal);
    document.getElementById('successIva').textContent = formatPrice(order.iva);
    document.getElementById('successTotalDetail').textContent = formatPrice(order.total);
    document.getElementById('successCustomer').textContent = capitalize(
        `${order.customer.nombre} ${order.customer.apellido}`.trim(),
    );
    document.getElementById('successEmail').textContent = order.customer.email;
    document.getElementById('successPhone').textContent = order.customer.telefono;
    document.getElementById('successAddress').textContent = capitalize(
        `${order.customer.direccion}, ${order.customer.ciudad}, ${order.customer.departamento}`,
    );
    document.getElementById('successOrderId').textContent = order.order_id || `#${order.id_pedido}`;
    document.getElementById('successTransaction').textContent =
        transactionId || order.id_transaccion || '—';
    document.getElementById('successDate').textContent = formatDate(order.createdAt);
    document.getElementById('successPaymentMethod').textContent =
        order.metodo_pago === 'card' ? 'Tarjeta (OpenPay)' : 'PSE (OpenPay)';
    document.getElementById('successItems').innerHTML = order.items
        .map(
            (item) => `
            <div class="d-flex justify-content-between small mb-2">
                <span>${item.name} x${item.quantity}</span>
                <span class="fw-semibold">${formatPrice(item.price * item.quantity)}</span>
            </div>`,
        )
        .join('');
}

function hideTimeline() {
    if (timelineWrap) {
        timelineWrap.classList.add('success-timeline--removed');
        timelineWrap.setAttribute('hidden', '');
        timelineWrap.setAttribute('aria-hidden', 'true');
        timelineWrap.style.display = 'none';
    }
}

function hideSummary() {
    content?.classList.add('success-summary-hidden');
    content?.classList.remove('success-summary-visible');
    content?.setAttribute('hidden', '');
    content?.setAttribute('aria-hidden', 'true');
}

function showSummary() {
    hideTimeline();
    content?.classList.remove('success-summary-hidden');
    content?.classList.add('success-summary-visible');
    content?.removeAttribute('hidden');
    content?.setAttribute('aria-hidden', 'false');
    document.title = '¡Gracias por tu compra! | Coroto';
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showError() {
    hideTimeline();
    hideSummary();
    errorView?.classList.remove('success-summary-hidden');
    errorView?.classList.add('success-summary-visible');
    errorView?.removeAttribute('hidden');
    errorView?.setAttribute('aria-hidden', 'false');
    document.title = 'Pedido no encontrado | Coroto';
}

function revealOrderSummary(order) {
    renderOrder(order);
    showSummary();
}

async function afterOrderLoaded(order) {
    saveOrderToSalesHistory(order);
    if (localStorage.getItem(EMAIL_SENT_KEY) !== String(order.id_pedido)) {
        try {
            await sendOrderConfirmation(order);
            localStorage.setItem(EMAIL_SENT_KEY, String(order.id_pedido));
        } catch (err) {
            console.error('[Email]', err);
        }
    }
}

function init() {
    hideSummary();

    const saved = localStorage.getItem(ORDER_KEY);
    if (!saved) {
        showError();
        return;
    }

    try {
        const order = JSON.parse(saved);
        if (transactionId) order.id_transaccion = transactionId;

        runSuccessTimeline({
            onComplete: () => {
                revealOrderSummary(order);
                afterOrderLoaded(order);
            },
        });
    } catch (error) {
        console.error('[SUCCESS PAGE]', error);
        showError();
    }
}

init();
