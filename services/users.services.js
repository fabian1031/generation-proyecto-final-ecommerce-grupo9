import { api } from "./api.js";

export const userService = {
    getAll: () => api.get('/users'),
    getById: (id) => api.get(`/users/${id}`),
    getByRole: (role) => api.get(`/users?category=${role}`),

    create: (users) => api.post('/users', users),
    update: (id, users) => api.put(`/users/${id}`, users),
    patch: (id, data) => api.patch(`/users/${id}`, data),
    delete: (id) => api.delete(`/users/${id}`)
};
