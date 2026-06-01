/**
 * Feedback visual: overlay de carga, toasts y diálogos de confirmación.
 */

const TOAST_CONTAINER_ID = "adminToastContainer";
const SLOW_HINT_DELAY_MS = 6000;

let slowHintTimer = null;

function getLoadingOverlay() {
    return (
        document.getElementById("productsLoadingOverlay") ||
        document.getElementById("usersLoadingOverlay")
    );
}

function clearSlowHintTimer() {
    if (slowHintTimer) {
        clearTimeout(slowHintTimer);
        slowHintTimer = null;
    }
}

/**
 * @param {boolean} visible
 * @param {string} [message] — texto principal bajo el título
 * @param {string} [slowMessage] — aviso si la carga supera ~6 s
 */
export function setLoading(visible, message = "Procesando…", slowMessage = null) {
    const overlay = getLoadingOverlay();
    if (!overlay) return;

    const messageEl = overlay.querySelector(".admin-loading-message");
    const hintEl = overlay.querySelector(".admin-loading-hint");
    const card = overlay.querySelector(".admin-loading-card");

    clearSlowHintTimer();

    if (visible) {
        if (messageEl) messageEl.textContent = message;
        if (hintEl) {
            hintEl.textContent = "";
            hintEl.classList.add("d-none");
        }
        card?.setAttribute("aria-busy", "true");
        overlay.classList.remove("d-none");
        overlay.setAttribute("aria-hidden", "false");

        if (slowMessage && hintEl) {
            slowHintTimer = setTimeout(() => {
                hintEl.textContent = slowMessage;
                hintEl.classList.remove("d-none");
            }, SLOW_HINT_DELAY_MS);
        }
        return;
    }

    card?.setAttribute("aria-busy", "false");
    overlay.classList.add("d-none");
    overlay.setAttribute("aria-hidden", "true");
}

export function showToast(type, title, detail = "") {
    let container = document.getElementById(TOAST_CONTAINER_ID);
    if (!container) {
        container = document.createElement("div");
        container.id = TOAST_CONTAINER_ID;
        container.className = "toast-container position-fixed top-0 end-0 p-3";
        container.style.zIndex = "1100";
        document.body.appendChild(container);
    }

    const id = `toast-${Date.now()}`;
    const iconMap = {
        success: "bi-check-circle-fill",
        danger: "bi-exclamation-triangle-fill",
        warning: "bi-exclamation-circle-fill",
        info: "bi-info-circle-fill",
    };

    container.insertAdjacentHTML(
        "beforeend",
        `
        <div id="${id}" class="toast align-items-center text-bg-${type} border-0" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body">
                    <i class="bi ${iconMap[type] || iconMap.info} me-2"></i>
                    <strong>${escapeHtml(title)}</strong>
                    ${detail ? `<div class="small mt-1 opacity-90">${escapeHtml(detail)}</div>` : ""}
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Cerrar"></button>
            </div>
        </div>`
    );

    const el = document.getElementById(id);
    const toast = bootstrap.Toast.getOrCreateInstance(el, { delay: 5000 });
    el.addEventListener("hidden.bs.toast", () => el.remove());
    toast.show();
}

export async function confirmAction({
    title,
    text,
    icon = "warning",
    confirmText = "Confirmar",
    cancelText = "Cancelar",
}) {
    if (typeof Swal !== "undefined") {
        const result = await Swal.fire({
            title,
            text,
            icon,
            showCancelButton: true,
            confirmButtonText: confirmText,
            cancelButtonText: cancelText,
            confirmButtonColor: "#32594b",
            cancelButtonColor: "#6c757d",
        });
        return result.isConfirmed;
    }
    return window.confirm(`${title}\n\n${text}`);
}

export function getErrorMessage(error, fallback = "Ocurrió un error inesperado.") {
    const internalMessages = {
        AUTH: "Sesión expirada. Inicia sesión como administrador.",
        FORBIDDEN: "No tienes permisos para esta acción.",
        TIMEOUT: "El servidor tardó demasiado en responder. Intenta de nuevo.",
        NETWORK: "No se pudo conectar con el servidor. Comprueba tu conexión.",
    };

    if (error instanceof Error && error.message) {
        return internalMessages[error.message] ?? error.message;
    }
    if (typeof error === "string") {
        return internalMessages[error] ?? error;
    }
    return fallback;
}

export async function withAsyncFeedback(
    fn,
    {
        loadingMessage = "Procesando…",
        slowMessage = "El servidor puede tardar un poco. Por favor espera…",
        successTitle = "Listo",
        successDetail = "",
        errorTitle = "Error",
        errorFallback = "No se pudo completar la operación. Intenta de nuevo.",
        showSuccessToast = true,
    } = {}
) {
    setLoading(true, loadingMessage, slowMessage);
    try {
        await fn();
        if (showSuccessToast) {
            showToast("success", successTitle, successDetail);
        }
    } catch (error) {
        const detail = getErrorMessage(error, errorFallback);
        showToast("danger", errorTitle, detail);
        throw error;
    } finally {
        setLoading(false);
    }
}

/** Mensaje interno del preloader (no se muestra como error al usuario) */
export const SLOW_API_HINT =
    "Sigue conectando con el servidor. Esto puede tardar un momento…";

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text ?? "");
    return div.innerHTML;
}
