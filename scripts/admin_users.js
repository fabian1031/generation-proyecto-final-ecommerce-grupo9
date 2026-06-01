/**
 * Panel de administración de usuarios — orquestador principal.
 */

import {
    initUsersTable,
    refreshUsersTable,
    setStatusFilter,
    setTableActionHandlers,
    setUserLookup,
} from "./admin/users-table.js";
import {
    initUserForm,
    openCreateUser,
    openEditUser,
    toggleUserActive,
    fetchAllUsers,
    setOnUsersChanged,
} from "./admin/users-form.js";
import { setLoading, showToast, SLOW_API_HINT } from "./admin/products-feedback.js";
import {
    waitForAdminDependencies,
    showLoadErrorBanner,
    hideLoadErrorBanner,
    setAdminActionsDisabled,
    loadWithSilentRetry,
} from "./admin/admin-bootstrap.js";

const LOAD_ERROR_SLOT = "adminLoadError";
const ACTION_BUTTONS = ["btnRefreshUsers", "btnCreateUser"];

document.addEventListener("DOMContentLoaded", () => {
    bootstrapUsersDashboard();
});

async function bootstrapUsersDashboard() {
    initUserForm();

    setTableActionHandlers({
        onEdit: openEditUser,
        onToggleActive: toggleUserActive,
    });

    setOnUsersChanged(reloadUsers);

    document.querySelectorAll(".shopify-filter-pill[data-filter]").forEach((btn) => {
        btn.addEventListener("click", () => setStatusFilter(btn.dataset.filter));
    });

    document.getElementById("btnRefreshUsers")?.addEventListener("click", () => reloadUsers(true));
    document.getElementById("btnCreateUser")?.addEventListener("click", openCreateUser);

    window.openCreateUser = openCreateUser;
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

    await reloadUsers();
}

async function reloadUsers(showUpdatedToast = false) {
    setAdminActionsDisabled(ACTION_BUTTONS, true);
    hideLoadErrorBanner(LOAD_ERROR_SLOT);
    setLoading(true, "Obteniendo listado de usuarios…", SLOW_API_HINT);

    try {
        const users = await loadWithSilentRetry(fetchAllUsers);
        setUserLookup(users);

        if (window.jQuery.fn.DataTable.isDataTable("#usersTable")) {
            refreshUsersTable(users);
        } else {
            initUsersTable(users);
        }

        if (showUpdatedToast) {
            showToast("info", "Listado actualizado");
        }
    } catch {
        showLoadErrorBanner(LOAD_ERROR_SLOT, {
            title: "No se pudo cargar el listado",
            message: "Comprueba tu conexión e intenta de nuevo.",
            onRetry: () => reloadUsers(),
        });
    } finally {
        setLoading(false);
        setAdminActionsDisabled(ACTION_BUTTONS, false);
    }
}
