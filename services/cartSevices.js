const STORAGE_KEY = 'cart';

export const cartService = {
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
            cart.push({ ...product, quantity: 1 });
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
        return this.getCart()
            .reduce((acc, item) => acc + item.quantity, 0);
    },

    getTotalPrice() {
        return this.getCart()
            .reduce((acc, item) => acc + item.price * item.quantity, 0);
    },

    updateBadge() {
        const total = this.getTotalItems();

        const desktop = document.getElementById('cart-count');
        const mobile = document.getElementById('cart-count-mobile');

        const update = (el) => {
            if (!el) return;

            if (total > 0) {
                el.textContent = total;
                el.style.display = 'inline-block';
            } else {
                el.textContent = '';
                el.style.display = 'none';
            }
        };

        update(desktop);
        update(mobile);
    }
};