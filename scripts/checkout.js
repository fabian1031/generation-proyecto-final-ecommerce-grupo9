import { cartService } from '../services/cartSevices.js';
import { formatPrice } from '../services/utils.service.js';
import { validateCheckout } from './validations.js';

import { authService } from '../services/auth.service.js';
import { initLogin } from '../components/login.component.js';
import { showLoader, updateLoader, hideLoader } from '../components/loader.component.js';
import { initUbicacion } from '../services/departamentos-ciudades.js';

document.addEventListener('DOMContentLoaded', () => {
    const user = authService.getUser();

    initUbicacion();
    renderCheckout();
    bindCheckoutEvents();

    if (user) {
        fillCheckoutForm(user);
    } else {
        renderLoginCTA();
    }
});

function renderCheckout() {
    const cart = cartService.getCart();

    if (cart.length === 0) {
        window.location.href = '../cart.html';
        return;
    }

    const itemsContainer = document.getElementById('checkoutItems');
    itemsContainer.innerHTML = '';

    cart.forEach(item => {
        const el = document.createElement('div');

        el.className = 'd-flex justify-content-between small mb-2';

        el.innerHTML = `
            <span>${item.name} x${item.quantity}</span>
            <span>${formatPrice(item.price * item.quantity)}</span>
        `;

        itemsContainer.appendChild(el);
    });

    const total = cartService.getTotalPrice();
    const iva = total * 0.19;

    document.getElementById('checkoutProducts').textContent =
        `Productos (${cartService.getTotalItems()})`;

    document.getElementById('checkoutSubtotal').textContent =
        formatPrice(total);

    document.getElementById('checkoutIva').textContent =
        formatPrice(iva);

    document.getElementById('checkoutTotal').textContent =
        formatPrice(total + iva);
}


function fillCheckoutForm(user) {
    const map = {
        nombre: user.username || user.name || '',
        apellidos: user.lastname || '',
        correo: user.email || '',
        celular: user.phone || user.celular || ''
    };

    Object.entries(map).forEach(([key, value]) => {
        const input = document.getElementById(key);
        if (input) input.value = value;
    });
}

function renderLoginCTA() {
    const mount = document.querySelector('.checkout-container');

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="login-cta">
            <div class="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                <span class="small text-muted">
                    Inicia sesión para autocompletar tus datos
                </span>

                <button class="btn btn-primary btn-sm" id="openLogin">
                    Iniciar sesión
                </button>
            </div>
        </div>
    `;

    mount.appendChild(wrapper);

    document.getElementById('openLogin').addEventListener('click', openLoginModal);
}

function openLoginModal() {
    const mount = document.createElement('div');
    mount.id = 'loginModalMount';
    document.body.appendChild(mount);

    mount.innerHTML = `
        <div class="modal-backdrop-custom">
            <div class="modal-box">
                <button id="closeLogin" class="btn-close float-end"></button>
                <h5 class="mb-3">Iniciar sesión</h5>
                <div id="loginFormMount"></div>
            </div>
        </div>
    `;

    const loginMount = document.getElementById('loginFormMount');

    initLogin(loginMount, async (user) => {
        fillCheckoutForm(user);

        const cta = document.querySelector('.login-cta');
        if (cta) cta.remove();

        await Swal.fire({
            icon: 'success',
            title: `Bienvenido ${user.username}`,
            text: 'Tus datos fueron cargados en el formulario',
            timer: 1800,
            showConfirmButton: false
        });

        mount.remove();
    });

    document.getElementById('closeLogin').addEventListener('click', () => {
        mount.remove();
    });
}

function bindCheckoutEvents() {
    const button = document.getElementById('confirmPurchase');

    if (!button) return;

    button.addEventListener('click', async () => {

        const fields = {
            nombre: document.getElementById('nombre').value,
            apellidos: document.getElementById('apellidos').value,
            celular: document.getElementById('celular').value,
            correo: document.getElementById('correo').value,
            direccion: document.getElementById('direccion').value,
            departamento: document.getElementById('departamento').value,
            ciudad: document.getElementById('ciudad').value
        };

        const result = validateCheckout(fields);

        if (!result.valid) {
            applyValidationErrors(result.errors);
            applyValidStates(fields, result.errors);
            return;
        }

        const confirm = await Swal.fire({
            title: '¿Confirmar compra?',
            text: 'Se procesará tu pedido',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, comprar'
        });

        if (!confirm.isConfirmed) return;

        const subtotal = cartService.getTotalPrice();
        const iva = Math.round(subtotal * 0.19);
        const total = Math.round(subtotal + iva);
        const idPedido = Date.now();

        button.disabled = true;
        showLoader(
            'Te estamos redirigiendo a la pasarela de pagos...',
            'Una vez confirmado el pago, procesaremos tu pedido.',
        );

        try {
            const [res] = await Promise.all([
                fetch('https://payment.coroto.online/payment.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_pedido: idPedido,
                        nombre: fields.nombre.trim(),
                        apellido: fields.apellidos.trim(),
                        email: fields.correo.trim(),
                        telefono: fields.celular.trim(),
                        direccion: fields.direccion.trim(),
                        departamento: fields.departamento,
                        ciudad: fields.ciudad,
                        total,
                        iva,
                    }),
                }),
                wait(1800),
            ]);

            updateLoader('Te estamos redirigiendo a la pasarela de pagos...');

            const payment = await res.json();

            if (payment.status === 'ok' && payment.url_pse) {
                sessionStorage.setItem('corotoOrder', JSON.stringify({
                    id_pedido: idPedido,
                    id_transaccion: payment.id_transaccion,
                    order_id: payment.order_id,
                    createdAt: new Date().toISOString(),
                    items: cartService.getCart(),
                    subtotal,
                    iva,
                    total,
                    customer: {
                        nombre: fields.nombre.trim(),
                        apellido: fields.apellidos.trim(),
                        email: fields.correo.trim(),
                        telefono: fields.celular.trim(),
                        direccion: fields.direccion.trim(),
                        departamento: fields.departamento,
                        ciudad: fields.ciudad,
                    },
                }));

                await wait(2000);
                cartService.clear();
                window.location.href = payment.url_pse;
                return;
            }

            throw new Error(payment.mensaje || 'No se pudo iniciar el pago');
        } catch (error) {
            hideLoader();
            button.disabled = false;

            await Swal.fire({
                icon: 'error',
                title: 'Error al procesar el pago',
                text: error.message || 'No se pudo conectar con la pasarela de pagos',
            });
        }
    });
}



function applyValidationErrors(errors) {
    document.querySelectorAll('.form-control, .form-select').forEach(input => {
        input.classList.remove('is-invalid', 'is-valid');
    });

    document.querySelectorAll('.invalid-feedback').forEach(el => {
        el.textContent = '';
    });

    for (const [field, message] of Object.entries(errors)) {
        const input = document.getElementById(field);

        if (!input) continue;

        input.classList.add('is-invalid');

        const feedback = input.nextElementSibling;
        if (feedback) {
            feedback.textContent = message;
        }
    }
}

function applyValidStates(fields, errors) {
    for (const key in fields) {
        if (!errors[key]) {
            const input = document.getElementById(key);
            if (input && input.value.trim()) {
                input.classList.add('is-valid');
            }
        }
    }
}

function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}