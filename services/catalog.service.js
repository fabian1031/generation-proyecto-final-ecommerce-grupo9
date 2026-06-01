import { Product } from '../models/Product.js';
import { productService } from './product.service.js';

const CATALOG_READY = 'coroto:catalog-ready';

let cachedProducts = null;
let loadPromise = null;

export function normalizeCatalogItems(data) {
    if (!Array.isArray(data)) {
        return [];
    }

    return data
        .map((item) => new Product(item))
        .filter((p) => p.isActive !== false && Number(p.stock) > 0);
}

/**
 * Carga el catálogo desde Render con reintentos (útil cuando el servicio free despierta).
 */
export async function fetchCatalog({ retries = 4, force = false } = {}) {
    if (force) {
        loadPromise = null;
    }

    if (!force && cachedProducts?.length) {
        return cachedProducts;
    }

    if (!force && loadPromise) {
        return loadPromise;
    }

    loadPromise = (async () => {
        let lastProducts = cachedProducts ?? [];

        for (let attempt = 0; attempt < retries; attempt++) {
            try {
                const data = await productService.getAll();
                const products = normalizeCatalogItems(data);

                if (products.length > 0) {
                    cachedProducts = products;
                    window.dispatchEvent(
                        new CustomEvent(CATALOG_READY, { detail: products })
                    );
                    return products;
                }

                lastProducts = products;
            } catch {
                // Reintento (403/timeout mientras Render despierta)
            }

            if (attempt < retries - 1) {
                await new Promise((resolve) => setTimeout(resolve, 1200 * (attempt + 1)));
            }
        }

        cachedProducts = lastProducts;
        return cachedProducts;
    })();

    try {
        return await loadPromise;
    } finally {
        loadPromise = null;
    }
}

export function getCachedCatalog() {
    return cachedProducts ?? [];
}

export function onCatalogReady(listener) {
    const handler = (event) => listener(event.detail ?? []);

    window.addEventListener(CATALOG_READY, handler);

    const existing = getCachedCatalog();
    if (existing.length > 0) {
        listener(existing);
    }

    return () => window.removeEventListener(CATALOG_READY, handler);
}
