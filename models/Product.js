export class Product {
    constructor(data) {
        // Mapear desde el backend (campos nuevos) a propiedades locales
        this.id = data.id;
        this.name = data.nombre || data.name; // Compatibilidad
        this.price = data.precio || data.price;
        this.stock = data.cantidad || data.stock;
        this.category = data.categoria || data.category;
        this.description = data.descripcion || data.description;
        this.image = data.imageUrl || data.image;
        this.isActive = data.activo !== undefined ? data.activo : data.isActive;
        
        // Campos adicionales
        this.brand = data.brand;
        this.status = data.status;
    }
}