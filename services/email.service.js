import { formatPrice } from './utils.service.js';
import {
    camposCorreo,
    EMAILJS_CONTACT_TEMPLATE_ID,
    EMAILJS_ORDER_TEMPLATE_ID,
    sendEmail,
    STORE_EMAIL,
    wait,
} from './emailjs.service.js';

const VERDE = '#32594b';
const VERDE_CLARO = '#9BBFB5';

function titulo(texto) {
    return texto.toLowerCase().replace(/(^|\s)\S/g, (letra) => letra.toUpperCase());
}

function tarjeta(tituloTarjeta, contenido) {
    return `
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;border:1px solid #e9ecef;border-radius:8px;background:#fff;">
            <tr>
                <td style="padding:20px;font-family:Arial,sans-serif;">
                    <p style="margin:0 0 16px;font-size:12px;font-weight:700;text-transform:uppercase;color:${VERDE};">${tituloTarjeta}</p>
                    ${contenido}
                </td>
            </tr>
        </table>
    `;
}

function fila(etiqueta, valor) {
    return `
        <p style="margin:0 0 12px;">
            <span style="display:block;font-size:12px;color:#6c757d;">${etiqueta}</span>
            <span style="display:block;font-size:14px;font-weight:600;color:#212529;">${valor}</span>
        </p>
    `;
}

function plantillaCorreo(icono, tituloTexto, subtitulo, cuerpo, pie) {
    return `
        <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8f9fa;padding:24px 12px;">
            <tr>
                <td align="center">
                    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:640px;">
                        <tr>
                            <td align="center" style="padding-bottom:24px;font-family:Arial,sans-serif;">
                                <div style="width:48px;height:48px;line-height:48px;border-radius:50%;background:${VERDE_CLARO};color:${VERDE};font-size:28px;margin:0 auto 12px;">${icono}</div>
                                <h1 style="margin:0 0 8px;font-size:24px;color:#212529;">${tituloTexto}</h1>
                                <p style="margin:0;font-size:14px;color:#6c757d;">${subtitulo}</p>
                            </td>
                        </tr>
                        <tr><td>${cuerpo}</td></tr>
                        <tr>
                            <td align="center" style="padding-top:8px;font-family:Arial,sans-serif;">
                                <p style="margin:0;font-size:12px;color:#6c757d;">${pie}</p>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    `.trim();
}

function htmlPedido(order) {
    const nombre = titulo(`${order.customer.nombre} ${order.customer.apellido}`.trim());
    const direccion = titulo(`${order.customer.direccion}, ${order.customer.ciudad}, ${order.customer.departamento}`);
    const pedidoId = order.order_id || order.id_pedido;
    const fecha = new Date(order.createdAt).toLocaleString('es-CO');

    const productos = order.items.map((item) => `
        <p style="margin:0 0 8px;font-size:14px;">
            <strong>${item.name}</strong> x${item.quantity} — ${formatPrice(item.price * item.quantity)}
        </p>
    `).join('');

    const cuerpo = `
        ${tarjeta('Resumen del pedido', `
            ${productos}
            <hr style="border:none;border-top:1px solid #dee2e6;margin:16px 0;">
            ${fila('Subtotal', formatPrice(order.subtotal))}
            ${fila('IVA (19%)', formatPrice(order.iva))}
            ${fila('Total', formatPrice(order.total))}
        `)}
        ${tarjeta('Datos del cliente', `
            ${fila('Nombre', nombre)}
            ${fila('Email', order.customer.email)}
            ${fila('Teléfono', order.customer.telefono)}
            ${fila('Dirección', direccion)}
        `)}
        ${tarjeta('Pago', `
            ${fila('Pedido', pedidoId)}
            ${fila('Transacción', order.id_transaccion || '—')}
            ${fila('Fecha', fecha)}
            ${fila('Método', 'OpenPay PSE')}
        `)}
    `;

    return plantillaCorreo(
        '✓',
        '¡Gracias por tu compra!',
        'Tu pedido quedó registrado.',
        cuerpo,
        'Procesaremos tu envío cuando el banco confirme el pago.',
    );
}

function htmlContacto({ name, email, cellphone, message }) {
    const cuerpo = `
        ${tarjeta('Datos', `
            ${fila('Nombre', titulo(name))}
            ${fila('Email', email)}
            ${fila('Teléfono', cellphone)}
        `)}
        ${tarjeta('Mensaje', `<p style="margin:0;font-size:14px;line-height:1.6;">${message}</p>`)}
    `;

    return plantillaCorreo(
        '✉',
        'Mensaje de contacto',
        `${titulo(name)} escribió desde la web.`,
        cuerpo,
        'Responde al cliente desde tu correo.',
    );
}

export async function sendOrderConfirmation(order) {
    const pedidoId = order.order_id || order.id_pedido;
    const emailCliente = order.customer.email.trim();
    const nombreCliente = `${order.customer.nombre} ${order.customer.apellido}`.trim();
    const html = htmlPedido(order);

    const base = { html_resumen: html };

    await sendEmail(EMAILJS_ORDER_TEMPLATE_ID, {
        ...base,
        ...camposCorreo(STORE_EMAIL, 'Coroto', `[Coroto] Nuevo pedido #${pedidoId}`, emailCliente),
    });

    await wait(2000);

    await sendEmail(EMAILJS_ORDER_TEMPLATE_ID, {
        ...base,
        ...camposCorreo(emailCliente, nombreCliente, `Tu compra en Coroto #${pedidoId}`, STORE_EMAIL),
    });
}

export async function sendContactMessage(data) {
    const html = htmlContacto(data);

    await sendEmail(EMAILJS_CONTACT_TEMPLATE_ID, {
        html_resumen: html,
        ...camposCorreo(STORE_EMAIL, 'Coroto', `[Coroto] Contacto de ${data.name}`, data.email),
    });

    await wait(2000);

    await sendEmail(EMAILJS_CONTACT_TEMPLATE_ID, {
        html_resumen: html,
        ...camposCorreo(data.email, data.name, 'Recibimos tu mensaje — Coroto', STORE_EMAIL),
    });
}
