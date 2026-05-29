import { api } from './api.js';

export const productService = {
    getAll: () => api.get('/productos'),
    getById: (id) => api.get(`/productos/${id}`),
    getByCategory: (cat) => api.get(`/productos?categoria=${cat}`),

    create: (product) => api.post('/productos', product),
    update: (id, product) => api.put(`/productos/${id}`, product),
    delete: (id) => api.delete(`/productos/${id}`)
};