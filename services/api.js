const BASE_URL = 'http://localhost:3000'; 

async function request(endpoint, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message || `Error ${response.status}: ${response.statusText}`);
    }

    // 204 No Content no tiene body
    if (response.status === 204) return null;

    return response.json();
}

// Métodos HTTP

export const api = {
    get:    (endpoint)              => request(endpoint, { method: 'GET' }),
    post:   (endpoint, body)        => request(endpoint, { method: 'POST',   body: JSON.stringify(body) }),
    put:    (endpoint, body)        => request(endpoint, { method: 'PUT',    body: JSON.stringify(body) }),
    patch:  (endpoint, body)        => request(endpoint, { method: 'PATCH',  body: JSON.stringify(body) }),
    delete: (endpoint)              => request(endpoint, { method: 'DELETE' }),
};
