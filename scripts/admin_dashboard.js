/**
 * Panel de administración de productos — orquestador principal.
 */

import {
    initProductsTable,
    refreshProductsTable,
    setStatusFilter,
    setTableActionHandlers,
    setProductLookup,
} from "./admin/products-table.js";
import {
    initProductForm,
    openCreateProduct,
    openEditProduct,
    toggleProductActive,
    fetchAllProducts,
    setOnProductsChanged,
} from "./admin/products-form.js";
import { setLoading, showToast, SLOW_API_HINT } from "./admin/products-feedback.js";
import {
    waitForAdminDependencies,
    showLoadErrorBanner,
    hideLoadErrorBanner,
    setAdminActionsDisabled,
    loadWithSilentRetry,
} from "./admin/admin-bootstrap.js";

const LOAD_ERROR_SLOT = "adminLoadError";
const ACTION_BUTTONS = ["btnRefreshProducts", "btnCreateProduct"];

document.addEventListener("DOMContentLoaded", () => {
    bootstrapDashboard();
});

async function bootstrapDashboard() {
    initProductForm();

    setTableActionHandlers({
        onEdit: openEditProduct,
        onToggleActive: toggleProductActive,
    });

    setOnProductsChanged(reloadProducts);

    document.querySelectorAll(".shopify-filter-pill[data-filter]").forEach((btn) => {
        btn.addEventListener("click", () => setStatusFilter(btn.dataset.filter));
    });

    document.getElementById("btnRefreshProducts")?.addEventListener("click", () => reloadProducts(true));
    document.getElementById("btnCreateProduct")?.addEventListener("click", openCreateProduct);

    window.openCreateProduct = openCreateProduct;
    window.setFilter = setStatusFilter;

    const depsReady = await waitForAdminDependencies();
    if (!depsReady) {
        showLoadErrorBanner(LOAD_ERROR_SLOT, {
            title: "No se pudo iniciar la tabla",
            message: "Recarga la página para volver a intentar.",
            onRetry: () => location.reload(),
        });
        return;
    }

    await reloadProducts();
}

async function reloadProducts(showUpdatedToast = false) {
    setAdminActionsDisabled(ACTION_BUTTONS, true);
    hideLoadErrorBanner(LOAD_ERROR_SLOT);
    setLoading(true, "Obteniendo listado de productos…", SLOW_API_HINT);

    try {
        const products = await loadWithSilentRetry(fetchAllProducts);
        setProductLookup(products);

        if (window.jQuery.fn.DataTable.isDataTable("#productsTable")) {
            refreshProductsTable(products);
        } else {
            initProductsTable(products);
        }

        if (showUpdatedToast) {
            showToast("info", "Listado actualizado");
        }
    } catch {
        showLoadErrorBanner(LOAD_ERROR_SLOT, {
            title: "No se pudo cargar el inventario",
            message: "Comprueba tu conexión e intenta de nuevo.",
            onRetry: () => reloadProducts(),
        });
    } finally {
        setLoading(false);
        setAdminActionsDisabled(ACTION_BUTTONS, false);
    }
}
