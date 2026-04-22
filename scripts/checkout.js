import { cartService } from '../services/cartSevices.js';
import { formatPrice } from '../services/utils.service.js';
import { validateCheckout } from './validations.js';

const itemsContainer = document.getElementById('checkoutItems');

function renderCheckout() {
    const cart = cartService.getCart();

    if (cart.length === 0) {
        window.location.href = '../cart.html';
        return;
    }

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
function applyValidationErrors(errors) {

    document.querySelectorAll('.form-control').forEach(input => {
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

document.getElementById('confirmPurchase').addEventListener('click', async () => {

    const fields = {
        nombre: document.getElementById('nombre').value,
        apellidos: document.getElementById('apellidos').value,
        celular: document.getElementById('celular').value,
        correo: document.getElementById('correo').value,
        direccion: document.getElementById('direccion').value
    };


    const result = validateCheckout(fields);

    if (!result.valid) {
        applyValidationErrors(result.errors);
        applyValidStates(fields, result.errors);

        const firstError = Object.keys(result.errors)[0];
        document.getElementById(firstError)?.focus();

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

    await Swal.fire({
        title: 'Procesando...',
        timer: 1500,
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
    });

    cartService.clear();

    await Swal.fire({
        icon: 'success',
        title: 'Compra realizada',
        text: 'Gracias por tu compra'
    });

    window.location.href = './index.html';


});



renderCheckout();