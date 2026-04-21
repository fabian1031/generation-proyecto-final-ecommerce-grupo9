const STORAGE_KEY = 'cart';

export const cartService = {
    //funciones para el carrito, crud
    getCart() {
        return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
    },

    saveCart(cart) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    },

    add(product) {
        const cart = this.getCart();

        const existing = cart.find(item => item.id === product.id);

        if (existing) {
            existing.quantity += 1;
        } else {
            cart.push({
                ...product,
                quantity: 1
            });
        }

        this.saveCart(cart);
        this.updateBadge();
    },

    remove(id) {
        const cart = this.getCart().filter(item => item.id !== id);
        this.saveCart(cart);
        this.updateBadge();
    },

    updateQuantity(id, quantity) {
        const cart = this.getCart();

        const item = cart.find(p => p.id === id);
        if (item) item.quantity = quantity;

        this.saveCart(cart);
        this.updateBadge();
    },

    clear() {
        localStorage.removeItem(STORAGE_KEY);
        this.updateBadge();
    },

    getTotalItems() {
        return this.getCart().reduce((acc, item) => acc + item.quantity, 0);
    },

    getTotalPrice() {
        return this.getCart().reduce((acc, item) => acc + item.price * item.quantity, 0);
    },
    //funcion que nos permite actualizar la cantidad en el icono del navbar
    updateBadge() {
        const badge = document.querySelector('.cart-badge');
        if (!badge) return;

        const total = this.getTotalItems();
        badge.textContent = total > 0 ? total : '';
    }
};