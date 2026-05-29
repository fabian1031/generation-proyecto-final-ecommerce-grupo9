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
        filteredProducts = allProducts.filter(p => p.activo !== false)
    }
    if (filterStatus === "inactive") {
        filteredProducts = allProducts.filter(p => p.activo === false);
    }

    filteredProducts.forEach(p => {
        const isActive = p.activo !== false;

        const item = document.createElement("div");

        item.className =
            "list-group-item list-group-item-action d-flex justify-content-between align-items-start gap-2";

        item.innerHTML = `
            <div class="text-start">
                <small class="text-muted">ID: ${p.id}</small><br>
                <div class="fw-semibold">${p.nombre}</div>
                <small class="text-muted">${p.categoria}</small><br>
                <small class="text-muted">${p.descripcion || ""}</small>
                
                <span class="badge ${isActive ? 'bg-success' : 'bg-danger'}">
                    ${isActive ? 'Activo' : 'Inactivo'}
                </span>
            </div>

            <div class="text-end flex-shrink-0">
                <div class="fw-semibold">$${p.precio}</div>
                <small class="text-muted">Stock: ${p.cantidad}</small>

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
    document.getElementById("p_name").value = p.nombre || "";
    document.getElementById("p_brand").value = p.brand || "";
    document.getElementById("p_description").value = p.descripcion || "";
    document.getElementById("p_price").value = p.precio || 0;
    document.getElementById("p_stock").value = p.cantidad || 0;
    document.getElementById("p_category").value = p.categoria || "";
    document.getElementById("p_image").value = p.imageUrl || "";
}

function clearForm() {
    fillForm({
        id: "",
        nombre: "",
        brand: "",
        descripcion: "",
        precio: 0,
        cantidad: 0,
        categoria: "",
        imageUrl: ""
    });
}

function getFormData() {
    return {
        nombre: document.getElementById("p_name").value,
        descripcion: document.getElementById("p_description").value,
        precio: Number(document.getElementById("p_price").value) || 0,
        cantidad: Number(document.getElementById("p_stock").value) || 0,
        categoria: document.getElementById("p_category").value,
        imageUrl: document.getElementById("p_image").value
    };
}

function buildProduct(data) {
    return {
        nombre: data.nombre || "",
        precio: data.precio || 0,
        cantidad: data.cantidad || 0,
        categoria: data.categoria || "",
        descripcion: data.descripcion || "",
        imageUrl: data.imageUrl || "",
        activo: true
    };
}

async function saveProduct() {
    const data = getFormData();

    if (selectedProduct) {
        const updated = await productService.update(selectedProduct.id, {
            ...selectedProduct,
            ...data
        });
        Object.assign(selectedProduct, updated);
    } else {
        const newProduct = buildProduct(data);

        console.log("CREANDO:", newProduct); // 👈 DEBUG

        const created = await productService.create(newProduct);
        allProducts.push(created);
    }

    renderProductsList();
}

async function deleteProduct(id) {
    const product = allProducts.find(p => p.id === id);
    if (product) {
        const updated = await productService.update(id, {
            ...product,
            activo: false
        });
        Object.assign(product, updated);
    }

    renderProductsList();
}

async function restoreProduct(id) {
    const product = allProducts.find(p => p.id === id);
    if (product) {
        const updated = await productService.update(id, {
            ...product,
            activo: true
        });
        Object.assign(product, updated);
    }

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