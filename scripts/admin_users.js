import { userService } from "../services/users.services.js";
let allUsers = [];
let selectedUser = null;
let filterStatus = "all";

loadUsers();

async function loadUsers() {
    allUsers = await userService.getAll();
    renderUsersList();
}

function renderUsersList() {
    const container = document.getElementById("usersList");
    container.innerHTML = "";

    let filteredUsers = allUsers;

    if(filterStatus === "inactive") {
        filteredUsers = allUsers.filter(u => !u.activo);
    }

    if(filterStatus === "active") {
        filteredUsers = allUsers.filter(u => u.activo)
    }

    filteredUsers.forEach(u => {
        const item = document.createElement("button");
        const isActive = u.activo !== false;

        item.className =
            "list-group-item list-group-item-action d-flex justify-content-between align-items-start gap-2";

        item.innerHTML = `
        <div class="text-start">
                <div class="text-muted">
                    ID:  ${u.id}
                </div>
                <div class="fw-semibold">
                    ${u.nombre} ${u.apellido}
                </div>

                <small class="text-muted">
                    Rol: ${u.rol}
                </small><br>
                
                <span class="badge ${isActive ? 'bg-success' : 'bg-danger'}">
                    ${isActive ? 'Activo' : 'Inactivo'}
                </span>
            </div>

            <div class="text-end">
                ${isActive
                ? `<button class="btn btn-sm btn-danger">🗑</button>`
                : `<button class="btn btn-sm btn-success">♻️</button>`
            }
            </div>
        `;

        item.addEventListener("click", () => {
           if(!isActive) return;
           openEditUser(u);
        });

        const actionBTN = item.querySelector("button");

        actionBTN.addEventListener("click", (e) => {
            e.stopPropagation();
            
            if(isActive) {
                deleteUser(u.id);
            } else {
                restoreUser(u.id);
            }
        });

        container.appendChild(item);
    });
}

function openCreateUser() {
    selectedUser = null;
    clearForm();

    document.getElementById("offcanvasTitle").textContent = "Crear usuario";

    new bootstrap.Offcanvas(
        document.getElementById("offcanvasUser")
    ).show();
}


function openEditUser(user) {
    selectedUser = user;

    fillForm(user);

    document.getElementById("offcanvasTitle").textContent = "Editar usuario";

    new bootstrap.Offcanvas(
        document.getElementById("offcanvasUser")
    ).show();
}


function fillForm(u) {
    document.getElementById("u_username").value = u.nombre || "";
    document.getElementById("u_lastname").value = u.apellido || "";
    document.getElementById("u_role").value = u.rol || "";
    document.getElementById("u_id").value = u.id || "";
    document.getElementById("u_active").value = u.activo ? "Activo" : "Inactivo";
}


function clearForm() {
    fillForm({
        nombre: "",
        apellido: "",
        rol: "",
        id: ""
    });
}

function getFormData() {
    return {
        nombre: document.getElementById("u_username").value,
        apellido: document.getElementById("u_lastname").value,
        rol: document.getElementById("u_role").value
    };
}

async function saveUser() {
    const data = getFormData();

    if (selectedUser) {
        const updated = await userService.update(selectedUser.id, data);
        Object.assign(selectedUser, updated);
    } else {
        const created = await userService.create(data);
        allUsers.push(created);
    }

    renderUsersList();

    bootstrap.Offcanvas.getInstance(
        document.getElementById("offcanvasUser")
    ).hide();
}

async function deleteUser(id) {
    const user = allUsers.find(u => u.id === id);
    const updated = await userService.update(id, {
        ...user,
        activo: false
    });
    Object.assign(user, updated);

    renderUsersList();
}

async function restoreUser(id) {
    const user = allUsers.find(u => u.id === id);
    const updated = await userService.update(id, {
        ...user,
        activo: true
    });
    Object.assign(user, updated);

    renderUsersList();
}

function setFilter(type) {
    filterStatus = type;

    document.querySelectorAll("[data-filter]")
        .forEach(btn => btn.classList.remove("active"));

    document.querySelector(`[data-filter="${type}"]`)
        ?.classList.add("active");

    renderUsersList();
}

window.saveUser = saveUser;
window.openCreateUser = openCreateUser;
window.deleteUser = deleteUser;
window.setFilter = setFilter;