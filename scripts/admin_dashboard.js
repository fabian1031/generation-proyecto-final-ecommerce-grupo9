import { productService } from "../services/api.js";
import { Product } from "../models/Product.js";

let allProducts = [];

const nameInput = document.getElementById("name");
const priceInput = document.getElementById("price");
const stockInput = document.getElementById("stock");
const categoryInput = document.getElementById("category");

loadProducts();

async function loadProducts() {
    try {
        const data = await productService.getAll();

        allProducts = data;

        renderAdminTable();

    } catch (error) {
        console.error("Error loading products:", error);
    }
}

async function addProduct() {
    const newProduct = {
        name: nameInput.value,
        price: Number(priceInput.value),
        stock: Number(stockInput.value),
        category: categoryInput.value,
        description: "",
        image: ""
    };

    try {
        const created = await productService.create(newProduct);

        allProducts.push(created);

        renderAdminTable();

        clearForm();

    } catch (error) {
        console.error("Error creating product:", error);
    }
}

async function updateProduct(product) {
    nameInput.value = product.name;
    priceInput.value = product.price;
    stockInput.value = product.value;
    categoryInput.value = product.category;
}

async function deleteProduct(id) {
    try {
        await productService.delete(id);

        allProducts = allProducts.filter(p => p.id !== id);

        renderAdminTable();

    } catch (error) {
        console.error("Error deleting product:", error);
    }
}

function renderAdminTable() {
    const container = document.getElementById("adminTable");

    container.innerHTML = "";

    allProducts.forEach(p => {
        const row = document.createElement("div");
        row.className = "admin-row border p-2 mb-2";

        row.innerHTML = `
            <div class="d-flex gap-3 align-items-center">

                <strong ondblclick="editField(${p.id}, 'name', this)">
                    ${p.name}
                </strong>

                <span ondblclick="editField(${p.id}, 'price', this)">
                    $${p.price}
                </span>

                <span ondblclick="editField(${p.id}, 'stock', this)">
                    Stock: ${p.stock}
                </span>

                <small ondblclick="editField(${p.id}, 'category', this)">
                    ${p.category}
                </small>

                <button class="btn btn-danger btn-sm" onclick="deleteProduct(${p.id})">
                    🗑
                </button>

            </div>
        `;

        container.appendChild(row);
    });
}


function clearForm() {
    nameInput.value = "";
    priceInput.value = "";
    stockInput.value = "";
    categoryInput.value = "";
}

window.addProduct = addProduct;
window.editField = editField;
window.deleteProduct = deleteProduct;