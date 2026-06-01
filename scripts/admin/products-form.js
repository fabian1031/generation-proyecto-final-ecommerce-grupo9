/**
 * Formulario offcanvas: crear, editar y persistir productos.
 */

import { productService } from "../../services/product.service.js";
import { confirmAction, showToast, withAsyncFeedback, SLOW_API_HINT } from "./products-feedback.js";

let selectedProduct = null;
let offcanvasInstance = null;
let onSaved = () => {};

/**
 * @param {() => Promise<void>} callback — se ejecuta tras guardar o cambiar estado
 */
export function setOnProductsChanged(callback) {
    onSaved = callback;
}

export function initProductForm() {
    const el = document.getElementById("offcanvasProducto");
    if (el) {
        offcanvasInstance = bootstrap.Offcanvas.getOrCreateInstance(el);
    }

    const saveBtn = document.getElementById("btnSaveProduct");
    if (saveBtn) {
        saveBtn.addEventListener("click", () => saveProduct());
    }
}

export function openCreateProduct() {
    selectedProduct = null;
    clearForm();
    document.getElementById("offcanvasTitle").textContent = "Crear producto";
    document.getElementById("p_active").value = "Activo";
    offcanvasInstance?.show();
}

/**
 * @param {object} product
 */
export function openEditProduct(product) {
    selectedProduct = product;
    fillForm(product);
    document.getElementById("offcanvasTitle").textContent = "Editar producto";
    offcanvasInstance?.show();
}

function fillForm(p) {
    const isActive = p.activo !== false;
    document.getElementById("p_id").value = p.id ?? "";
    document.getElementById("p_name").value = p.nombre ?? "";
    document.getElementById("p_brand").value = p.brand ?? "";
    document.getElementById("p_description").value = p.descripcion ?? "";
    document.getElementById("p_price").value = p.precio ?? 0;
    document.getElementById("p_stock").value = p.cantidad ?? 0;
    document.getElementById("p_category").value = p.categoria ?? "";
    document.getElementById("p_image").value = p.imageUrl ?? "";
    document.getElementById("p_active").value = isActive ? "Activo" : "Inactivo";
}

function clearForm() {
    fillForm({
        id: "",
        nombre: "",
        brand: "",
        descripcion: "",
        precio: 0,
        cantidad: 0,
        categoria: "",
        imageUrl: "",
        activo: true,
    });
}

function getFormData() {
    return {
        nombre: document.getElementById("p_name").value.trim(),
        brand: document.getElementById("p_brand").value.trim(),
        descripcion: document.getElementById("p_description").value.trim(),
        precio: Number(document.getElementById("p_price").value) || 0,
        cantidad: Number(document.getElementById("p_stock").value) || 0,
        categoria: document.getElementById("p_category").value.trim(),
        imageUrl: document.getElementById("p_image").value.trim(),
    };
}

function validateForm(data) {
    if (!data.nombre) {
        return "El nombre del producto es obligatorio.";
    }
    if (data.precio <= 0) {
        return "El precio debe ser mayor a cero.";
    }
    if (data.cantidad < 0) {
        return "El stock no puede ser negativo.";
    }
    if (!data.categoria) {
        return "Indica una categoría (ej. LAPTOPS, MONITORES).";
    }
    return null;
}

function buildProduct(data) {
    return {
        nombre: data.nombre,
        brand: data.brand,
        precio: data.precio,
        cantidad: data.cantidad,
        categoria: data.categoria,
        descripcion: data.descripcion,
        imageUrl: data.imageUrl,
        activo: true,
    };
}

async function saveProduct() {
    const data = getFormData();
    const validationError = validateForm(data);
    if (validationError) {
        showToast("warning", "Revisa el formulario", validationError);
        return;
    }

    const saveBtn = document.getElementById("btnSaveProduct");
    saveBtn?.setAttribute("disabled", "true");

    try {
        await withAsyncFeedback(
            async () => {
                if (selectedProduct) {
                    await productService.update(selectedProduct.id, {
                        ...selectedProduct,
                        ...data,
                    });
                } else {
                    await productService.create(buildProduct(data));
                }
                offcanvasInstance?.hide();
                await onSaved();
            },
            {
                loadingMessage: selectedProduct ? "Guardando cambios…" : "Creando producto…",
                slowMessage: SLOW_API_HINT,
                successTitle: selectedProduct ? "Producto actualizado" : "Producto creado",
                successDetail: "Los cambios ya están en el catálogo.",
                errorTitle: "No se pudo guardar",
                errorFallback: "Verifica los datos e intenta de nuevo. Si el problema continúa, revisa tu conexión.",
            }
        );
    } catch {
        /* toast ya mostrado */
    } finally {
        saveBtn?.removeAttribute("disabled");
    }
}

/**
 * Desactiva o reactiva un producto tras confirmación.
 * @param {object} product
 */
export async function toggleProductActive(product) {
    const isActive = product.activo !== false;
    const action = isActive ? "desactivar" : "reactivar";

    const confirmed = await confirmAction({
        title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} este producto?`,
        text: isActive
            ? "Dejará de mostrarse en la tienda. Podrás reactivarlo después."
            : "Volverá a estar disponible en el catálogo.",
        confirmText: isActive ? "Sí, desactivar" : "Sí, reactivar",
    });

    if (!confirmed) return;

    try {
        await withAsyncFeedback(
            async () => {
                await productService.update(product.id, {
                    ...product,
                    activo: !isActive,
                });
                await onSaved();
            },
            {
                loadingMessage: isActive ? "Desactivando…" : "Reactivando…",
                slowMessage: SLOW_API_HINT,
                successTitle: isActive ? "Producto desactivado" : "Producto reactivado",
                errorTitle: `No se pudo ${action}`,
                errorFallback: "Intenta de nuevo en unos segundos.",
            }
        );
    } catch {
        /* toast ya mostrado */
    }
}

/** Obtiene productos sin feedback visual (para reintentos silenciosos). */
export async function fetchAllProducts() {
    const data = await productService.getAll();
    return Array.isArray(data) ? data : [];
}

/** @deprecated Usar fetchAllProducts + orquestador con loadWithSilentRetry */
export async function loadAllProducts() {
    return fetchAllProducts();
}
