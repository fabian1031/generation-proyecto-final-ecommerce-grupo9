import { productService } from "../services/product.service.js";

let allProducts = [];
let selectedProduct = null;
let filterStatus = "all";
loadProducts();

async function loadProducts() {
    allProducts = await productService.getAll();
    renderProductsList();
}

function renderProductsList() {
    const container = document.getElementById("productsList");
    container.innerHTML = "";

    let filteredProducts = allProducts;

    if (filterStatus === "active") {
        filteredProducts = allProducts.filter(p => p.isActive !== false)
    }
    if (filterStatus === "inactive") {
        filteredProducts = allProducts.filter(p => p.isActive === false);
    }

    filteredProducts.forEach(p => {
        const isActive = p.isActive !== false;

        const item = document.createElement("div");

        item.className =
            "list-group-item list-group-item-action d-flex justify-content-between align-items-start gap-2";

        item.innerHTML = `
            <div class="text-start">
                <small class="text-muted">ID: ${p.id}</small><br>
                <div class="fw-semibold">${p.name}</div>
                <small class="text-muted">${p.category}</small><br>
                <small class="text-muted">${p.description || ""}</small>
                
                <span class="badge ${isActive ? 'bg-success' : 'bg-danger'}">
                    ${isActive ? 'Activo' : 'Inactivo'}
                </span>
            </div>

            <div class="text-end flex-shrink-0">
                <div class="fw-semibold">$${p.price}</div>
                <small class="text-muted">Stock: ${p.stock}</small>

                <div class="mt-2">
                    ${
                        isActive
                            ? `<button class="btn btn-sm btn-danger action-btn">🗑</button>`
                            : `<button class="btn btn-sm btn-success action-btn">♻️</button>`
                    }
                </div>
            </div>
        `;

        item.addEventListener("click", () => {
            if (!isActive) return;
            openEditProduct(p);
        });

        const actionBtn = item.querySelector(".action-btn");

        actionBtn.addEventListener("click", (e) => {
            e.stopPropagation();

            if (isActive) {
                deleteProduct(p.id);
            } else {
                restoreProduct(p.id);
            }
        });

        container.appendChild(item);
    });
}

function openCreateProduct() {
    selectedProduct = null;
    clearForm();

    document.getElementById("offcanvasTitle").textContent = "Crear producto";

    new bootstrap.Offcanvas(
        document.getElementById("offcanvasProducto")
    ).show();
}

function openEditProduct(product) {
    selectedProduct = product;

    fillForm(product);

    document.getElementById("offcanvasTitle").textContent = "Editar producto";

    new bootstrap.Offcanvas(
        document.getElementById("offcanvasProducto")
    ).show();
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
        price: 0,
        stock: 0,
        category: "",
        image: ""
    });
}

function getFormData() {
    return {
        name: document.getElementById("p_name").value,
        brand: document.getElementById("p_brand").value,
        description: document.getElementById("p_description").value,
        price: Number(document.getElementById("p_price").value) || 0,
        stock: Number(document.getElementById("p_stock").value) || 0,
        category: document.getElementById("p_category").value,
        image: document.getElementById("p_image").value
    };
}

function buildProduct(data) {
    return {
        id: generateId(),
        name: data.name || "",
        brand: data.brand || "",
        price: data.price || 0,
        stock: data.stock || 0,
        category: data.category || "",
        description: data.description || "",
        image: data.image || "",
        isActive: true
    };
}

async function saveProduct() {
    const data = getFormData();

    if (selectedProduct) {
        const updated = await productService.patch(selectedProduct.id, data);
        Object.assign(selectedProduct, updated);
    } else {
        const newProduct = {
            id: generateId(),
            name: data.name || "",
            brand: data.brand || "",
            price: Number(data.price) || 0,
            stock: Number(data.stock) || 0,
            category: data.category || "",
            description: data.description || "",
            image: data.image || "",
            isActive: true
        };

        console.log("CREANDO:", newProduct); // 👈 DEBUG

        const created = await productService.create(newProduct);
        allProducts.push(created);
    }

    renderProductsList();
}

async function deleteProduct(id) {
    await productService.patch(id, { isActive: false });

    const product = allProducts.find(p => p.id === id);
    if (product) product.isActive = false;

    renderProductsList();
}

async function restoreProduct(id) {
    await productService.patch(id, { isActive: true });

    const product = allProducts.find(p => p.id === id);
    if (product) product.isActive = true;

    renderProductsList();
}

function setFilter(type) {
    filterStatus = type;

    document.querySelectorAll("[data-filter]").forEach(btn => btn.classList.remove("active"));

    document.querySelector(`[data-filter="${type}"]`)?.classList.add("active");

    renderProductsList();
}

function generateId() {
    const numericIds = allProducts
        .map(p => Number(p.id))
        .filter(id => !isNaN(id));

    const next = numericIds.length
        ? Math.max(...numericIds) + 1
        : 1;

    return String(next);
}

window.saveProduct = saveProduct;
window.openCreateProduct = openCreateProduct;
window.setFilter = setFilter;