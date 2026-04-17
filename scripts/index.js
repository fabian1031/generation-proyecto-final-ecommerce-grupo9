import { api } from '../api.js';

export const productService = {
    getAll: () => api.get('/products'),
    getById: (id) => api.get(`/products/${id}`),
    getByCategory: (cat) => api.get(`/products?category=${cat}`),
};

