import { api } from '../services/api.js';
// import { Product } from './models/Product.js';

export class Product {
    constructor({ id, name, price, stock, category, description, image }) {
        this.id = id;
        this.name = name;
        this.price = price;
        this.stock = stock;
        this.category = category;
        this.description = description;
        this.image = image;
    }
}

export const productService = {
    getAll: () => api.get('/products'),
    getById: (id) => api.get(`/products/${id}`),
    getByCategory: (cat) => api.get(`/products?category=${cat}`),
};

const mockProducts = [
    new Product({ id: 1, name: 'Camiseta Básica Verde', price: 45000, stock: 20, category: 'Ropa', description: 'Camiseta de algodón 100% en tono verde oliva, ideal para el día a día.', image: '../assets/products/img.png' }),
    new Product({ id: 2, name: 'Bolso de Cuero Café', price: 120000, stock: 5, category: 'Accesorios', description: 'Bolso artesanal en cuero genuino color café con detalles cosidos a mano.', image: '../assets/products/img.png' }),
    new Product({ id: 3, name: 'Zapatillas Urbanas', price: 180000, stock: 12, category: 'Calzado', description: 'Zapatillas livianas con suela de goma y diseño minimalista.', image: '../assets/products/img.png' }),
    new Product({ id: 4, name: 'Reloj Minimalista', price: 95000, stock: 8, category: 'Accesorios', description: 'Reloj de pulsera con correa de cuero y esfera limpia en blanco y negro.', image: '../assets/products/img.png' }),
    new Product({ id: 5, name: 'Chaqueta Ligera Beige', price: 210000, stock: 6, category: 'Ropa', description: 'Chaqueta cortavientos en tela técnica color beige, perfecta para climas frescos.', image: '../assets/products/img.png' }),
    new Product({ id: 6, name: 'Sandalias de Playa', price: 60000, stock: 18, category: 'Calzado', description: 'Sandalias cómodas con tiras ajustables, ideales para la playa o el campo.', image: '../assets/products/img.png' }),
    new Product({ id: 7, name: 'Cinturón Trenzado', price: 38000, stock: 10, category: 'Accesorios', description: 'Cinturón trenzado a mano en cuero marrón con hebilla dorada.', image: '../assets/products/img.png' }),
    new Product({ id: 8, name: 'Polo Lino Blanco', price: 75000, stock: 15, category: 'Ropa', description: 'Polo de lino fresco y transpirable en color blanco, corte recto.', image: '../assets/products/img.png' })
];

const grid        = document.getElementById('productsGrid');
const filtersEl   = document.getElementById('categoryFilters');
const emptyState  = document.getElementById('emptyState');
 
let allProducts   = [];
let activeCategory = 'all';
 
// ── Helpers ───────────────────────────────────────────────────────────────────
 
function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);
}
 
function createProductCard(product) {
    const col = document.createElement('div');
    col.className = 'col';
    col.dataset.category = product.category;
 
    col.innerHTML = `
        <div class="card product-card h-100" data-id="${product.id}">
            <img src="${product.image}" class="card-img-top" alt="${product.name}" loading="lazy">
            <div class="card-body">
                <span class="card-category">${product.category}</span>
                <h5 class="card-title">${product.name}</h5>
                <p class="card-description">${product.description}</p>
                <div class="card-footer-custom">
                    <span class="card-price">${formatPrice(product.price)}</span>
                    <button class="btn-add-cart" data-id="${product.id}" aria-label="Agregar al carrito">
                        <i class="bi bi-cart-plus"></i> Agregar
                    </button>
                </div>
            </div>
        </div>
    `;
 
    // Navegar al detalle del producto al hacer clic en la tarjeta (no en el botón)
    col.querySelector('.product-card').addEventListener('click', (e) => {
        if (e.target.closest('.btn-add-cart')) return;
        window.location.href = `./pages/products.html?id=${product.id}`;
    });
 
    // Agregar al carrito
    col.querySelector('.btn-add-cart').addEventListener('click', (e) => {
        e.stopPropagation();
        addToCart(product);
    });
 
    return col;
}
 
function renderProducts(products) {
    // Quitar skeletons si existen
    grid.querySelectorAll('.skeleton-card-col').forEach(el => el.remove());
 
    if (products.length === 0) {
        grid.innerHTML = '';
        emptyState.classList.remove('d-none');
        return;
    }
 
    emptyState.classList.add('d-none');
    grid.innerHTML = '';
    products.forEach(p => grid.appendChild(createProductCard(p)));
}
 
function buildCategoryFilters(products) {
    const categories = [...new Set(products.map(p => p.category))];
 
    categories.forEach(cat => {
        const btn = document.createElement('button');
        btn.className = 'filter-pill';
        btn.dataset.category = cat;
        btn.textContent = cat;
        filtersEl.appendChild(btn);
    });
 
    filtersEl.addEventListener('click', (e) => {
        const pill = e.target.closest('.filter-pill');
        if (!pill) return;
 
        filtersEl.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
        pill.classList.add('active');
 
        activeCategory = pill.dataset.category;
        const filtered = activeCategory === 'all'
            ? allProducts
            : allProducts.filter(p => p.category === activeCategory);
 
        renderProducts(filtered);
    });
}
 
// ── Carrito (stub — conectar con cartService cuando lo tengas) ─────────────────
function addToCart(product) {
    // TODO: reemplazar con cartService.add(product)
    showAlert({ type: 'success', message: `"${product.name}" agregado al carrito.` });
}
 
// ── Carga de productos ────────────────────────────────────────────────────────
async function loadProducts() {
    try {
        // TODO: reemplazar mock por → const data = await productService.getAll();
        //       y mapear: data.map(p => new Product(p))
        await new Promise(r => setTimeout(r, 800)); // simula latencia
        allProducts = mockProducts;
 
        buildCategoryFilters(allProducts);
        renderProducts(allProducts);
    } catch (error) {
        console.error(error);
        showAlert({ type: 'error', message: 'No se pudieron cargar los productos.' });
    }
}
 
loadProducts();
 