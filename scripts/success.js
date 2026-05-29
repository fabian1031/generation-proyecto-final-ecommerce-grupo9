import { formatPrice } from '../services/utils.service.js';
import { sendOrderConfirmation } from '../services/email.service.js';

const ORDER_KEY = 'corotoOrder';
const EMAIL_SENT_KEY = 'corotoEmailSent';
const SALES_HISTORY_KEY = 'corotoSalesHistory';

const params = new URLSearchParams(window.location.search);
const transactionId = params.get('id');

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

function capitalize(text) {
    return text
        .toLowerCase()
        .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

// ─── NUEVA FUNCIÓN: guardar venta en historial localStorage ───────────────────
function saveOrderToSalesHistory(order) {
    try {
        const raw = localStorage.getItem(SALES_HISTORY_KEY);
        const history = raw ? JSON.parse(raw) : [];

        const sale = {
            id_pedido:       order.id_pedido,
            id_transaccion:  order.id_transaccion || transactionId || null,
            order_id:        order.order_id || null,
            createdAt:       order.createdAt || new Date().toISOString(),
            subtotal:        order.subtotal,
            iva:             order.iva,
            total:           order.total,
            items:           order.items,
            customer: {
                nombre:      order.customer.nombre,
                apellido:    order.customer.apellido,
                email:       order.customer.email,
                telefono:    order.customer.telefono,
                ciudad:      order.customer.ciudad,
                departamento: order.customer.departamento,
            },
        };

        // Evita duplicados por id_pedido
        const exists = history.some(s => s.id_pedido === sale.id_pedido);
        if (!exists) {
            history.push(sale);
            localStorage.setItem(SALES_HISTORY_KEY, JSON.stringify(history));
        }
    } catch (err) {
        console.error('[SalesHistory] Error al guardar venta:', err);
    }
}
// ─────────────────────────────────────────────────────────────────────────────

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

    document.getElementById('successOrderId').textContent =
        order.order_id || `#${order.id_pedido}`;
    document.getElementById('successTransaction').textContent =
        transactionId || order.id_transaccion || '—';
    document.getElementById('successDate').textContent = formatDate(order.createdAt);

    document.getElementById('successItems').innerHTML = order.items.map((item) => `
        <div class="d-flex justify-content-between align-items-start small mb-2">
            <div>
                <span class="fw-semibold d-block">${item.name}</span>
                <span class="text-muted">Cantidad: ${item.quantity}</span>
            </div>
            <span class="fw-semibold">${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join('');
}

// ─── FLUJO PRINCIPAL ──────────────────────────────────────────────────────────
const savedOrder = sessionStorage.getItem(ORDER_KEY);

if (!savedOrder) {
    content.classList.add('d-none');
    errorView.classList.remove('d-none');
} else {
    const order = JSON.parse(savedOrder);

    if (transactionId) {
        order.id_transaccion = transactionId;
    }

    renderOrder(order);

    // ← GUARDA LA VENTA ANTES de eliminarla del sessionStorage
    saveOrderToSalesHistory(order);

    if (sessionStorage.getItem(EMAIL_SENT_KEY) !== String(order.id_pedido)) {
        sendOrderConfirmation(order)
            .then(() => sessionStorage.setItem(EMAIL_SENT_KEY, String(order.id_pedido)))
            .catch((error) => {
                console.error('Error enviando correos del pedido:', error.message || error);
            });
    }

    sessionStorage.removeItem(ORDER_KEY);
}