import { cartService } from "../services/cartSevices.js";
import { authService } from "../services/auth.service.js";
import { initCorotoChat } from "./chat/index.js";

const inPages = window.location.pathname.includes("/pages/");
const root = inPages ? "../" : "./";
const pages = inPages ? "./" : "./pages/";

const navbar = `
<nav class="navbar navbar-expand-lg sticky-top bg-white offcanvas-border">
  <div class="container mt-3">

    <a class="navbar-brand d-flex align-items-center gap-2" href="${root}index.html">
      <img src="${root}assets/pages/login.png" class="img-fluid" alt="logo-nav" width="100">
      <span class="fw-bold d-none d-md-inline nav-brand-text">Coroto</span>
    </a>

    <div class="d-flex d-lg-none align-items-center gap-2 ms-auto">
      <div class="position-relative" style="width:46px;height:46px;">
        <a href="${pages}cart.html" class="nav-icon-btn">
          <i class="bi bi-bag fs-5"></i>
        </a>
        <span id="cart-count-mobile" class="position-absolute badge rounded-pill nav-badge">0</span>
      </div>

      <button class="navbar-toggler border-0 shadow-none ps-1" type="button"
        data-bs-toggle="offcanvas" data-bs-target="#offcanvasNav">
        <span class="navbar-toggler-icon"></span>
      </button>
    </div>

    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav mx-auto gap-1">
        <li class="nav-item">
          <a class="nav-link px-3 fw-semibold text-uppercase d-flex align-items-center gap-2 rounded-3"
            href="${root}index.html">
            <i class="bi bi-house-door fs-5"></i>Inicio
          </a>
        </li>

        <li class="nav-item">
          <a class="nav-link px-3 fw-semibold text-uppercase d-flex align-items-center gap-2 rounded-3"
            href="${pages}about.html">
            <i class="bi bi-people fs-5"></i>Nosotros
          </a>
        </li>

        <li class="nav-item">
          <a class="nav-link px-3 fw-semibold text-uppercase d-flex align-items-center gap-2 rounded-3"
            href="${pages}contact.html">
            <i class="bi bi-chat-dots fs-5"></i>Contacto
          </a>
        </li>
      </ul>

      <div class="d-none d-lg-flex align-items-center gap-3">

        <div class="position-relative" style="width:46px;height:46px;">
          <a href="${pages}cart.html" class="nav-icon-btn">
            <i class="bi bi-bag fs-5"></i>
          </a>
          <span id="cart-count" class="position-absolute badge rounded-pill nav-badge">0</span>
        </div>

        <div class="dropdown">
          <button class="nav-icon-btn-primary" data-bs-toggle="dropdown">
            <i class="bi bi-person-circle fs-4"></i>
          </button>

          <ul class="dropdown-menu dropdown-menu-end shadow-lg mt-2 rounded-4 py-3">

            <li class="px-3 pb-2">
              <p class="mb-0 fw-bold offcanvas-username">Usuario</p>
              <p class="mb-0 text-muted small" id="welcome-msg"></p>
            </li>

            <li><hr class="dropdown-divider"></li>

            <li class="admin-section">
              <a class="dropdown-item nav-dropdown-item" href="${pages}admin_dashboard.html">
                <i class="bi bi-kanban"></i> Gestión Productos
              </a>
            </li>

            <li class="admin-section">
              <a class="dropdown-item nav-dropdown-item" href="${pages}admin_users.html">
                <i class="bi bi-people-fill"></i> Gestión Usuarios
              </a>
            </li>

            <li class="admin-section">
              <a class="dropdown-item nav-dropdown-item" href="${pages}admin_ventas.html">
                <i class="bi bi-clipboard-check"></i> Gestión Pedidos
              </a>
            </li>

            <li class="user-section"><hr class="dropdown-divider"></li>

            <li class="user-section">
              <a class="dropdown-item nav-dropdown-item" href="${pages}user_dashboard.html">
                <i class="bi bi-bag-check"></i> Mis Pedidos
              </a>
            </li>

            <li class="role-divider"><hr class="dropdown-divider"></li>

            <li>
              <a class="dropdown-item nav-dropdown-item" href="${pages}login.html" id="navAuthAction">
                <i class="bi bi-box-arrow-in-right"></i> Iniciar sesión
              </a>
            </li>

          </ul>
        </div>
      </div>
    </div>

  </div>
</nav>

<div class="offcanvas offcanvas-end" tabindex="-1" id="offcanvasNav" style="max-width:300px;">
  <div class="offcanvas-header px-4 py-3">
    <div class="d-flex align-items-center gap-2">
      <img src="${root}assets/pages/login.png" width="80" alt="logo">
      <span class="fw-bold">Coroto</span>
    </div>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
  </div>

  <div class="offcanvas-body px-4 d-flex flex-column">

    <div class="offcanvas-profile mb-4">
      <p class="mb-0 fw-semibold offcanvas-username">Usuario</p>
      <p class="mb-0 text-muted small" id="welcome-msg-mobile"></p>
    </div>

    <p class="offcanvas-section-label mb-2">Menú</p>
    <ul class="nav flex-column gap-1 mb-4">
      <li>
        <a class="offcanvas-nav-link d-flex align-items-center gap-2" href="${root}index.html">
          <i class="bi bi-house-door"></i> Inicio
        </a>
      </li>
      <li>
        <a class="offcanvas-nav-link d-flex align-items-center gap-2" href="${pages}about.html">
          <i class="bi bi-people"></i> Nosotros
        </a>
      </li>
      <li>
        <a class="offcanvas-nav-link d-flex align-items-center gap-2" href="${pages}contact.html">
          <i class="bi bi-chat-dots"></i> Contacto
        </a>
      </li>
    </ul>

    <div class="admin-section mb-4">
      <p class="offcanvas-section-label mb-2">Administración</p>
      <ul class="nav flex-column gap-1">
        <li>
          <a class="offcanvas-nav-link d-flex align-items-center gap-2" href="${pages}admin_dashboard.html">
            <i class="bi bi-kanban"></i> Gestión Productos
          </a>
        </li>
        <li>
          <a class="offcanvas-nav-link d-flex align-items-center gap-2" href="${pages}admin_users.html">
            <i class="bi bi-people-fill"></i> Gestión Usuarios
          </a>
        </li>
        <li>
          <a class="offcanvas-nav-link d-flex align-items-center gap-2" href="${pages}gestion_pedidos.html">
            <i class="bi bi-clipboard-check"></i> Gestión Pedidos
          </a>
        </li>
      </ul>
    </div>

    <div class="user-section mb-4">
      <p class="offcanvas-section-label mb-2">Mi cuenta</p>
      <ul class="nav flex-column gap-1">
        <li>
          <a class="offcanvas-nav-link d-flex align-items-center gap-2" href="${pages}user_dashboard.html">
            <i class="bi bi-bag-check"></i> Mis Pedidos
          </a>
        </li>
      </ul>
    </div>

    <div class="mt-auto">
      <a href="${pages}login.html" class="offcanvas-login" id="offcanvasAuthAction">
        <i class="bi bi-box-arrow-in-right"></i> Iniciar sesión
      </a>
    </div>

  </div>
</div>
`;

