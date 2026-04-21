import { api } from './api.js';

export const productService = {
    getAll: () => api.get('/products'),
    getById: (id) => api.get(`/products/${id}`),
    getByCategory: (cat) => api.get(`/products?category=${cat}`),

    create: (product) => api.post('/products', product),
    update: (id, product) => api.put(`/products/${id}`, product),
    patch: (id, data) => api.patch(`/products/${id}`, data),
    delete: (id) => api.delete(`/products/${id}`)
};