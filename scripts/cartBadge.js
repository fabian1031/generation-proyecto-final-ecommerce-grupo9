import { cartService } from '../services/cartSevices.js';
import { formatPrice } from '../services/utils.service.js';

const container = document.getElementById('cartItems');

function renderCart() {
    const cart = cartService.getCart();

    container.innerHTML = '';

    cart.forEach(item => {
        const el = document.createElement('div');

        el.className = 'cart-item card mb-3 border-0 shadow-sm';

        el.innerHTML = `
            <div class="card-body p-3">
                <div class="d-flex gap-3 align-items-start">

                    <div class="cart-item-image flex-shrink-0">
                        <img src="${item.image}" class="img-fluid rounded" width="80">
                    </div>

                    <div class="flex-grow-1 d-flex flex-column justify-content-between">
                        <div>
                            <p class="small text-muted mb-1">${item.brand}</p>
                            <p class="fw-semibold mb-2">${item.name}</p>
                            <p class="small text-muted mb-1">${item.description}</p>
                        </div>

                        <div class="d-flex justify-content-between mt-3">
                            <div class="d-flex align-items-center gap-2">
                                <button class="btn btn-sm btn-qty" data-action="decrease">-</button>
                                <span>${item.quantity}</span>
                                <button class="btn btn-sm btn-qty" data-action="increase">+</button>
                            </div>

                            <span class="fw-bold">${formatPrice(item.price * item.quantity)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="border-top p-2 d-flex justify-content-end">
                <button class="btn btn-sm text-danger" data-action="delete">
                    <i class="bi bi-trash"></i>
                </button>
            </div>
        `;

        // eventos
        el.querySelector('[data-action="increase"]').onclick = () => {
            cartService.updateQuantity(item.id, item.quantity + 1);
            renderCart();
        };

        el.querySelector('[data-action="decrease"]').onclick = () => {
            if (item.quantity > 1) {
                cartService.updateQuantity(item.id, item.quantity - 1);
            } else {
                cartService.remove(item.id);
            }
            renderCart();
        };

        el.querySelector('[data-action="delete"]').onclick = async () => {

            const result = await Swal.fire({
                title: '¿Eliminar producto?',
                text: `"${item.name}" será removido del carrito`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonColor: '#dc3545',
                cancelButtonColor: '#6c757d',
                confirmButtonText: 'Sí, eliminar',
                cancelButtonText: 'Cancelar'
            });

            if (!result.isConfirmed) return;

            cartService.remove(item.id);
            renderCart();

            Swal.fire({
                icon: 'success',
                title: 'Eliminado',
                text: 'El producto fue eliminado del carrito',
                timer: 1500,
                showConfirmButton: false
            });
        };
        container.appendChild(el);
    });

    renderSummary();
}

//renderizamos aqui
function renderSummary() {
    const totalItems = cartService.getTotalItems();
    const totalPrice = cartService.getTotalPrice();
    const iva = totalPrice * 0.19;

    document.querySelector('#summary-products').textContent = `Productos (${totalItems})`;
    document.querySelector('#summary-price').textContent = formatPrice(totalPrice);
    document.querySelector('#summary-iva').textContent = formatPrice(iva);
    document.querySelector('#summary-total').textContent = formatPrice(totalPrice + iva);
}

document.getElementById('goCheckout').addEventListener('click', () => {
    const cart = cartService.getCart();

    if (cart.length === 0) {
        Swal.fire({
            icon: 'warning',
            title: 'Carrito vacío',
            text: 'Agrega productos antes de continuar'
        });
        return;
    }

    window.location.href = './checkout.html';
});

document.addEventListener('DOMContentLoaded', renderCart);