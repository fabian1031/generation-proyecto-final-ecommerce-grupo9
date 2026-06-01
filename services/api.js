const BASE_URL = 'https://coroto-backend.onrender.com';

const DEFAULT_TIMEOUT_MS = 45000;
const DEFAULT_RETRIES = 4;
const RETRY_BASE_DELAY_MS = 2500;

const RETRYABLE_STATUS = new Set([408, 429, 502, 503, 504]);

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

function isNetworkError(error) {
    return error instanceof TypeError || error?.name === 'AbortError';
}

function shouldRetryStatus(status, attempt, maxRetries) {
    if (attempt >= maxRetries) return false;
    if (RETRYABLE_STATUS.has(status)) return true;
    /* Render en frío puede devolver 403/401 antes de estar listo */
    if (status === 403 || status === 401) return true;
    return false;
}

async function parseErrorBody(response) {
    try {
        return await response.json();
    } catch {
        return {};
    }
}

async function request(endpoint, options = {}, attempt = 0) {
    const maxRetries = options.retries ?? DEFAULT_RETRIES;
    const timeoutMs = options.timeout ?? DEFAULT_TIMEOUT_MS;

    const { retries: _r, timeout: _t, ...fetchOptions } = options;

    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...fetchOptions.headers,
        },
        ...fetchOptions,
    };

    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
    config.signal = controller.signal;

    try {
        const response = await fetch(`${BASE_URL}${endpoint}`, config);
        clearTimeout(timeoutId);

        if (!response.ok) {
            if (shouldRetryStatus(response.status, attempt, maxRetries)) {
                await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
                return request(endpoint, options, attempt + 1);
            }

            const errorBody = await parseErrorBody(response);
            const message =
                errorBody?.message ||
                errorBody?.error ||
                `Error ${response.status}: ${response.statusText}`;

            if (response.status === 401) {
                throw new Error('AUTH');
            }
            if (response.status === 403) {
                throw new Error('FORBIDDEN');
            }

            throw new Error(message);
        }

        if (response.status === 204) return null;

        return response.json();
    } catch (error) {
        clearTimeout(timeoutId);

        const canRetry = attempt < maxRetries && isNetworkError(error);

        if (canRetry) {
            await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
            return request(endpoint, options, attempt + 1);
        }

        if (error?.name === 'AbortError') {
            throw new Error('TIMEOUT');
        }

        if (error instanceof TypeError) {
            throw new Error('NETWORK');
        }

        throw error;
    }
}

export const api = {
    get: (endpoint, options) => request(endpoint, { method: 'GET', ...options }),
    post: (endpoint, body, options) =>
        request(endpoint, { method: 'POST', body: JSON.stringify(body), ...options }),
    put: (endpoint, body, options) =>
        request(endpoint, { method: 'PUT', body: JSON.stringify(body), ...options }),
    patch: (endpoint, body, options) =>
        request(endpoint, { method: 'PATCH', body: JSON.stringify(body), ...options }),
    delete: (endpoint, options) => request(endpoint, { method: 'DELETE', ...options }),
};
