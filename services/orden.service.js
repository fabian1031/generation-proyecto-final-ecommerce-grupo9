import { api } from "./api.js";

export const ordenService = {
    // Órdenes
    getAll: () => api.get('/pedidos'),
    getById: (id) => api.get(`/pedidos/${id}`),
    
    create: (orden) => api.post('/pedidos', orden),
    update: (id, orden) => api.put(`/pedidos/${id}`, orden),
    delete: (id) => api.delete(`/pedidos/${id}`),

    // Detalles de órdenes
    getAllItems: () => api.get('/detalle_pedido'),
    getItemById: (id) => api.get(`/detalle_pedido/${id}`),
    
    createItem: (item) => api.post('/detalle_pedido', item),
    updateItem: (id, item) => api.put(`/detalle_pedido/${id}`, item),
    deleteItem: (id) => api.delete(`/detalle_pedido/${id}`)
};