function setAuthAction(isLoggedIn) {
  const desktop = document.getElementById("navAuthAction");
  const mobile = document.getElementById("offcanvasAuthAction");

  if (isLoggedIn) {
    if (desktop) {
      desktop.href = "#";
      desktop.className = "dropdown-item nav-danger-item";
      desktop.innerHTML = '<i class="bi bi-box-arrow-right"></i> Cerrar sesión';
    }

    if (mobile) {
      mobile.href = "#";
      mobile.className = "offcanvas-logout";
      mobile.innerHTML = '<i class="bi bi-box-arrow-right"></i> Cerrar sesión';
    }

    return;
  }

  if (desktop) {
    desktop.href = `${pages}login.html`;
    desktop.className = "dropdown-item nav-dropdown-item";
    desktop.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Iniciar sesión';
  }

  if (mobile) {
    mobile.href = `${pages}login.html`;
    mobile.className = "offcanvas-login";
    mobile.innerHTML = '<i class="bi bi-box-arrow-in-right"></i> Iniciar sesión';
  }
}

function setupRoleMenus(user, isLoggedIn) {
  const isAdmin = isLoggedIn && String(user?.rol || '').toUpperCase() === "ADMIN";
  const isUser = isLoggedIn && !isAdmin;

  document.querySelectorAll(".admin-section").forEach(el => {
    el.style.display = isAdmin ? "" : "none";
  });

  document.querySelectorAll(".user-section").forEach(el => {
    el.style.display = isUser ? "" : "none";
  });

  document.querySelectorAll(".role-divider").forEach(el => {
    el.style.display = isLoggedIn ? "" : "none";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".nav-container");
  if (!container) return;

  container.innerHTML = navbar;

  const user = authService.getUser();
  const isLoggedIn = authService.isAuthenticated();

  setAuthAction(isLoggedIn);
  setupRoleMenus(user, isLoggedIn);

  initCorotoChat();

  requestAnimationFrame(() => {
    cartService.updateBadge();

    const usernameEls = document.querySelectorAll(".offcanvas-username");
    const welcome = document.getElementById("welcome-msg");
    const welcomeMobile = document.getElementById("welcome-msg-mobile");

    if (user) {
      const displayName = [user.nombre, user.apellido].filter(Boolean).join(' ') || user.username || user.email || 'Usuario';

      usernameEls.forEach(el => el.textContent = displayName);

      const msg = `Bienvenido, ${displayName}`;

      if (welcome) welcome.textContent = msg;
      if (welcomeMobile) welcomeMobile.textContent = msg;
    } else {
      usernameEls.forEach(el => el.textContent = "Invitado");
      if (welcome) welcome.textContent = "Inicia sesión para continuar";
      if (welcomeMobile) welcomeMobile.textContent = "Inicia sesión para continuar";
    }
  });

  const handleAuthAction = (e) => {
    if (!authService.isAuthenticated()) return;

    e.preventDefault();
    authService.logout();
    window.location.href = `${pages}login.html`;
  };

  document.getElementById("navAuthAction")?.addEventListener("click", handleAuthAction);
  document.getElementById("offcanvasAuthAction")?.addEventListener("click", handleAuthAction);
});
