import { Product } from '../models/Product.js';
import { productService } from '../services/product.service.js';

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

        const data = await productService.getAll();
        allProducts = data.map(p => new Product(p));
 
        buildCategoryFilters(allProducts);
        renderProducts(allProducts);
    } catch (error) {
        console.error(error);
        showAlert({ type: 'error', message: 'No se pudieron cargar los productos.' });
    }
}
 
loadProducts();
 