export class Product {
    constructor({ id, name, brand ,price, stock, category, description, image }) {
        this.id = id;
        this.name = name;
        this.brand = brand;
        this.price = price;
        this.stock = stock;
        this.category = category;
        this.description = description;
        this.image = image;
    }
}