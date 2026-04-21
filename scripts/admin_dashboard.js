import { productService } from "../services/api.js";
import { api } from "../services/api.js";
let allProducts = [];
let selectedProduct = null;


loadProducts();

async function loadProducts() {
    allProducts = (await productService.getAll()).filter(p => p.isActive)
    renderProductsList();
}

function renderProductsList() {
    const container = document.getElementById("productsList");
    container.innerHTML = "";

    allProducts.forEach(p => {
        const item = document.createElement("button");
        const isActive = p.isActive !== false;

        item.className =
            "list-group-item list-group-item-action d-flex justify-content-between align-items-start gap-2";

        item.innerHTML = `
            <div class="text-start">
                <small class="text-muted">ID: ${p.id}</small><br>
                <div class="fw-semibold">${p.name}</div>
                <small class="text-muted">${p.category}</small><br>
                <small class="text-muted">${p.description || ""}</small>
            </div>

            <div class="text-end flex-shrink-0">
                <div class="fw-semibold">$${p.price}</div>
                <small class="text-muted">Stock: ${p.stock}</small>
            </div>

            <span class="badge ${isActive ? 'bg-success' : 'bg-danger'}">
                    ${isActive ? 'Activo' : 'Inactivo'}
                </span>
            </div>

            <div class="text-end">
                ${
                    isActive
                        ? `<button class="btn btn-sm btn-danger">🗑</button>`
                        : `<button class="btn btn-sm btn-success">♻️</button>`
                }
            </div>
        `;

        // abrir editor
        item.addEventListener("click", () => openEditProduct(p));

        // DELETE separado
        item.querySelector(".btn-danger").addEventListener("click", (e) => {
            e.stopPropagation();
            deleteProduct(p.id);
        });

        container.appendChild(item);
    });
}
function openCreateProduct() {
    selectedProduct = null;
    clearForm();

    document.getElementById("offcanvasTitle").textContent = "Crear producto";

    const offcanvas = new bootstrap.Offcanvas(
        document.getElementById("offcanvasProducto")
    );

    offcanvas.show();
}

function openEditProduct(product) {
    selectedProduct = product;

    fillForm(product);

    document.getElementById("offcanvasTitle").textContent = "Editar producto";

    const offcanvas = new bootstrap.Offcanvas(
        document.getElementById("offcanvasProducto")
    );

    offcanvas.show();
}

function fillForm(p) {
    document.getElementById("p_id").value = p.id || "";
    document.getElementById("p_name").value = p.name || "";
    document.getElementById("p_brand").value = p.brand || "";
    document.getElementById("p_description").value = p.description || "";
    document.getElementById("p_price").value = p.price || 0;
    document.getElementById("p_stock").value = p.stock || 0;
    document.getElementById("p_category").value = p.category || "";
    document.getElementById("p_image").value = p.image || "";
}


function clearForm() {
    fillForm({
        id: "",
        name: "",
        brand: "",
        description: "",
        price: "",
        stock: "",
        category: "",
        image: ""
    });
}

function getFormData() {
    return {
        name: document.getElementById("p_name").value,
        brand: document.getElementById("p_brand").value,
        description: document.getElementById("p_description").value,
        price: Number(document.getElementById("p_price").value),
        stock: Number(document.getElementById("p_stock").value),
        category: document.getElementById("p_category").value,
        image: document.getElementById("p_image").value
    };
}

async function saveProduct() {
    const data = getFormData();

    if (selectedProduct) {
        const updated = await productService.patch(selectedProduct.id, data);
        Object.assign(selectedProduct, updated);
    } else {
        const created = await productService.create(data);
        allProducts.push(created);
    }

    renderProductsList();

    bootstrap.Offcanvas.getInstance(
        document.getElementById("offcanvasProducto")
    ).hide();
}

async function deleteProduct(id) {
    await productService.patch(id, {
        isActive: false
    })

    const product = allProducts.find(p => p.id === id);
    product.isActive = false;

    renderProductsList();
}

window.saveProduct = saveProduct;
window.openCreateProduct = openCreateProduct;
window.deleteProduct = deleteProduct;