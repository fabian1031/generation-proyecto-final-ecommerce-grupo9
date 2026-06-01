/**
 * Utilidades compartidas para paneles admin (productos y usuarios).
 */

const DEFAULT_LOAD_ATTEMPTS = 8;
const DEFAULT_LOAD_DELAY_MS = 2500;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Espera a que jQuery, DataTables y Bootstrap estén listos.
 */
export async function waitForAdminDependencies(maxMs = 20000) {
    const start = Date.now();
    while (Date.now() - start < maxMs) {
        if (window.jQuery?.fn?.DataTable && window.bootstrap) {
            return true;
        }
        await new Promise((resolve) => setTimeout(resolve, 50));
    }
    return false;
}

/**
 * Errores que suelen ser temporales (Render despertando, red, gateway).
 * @param {unknown} error
 */
export function isRetryableAdminLoadError(error) {
    if (!error) return false;
    if (error instanceof TypeError) return true;
    if (error?.name === "AbortError") return true;

    const msg = String(error?.message || error).toLowerCase();

    if (msg === "timeout" || msg === "network" || msg === "auth" || msg === "forbidden") {
        return true;
    }

    if (
        msg.includes("failed to fetch") ||
        msg.includes("network") ||
        msg.includes("conectar") ||
        msg.includes("tardó demasiado") ||
        msg.includes("502") ||
        msg.includes("503") ||
        msg.includes("504") ||
        msg.includes("408") ||
        msg.includes("429")
    ) {
        return true;
    }

    /* Durante el arranque en frío el backend a veces responde 403/401 antes de estar listo */
    if (msg.includes("permiso") || msg.includes("no autorizado") || msg.includes("sesión expirada")) {
        return true;
    }

    return false;
}

/**
 * Reintenta la carga en silencio (sin toasts ni banners entre intentos).
 * @template T
 * @param {() => Promise<T>} fn
 * @param {{ maxAttempts?: number, baseDelayMs?: number }} [options]
 * @returns {Promise<T>}
 */
export async function loadWithSilentRetry(fn, options = {}) {
    const maxAttempts = options.maxAttempts ?? DEFAULT_LOAD_ATTEMPTS;
    const baseDelayMs = options.baseDelayMs ?? DEFAULT_LOAD_DELAY_MS;
    let lastError;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            const isLast = attempt >= maxAttempts;
            if (isLast || !isRetryableAdminLoadError(error)) {
                throw error;
            }
            await sleep(baseDelayMs * Math.min(attempt, 4));
        }
    }

    throw lastError;
}

export function showLoadErrorBanner(slotId, { title, message, onRetry }) {
    const slot = document.getElementById(slotId);
    if (!slot) return;

    slot.className = "mb-3";
    slot.innerHTML = `
        <div class="alert alert-warning d-flex align-items-start gap-2 mb-0" role="alert">
            <i class="bi bi-wifi-off fs-4 flex-shrink-0"></i>
            <div class="flex-grow-1">
                <strong>${escapeHtml(title)}</strong>
                <p class="mb-2 small">${escapeHtml(message)}</p>
                <button type="button" class="btn btn-sm btn-outline-dark" data-admin-retry>
                    <i class="bi bi-arrow-clockwise me-1"></i>Reintentar
                </button>
            </div>
        </div>`;

    slot.querySelector("[data-admin-retry]")?.addEventListener("click", onRetry);
}

export function hideLoadErrorBanner(slotId) {
    const slot = document.getElementById(slotId);
    if (!slot) return;
    slot.innerHTML = "";
    slot.className = "d-none";
}

export function setAdminActionsDisabled(buttonIds, disabled) {
    buttonIds.forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.disabled = disabled;
    });
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text ?? "");
    return div.innerHTML;
}
