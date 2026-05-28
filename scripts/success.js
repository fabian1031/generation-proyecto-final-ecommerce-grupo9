import { formatPrice } from '../services/utils.service.js';
import { sendOrderConfirmation } from '../services/email.service.js';

const ORDER_KEY = 'corotoOrder';
const EMAIL_SENT_KEY = 'corotoEmailSent';
const transactionId = new URLSearchParams(window.location.search).get('id');

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
    return text.toLowerCase().replace(/(^|\s)\S/g, (l) => l.toUpperCase());
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

    document.getElementById('successItems').innerHTML = order.items.map((item) => `
        <div class="d-flex justify-content-between small mb-2">
            <span>${item.name} x${item.quantity}</span>
            <span class="fw-semibold">${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join('');
}

const saved = sessionStorage.getItem(ORDER_KEY);

if (!saved) {
    content.classList.add('d-none');
    errorView.classList.remove('d-none');
} else {
    const order = JSON.parse(saved);
    if (transactionId) order.id_transaccion = transactionId;
    renderOrder(order);

    if (sessionStorage.getItem(EMAIL_SENT_KEY) !== String(order.id_pedido)) {
        sendOrderConfirmation(order)
            .then(() => sessionStorage.setItem(EMAIL_SENT_KEY, String(order.id_pedido)))
            .catch((e) => console.error(e));
    }

    sessionStorage.removeItem(ORDER_KEY);
}
