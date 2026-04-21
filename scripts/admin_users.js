import { userService } from "../services/users.services.js";
let allUsers = [];
let selectedUser = null;

loadUsers();

async function loadUsers() {
    allUsers = await userService.getAll();
    renderUsersList();
}

function renderUsersList() {
    const container = document.getElementById("usersList");
    container.innerHTML = "";

    allUsers.forEach(u => {
        const item = document.createElement("button");
        const isActive = u.isActive !== false;

        item.className =
            "list-group-item list-group-item-action d-flex justify-content-between align-items-start gap-2";

        item.innerHTML = `
        <div class="text-start">
                <div class="text-muted">
                    ID:  ${u.id}
                </div>
                <div class="fw-semibold">
                    ${u.username} ${u.lastname}
                </div>

                <small class="text-muted">
                    Rol: ${u.role}
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

        item.addEventListener("click", () => openEditUser(u));

        const actionBTN = item.querySelector("button");

        actionBTN.addEventListener("click", (e) => {
            e.stopPropagation();
            deleteUser(u.id)

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
    document.getElementById("u_username").value = u.username || "";
    document.getElementById("u_lastname").value = u.lastname || "";
    document.getElementById("u_role").value = u.role || "";
    document.getElementById("u_id").value = u.id || "";
    document.getElementById("u_active").value = u.isActive ? "Activo" : "Inactivo";
}


function clearForm() {
    fillForm({
        username: "",
        lastname: "",
        role: "",
        id: ""
    });
}

function getFormData() {
    return {
        username: document.getElementById("u_username").value,
        lastname: document.getElementById("u_lastname").value,
        role: document.getElementById("u_role").value
    };
}

async function saveUser() {
    const data = getFormData();

    if (selectedUser) {
        const updated = await userService.patch(selectedUser.id, data);
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
    await userService.patch(id, {
        isActive: false
    });

    const user = allUsers.find(u => u.id === id);
    user.isActive = false;

    renderUsersList();
}

async function restoreUser(id) {
    await userService.patch(id, {
        isActive: true
    });

    const user = allUsers.find(u => u.id === id);
    user.isActive = true;

    renderUsersList();
}

window.saveUser = saveUser;
window.openCreateUser = openCreateUser;
window.deleteUser = deleteUser;