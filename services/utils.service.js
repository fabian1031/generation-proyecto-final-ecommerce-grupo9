export function getAppBase() {
    const path = window.location.pathname;
    const pagesMarker = '/pages/';
    const pagesIdx = path.indexOf(pagesMarker);

    if (pagesIdx !== -1) {
        return path.slice(0, pagesIdx + 1);
    }

    return path.substring(0, path.lastIndexOf('/') + 1);
}

export function getPagesBase() {
    return `${getAppBase()}pages/`;
}

export function formatPrice(price) {
    return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(price);
}

export const debounce = (fn, delay = 300) => {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
    };
};