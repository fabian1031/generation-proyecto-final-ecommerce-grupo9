export class Product {
    constructor({ id, name, brand ,price, status, stock, category, description, image, isActive }) {
        this.id = id;
        this.name = name;
        this.brand = brand;
        this.price = price;
        this.status = status;
        this.stock = stock;
        this.category = category;
        this.description = description;
        this.image = image;
        this.isActive = isActive;
    }
}