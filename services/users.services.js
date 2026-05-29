import { api } from "./api.js";

export const userService = {
    getAll: () => api.get('/usuarios'),
    getById: (id) => api.get(`/usuarios/${id}`),
    
    create: (userData) => api.post('/usuarios', userData),
    update: (id, userData) => api.put(`/usuarios/${id}`, userData),
    delete: (id) => api.delete(`/usuarios/${id}`)
};
