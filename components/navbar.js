import { cartService } from "../services/cartSevices.js";

const navbar = `
<nav class="navbar navbar-expand-lg sticky-top bg-white offcanvas-border">
  <div class="container mt-3">

    <!-- Logo -->
    <a class="navbar-brand d-flex align-items-center gap-2" href="./index.html">
      <img src="../assets/pages/login.png" class="img-fluid" alt="logo-nav" width="100">
      <span class="fw-bold d-none d-md-inline nav-brand-text">Coroto</span>
    </a>

    <!-- Acciones mobile -->
    <div class="d-flex d-lg-none align-items-center gap-2 ms-auto">
      <div class="position-relative" style="width:46px;height:46px;">
        <a href="./cart.html" class="nav-icon-btn">
          <i class="bi bi-bag fs-5"></i>
        </a>
        <span id="cart-count-mobile" class="position-absolute badge rounded-pill nav-badge">0</span>
      </div>
      <button class="navbar-toggler border-0 shadow-none ps-1" type="button"
        data-bs-toggle="offcanvas" data-bs-target="#offcanvasNav" aria-controls="offcanvasNav">
        <span class="navbar-toggler-icon"></span>
      </button>
    </div>

    <!-- Nav desktop -->
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav mx-auto gap-1">
        <li class="nav-item">
          <a class="nav-link px-3 fw-semibold text-uppercase d-flex align-items-center gap-2 rounded-3 nav-link-item"
            href="./index.html">
            <i class="bi bi-house-door fs-5"></i>Inicio
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link px-3 fw-semibold text-uppercase d-flex align-items-center gap-2 rounded-3 nav-link-item"
            href="./about.html">
            <i class="bi bi-people fs-5"></i>Nosotros
          </a>
        </li>
        <li class="nav-item">
          <a class="nav-link px-3 fw-semibold text-uppercase d-flex align-items-center gap-2 rounded-3 nav-link-item"
            href="./contact.html">
            <i class="bi bi-chat-dots fs-5"></i>Contacto
          </a>
        </li>
      </ul>

      <!-- Acciones desktop -->
      <div class="d-none d-lg-flex align-items-center gap-3">

        <div class="position-relative" style="width:46px;height:46px;">
          <a href="./cart.html" class="nav-icon-btn">
            <i class="bi bi-bag fs-5"></i>
          </a>
          <span id="cart-count" class="position-absolute badge rounded-pill nav-badge">0</span>
        </div>

        <div class="dropdown">
          <button class="nav-icon-btn-primary"
            data-bs-toggle="dropdown" aria-expanded="false">
            <i class="bi bi-person-circle fs-4"></i>
          </button>
          <ul class="dropdown-menu dropdown-menu-end shadow-lg mt-2 rounded-4 py-3 nav-dropdown">
            <li><h6 class="dropdown-header fw-bold small text-uppercase text-center nav-dropdown-header">Mi Perfil</h6></li>
            <li><a class="dropdown-item py-2 px-4 d-flex align-items-center gap-3 nav-dropdown-item" href="#"><i class="bi bi-person fs-5"></i>Ver Perfil</a></li>
            <li><a class="dropdown-item py-2 px-4 d-flex align-items-center gap-3 nav-dropdown-item" href="#"><i class="bi bi-receipt fs-5"></i>Mis Pedidos</a></li>
            <li><hr class="dropdown-divider nav-dropdown-divider my-2"></li>
            <li><h6 class="dropdown-header fw-bold small text-uppercase text-center nav-dropdown-header">Administración</h6></li>
            <li><a class="dropdown-item py-2 px-4 d-flex align-items-center gap-3 nav-dropdown-item" href="./admin_dashboard.html"><i class="bi bi-kanban fs-5"></i>Panel Productos</a></li>
            <li><a class="dropdown-item py-2 px-4 d-flex align-items-center gap-3 nav-dropdown-item" href="./admin_users.html"><i class="bi bi-people-fill fs-5"></i>Gestión Usuarios</a></li>
            <li><hr class="dropdown-divider nav-dropdown-divider my-2"></li>
            <li><a class="dropdown-item py-2 px-4 d-flex align-items-center gap-3 nav-danger-item" href="#"><i class="bi bi-box-arrow-right fs-5"></i>Cerrar Sesión</a></li>
          </ul>
        </div>
      </div>
    </div>

  </div>
</nav>

<!-- Offcanvas Mobile -->
<div class="offcanvas offcanvas-end" tabindex="-1" id="offcanvasNav" style="max-width:300px;">
  <div class="offcanvas-header offcanvas-border px-4 py-3">
    <div class="d-flex align-items-center gap-2">
      <img src="../assets/pages/login.png" width="80" alt="logo">
      <span class="fw-bold offcanvas-brand-text">Coroto</span>
    </div>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas" aria-label="Close"></button>
  </div>

  <div class="offcanvas-body px-4 pt-3 d-flex flex-column" style="overflow-y:auto;">

    <!-- Perfil resumen -->
    <div class="d-flex align-items-center gap-3 mb-4 offcanvas-profile">
      <div class="offcanvas-avatar">
        <i class="bi bi-person-fill fs-5"></i>
      </div>
      <div>
        <p class="mb-0 fw-semibold offcanvas-username">Usuario</p>
        <p class="mb-0 offcanvas-email">usuario@correo.com</p>
      </div>
    </div>

    <!-- Menú -->
    <p class="mb-2 offcanvas-section-label">Menú</p>
    <ul class="nav flex-column gap-1 mb-4">
      <li class="nav-item">
        <a class="nav-link d-flex align-items-center gap-3 offcanvas-nav-link" href="./index.html">
          <i class="bi bi-house-door fs-5"></i>Inicio
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link d-flex align-items-center gap-3 offcanvas-nav-link" href="./about.html">
          <i class="bi bi-people fs-5"></i>Nosotros
        </a>
      </li>
      <li class="nav-item">
        <a class="nav-link d-flex align-items-center gap-3 offcanvas-nav-link" href="./contact.html">
          <i class="bi bi-chat-dots fs-5"></i>Contacto
        </a>
      </li>
    </ul>

    <!-- Mi cuenta -->
    <p class="mb-2 offcanvas-section-label">Mi cuenta</p>
    <ul class="nav flex-column gap-1 mb-4">
      <li>
        <a class="nav-link d-flex align-items-center gap-3 offcanvas-nav-link" href="#">
          <i class="bi bi-person fs-5"></i>Ver Perfil
        </a>
      </li>
      <li>
        <a class="nav-link d-flex align-items-center gap-3 offcanvas-nav-link" href="#">
          <i class="bi bi-receipt fs-5"></i>Mis Pedidos
        </a>
      </li>
    </ul>

    <!-- Administración -->
    <p class="mb-2 offcanvas-section-label">Administración</p>
    <ul class="nav flex-column gap-1 mb-4">
      <li>
        <a class="nav-link d-flex align-items-center gap-3 offcanvas-nav-link" href="./admin_dashboard.html">
          <i class="bi bi-kanban fs-5"></i>Panel Productos
        </a>
      </li>
      <li>
        <a class="nav-link d-flex align-items-center gap-3 offcanvas-nav-link" href="./admin_users.html">
          <i class="bi bi-people-fill fs-5"></i>Gestión Usuarios
        </a>
      </li>
    </ul>

    <!-- Cerrar sesión -->
    <div class="mt-auto pb-2">
      <a href="#" class="offcanvas-logout">
        <i class="bi bi-box-arrow-right"></i>Cerrar Sesión
      </a>
    </div>

  </div>
</div>
`;

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".nav-container");
  if (container) {
    container.innerHTML = navbar;
    if (cartService && typeof cartService.updateBadge === "function") {
      cartService.updateBadge();
    }
  }
});