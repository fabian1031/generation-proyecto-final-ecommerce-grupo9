/**
 * Formulario offcanvas: crear, editar y persistir usuarios.
 */

import { userService } from "../../services/users.services.js";
import {
    confirmAction,
    showToast,
    withAsyncFeedback,
    SLOW_API_HINT,
} from "./products-feedback.js";

let selectedUser = null;
let offcanvasInstance = null;
let onSaved = () => {};

export function setOnUsersChanged(callback) {
    onSaved = callback;
}

export function initUserForm() {
    const el = document.getElementById("offcanvasUser");
    if (el) offcanvasInstance = bootstrap.Offcanvas.getOrCreateInstance(el);
    document.getElementById("btnSaveUser")?.addEventListener("click", () => saveUser());
}

export function openCreateUser() {
    selectedUser = null;
    clearForm();
    document.getElementById("offcanvasUserTitle").textContent = "Crear usuario";
    document.getElementById("u_active").value = "Activo";
    document.getElementById("u_password_wrap")?.classList.remove("d-none");
    offcanvasInstance?.show();
}

export function openEditUser(user) {
    selectedUser = user;
    fillForm(user);
    document.getElementById("offcanvasUserTitle").textContent = "Editar usuario";
    document.getElementById("u_password_wrap")?.classList.add("d-none");
    offcanvasInstance?.show();
}

function fillForm(u) {
    const isActive = u.activo !== false;
    document.getElementById("u_id").value = u.id ?? "";
    document.getElementById("u_nombre").value = u.nombre ?? "";
    document.getElementById("u_apellido").value = u.apellido ?? "";
    document.getElementById("u_email").value = u.email ?? "";
    document.getElementById("u_rol").value = u.rol ?? "USER";
    document.getElementById("u_active").value = isActive ? "Activo" : "Inactivo";
    document.getElementById("u_password").value = "";
}

function clearForm() {
    fillForm({
        id: "",
        nombre: "",
        apellido: "",
        email: "",
        rol: "USER",
        activo: true,
    });
}

function getFormData() {
    return {
        nombre: document.getElementById("u_nombre").value.trim(),
        apellido: document.getElementById("u_apellido").value.trim(),
        email: document.getElementById("u_email").value.trim(),
        rol: document.getElementById("u_rol").value,
        password: document.getElementById("u_password")?.value || "",
    };
}

function validateForm(data, isCreate) {
    if (!data.nombre) return "El nombre es obligatorio.";
    if (!data.apellido) return "El apellido es obligatorio.";
    if (!data.email) return "El email es obligatorio.";
    if (!data.rol) return "Selecciona un rol.";
    if (isCreate && !data.password) return "La contraseña es obligatoria al crear un usuario.";
    return null;
}

function buildUserPayload(data, isCreate) {
    const payload = {
        nombre: data.nombre,
        apellido: data.apellido,
        email: data.email,
        rol: data.rol,
        activo: true,
    };
    if (isCreate && data.password) payload.password = data.password;
    return payload;
}

async function saveUser() {
    const data = getFormData();
    const isCreate = !selectedUser;
    const validationError = validateForm(data, isCreate);
    if (validationError) {
        showToast("warning", "Revisa el formulario", validationError);
        return;
    }

    const saveBtn = document.getElementById("btnSaveUser");
    saveBtn?.setAttribute("disabled", "true");

    try {
        await withAsyncFeedback(
            async () => {
                if (selectedUser) {
                    await userService.update(selectedUser.id, {
                        ...selectedUser,
                        nombre: data.nombre,
                        apellido: data.apellido,
                        email: data.email,
                        rol: data.rol,
                    });
                } else {
                    await userService.create(buildUserPayload(data, true));
                }
                offcanvasInstance?.hide();
                await onSaved();
            },
            {
                loadingMessage: isCreate ? "Creando usuario…" : "Guardando cambios…",
                slowMessage: SLOW_API_HINT,
                successTitle: isCreate ? "Usuario creado" : "Usuario actualizado",
                successDetail: "Los cambios ya están registrados.",
                errorTitle: "No se pudo guardar",
                errorFallback: "Verifica los datos e intenta de nuevo.",
            }
        );
    } catch {
        /* toast mostrado */
    } finally {
        saveBtn?.removeAttribute("disabled");
    }
}

export async function toggleUserActive(user) {
    const isActive = user.activo !== false;
    const action = isActive ? "desactivar" : "reactivar";

    const confirmed = await confirmAction({
        title: `¿${action.charAt(0).toUpperCase() + action.slice(1)} este usuario?`,
        text: isActive
            ? "No podrá iniciar sesión hasta que lo reactives."
            : "Volverá a poder acceder al sistema.",
        confirmText: isActive ? "Sí, desactivar" : "Sí, reactivar",
    });

    if (!confirmed) return;

    try {
        await withAsyncFeedback(
            async () => {
                await userService.update(user.id, { ...user, activo: !isActive });
                await onSaved();
            },
            {
                loadingMessage: isActive ? "Desactivando…" : "Reactivando…",
                slowMessage: SLOW_API_HINT,
                successTitle: isActive ? "Usuario desactivado" : "Usuario reactivado",
                errorTitle: `No se pudo ${action}`,
            }
        );
    } catch {
        /* toast mostrado */
    }
}

export async function fetchAllUsers() {
    const data = await userService.getAll();
    return Array.isArray(data) ? data : [];
}

export async function loadAllUsers() {
    return fetchAllUsers();
}
