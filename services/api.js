const BASE_URL = 'https://coroto-backend.onrender.com'; 

async function request(endpoint, options = {}) {
    const config = {
        headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
            ...options.headers,
        },
        ...options,
    };

    // Agregar JWT token si existe
    const token = localStorage.getItem('authToken');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(`${BASE_URL}${endpoint}`, config);

    if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        throw new Error(error?.message || `Error ${response.status}: ${response.statusText}`);
    }


    if (response.status === 204) return null;

    return response.json();
}



export const api = {
    get:    (endpoint)              => request(endpoint, { method: 'GET' }),
    post:   (endpoint, body)        => request(endpoint, { method: 'POST',   body: JSON.stringify(body) }),
    put:    (endpoint, body)        => request(endpoint, { method: 'PUT',    body: JSON.stringify(body) }),
    patch:  (endpoint, body)        => request(endpoint, { method: 'PATCH',  body: JSON.stringify(body) }),
    delete: (endpoint)              => request(endpoint, { method: 'DELETE' }),
};
