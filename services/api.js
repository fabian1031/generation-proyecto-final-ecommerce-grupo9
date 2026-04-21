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

export const productService = {
    getAll: () => api.get('/products'),
    getById: (id) => api.get(`/products/${id}`),
    getByCategory: (cat) => api.get(`/products?category=${cat}`),

    create: (product) => api.post('/products', product),
    update: (id, product) => api.put(`/products/${id}`, product),
    patch: (id, data) => api.patch(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`)
};

export const userService = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    getByCategory: (Rol) => api.get(`/users?category=${Rol}`),

    create: (users) => api.post('/users', users),
    update: (id, users) => api.put(`/users/${id}`, users),
    patch: (id, data) => api.patch(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`)
};