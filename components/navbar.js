import { cartService } from "../services/cartSevices.js";

const getUser = () => JSON.parse(localStorage.getItem("authUser"));

const navbar = `
<nav class="navbar navbar-expand-lg sticky-top bg-white offcanvas-border">
  <div class="container mt-3">

    <!-- Logo -->
    <a class="navbar-brand d-flex align-items-center gap-2" href="./index.html">
      <img src="../assets/pages/login.png" class="img-fluid" alt="logo-nav" width="100">
      <span class="fw-bold d-none d-md-inline nav-brand-text">Coroto</span>
    </a>

    <!-- MOBILE -->
    <div class="d-flex d-lg-none align-items-center gap-2 ms-auto">
      <div class="position-relative" style="width:46px;height:46px;">
        <a href="./cart.html" class="nav-icon-btn">
          <i class="bi bi-bag fs-5"></i>
        </a>
        <span id="cart-count-mobile" class="position-absolute badge rounded-pill nav-badge">0</span>
      </div>

      <button class="navbar-toggler border-0 shadow-none ps-1" type="button"
        data-bs-toggle="offcanvas" data-bs-target="#offcanvasNav">
        <span class="navbar-toggler-icon"></span>
      </button>
    </div>

    <!-- NAV DESKTOP -->
    <div class="collapse navbar-collapse" id="navbarNav">
      <ul class="navbar-nav mx-auto gap-1">
        <li class="nav-item">
          <a class="nav-link px-3 fw-semibold text-uppercase d-flex align-items-center gap-2 rounded-3"
            href="./index.html">
            <i class="bi bi-house-door fs-5"></i>Inicio
          </a>
        </li>

        <li class="nav-item">
          <a class="nav-link px-3 fw-semibold text-uppercase d-flex align-items-center gap-2 rounded-3"
            href="./about.html">
            <i class="bi bi-people fs-5"></i>Nosotros
          </a>
        </li>

        <li class="nav-item">
          <a class="nav-link px-3 fw-semibold text-uppercase d-flex align-items-center gap-2 rounded-3"
            href="./contact.html">
            <i class="bi bi-chat-dots fs-5"></i>Contacto
          </a>
        </li>
      </ul>

      <!-- ACTIONS -->
      <div class="d-none d-lg-flex align-items-center gap-3">

        <div class="position-relative" style="width:46px;height:46px;">
          <a href="./cart.html" class="nav-icon-btn">
            <i class="bi bi-bag fs-5"></i>
          </a>
          <span id="cart-count" class="position-absolute badge rounded-pill nav-badge">0</span>
        </div>

        <!-- USER -->
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
              <a class="dropdown-item" href="./admin_dashboard.html">
                <i class="bi bi-kanban"></i> Panel Productos
              </a>
            </li>

            <li class="admin-section">
              <a class="dropdown-item" href="./admin_users.html">
                <i class="bi bi-people-fill"></i> Gestión Usuarios
              </a>
            </li>

            <li><hr class="dropdown-divider"></li>

            <li>
              <a class="dropdown-item nav-danger-item" href="#">
                <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
              </a>
            </li>

          </ul>
        </div>
      </div>
    </div>

  </div>
</nav>

<!-- OFFCANVAS -->
<div class="offcanvas offcanvas-end" tabindex="-1" id="offcanvasNav" style="max-width:300px;">
  <div class="offcanvas-header px-4 py-3">
    <div class="d-flex align-items-center gap-2">
      <img src="../assets/pages/login.png" width="80" alt="logo">
      <span class="fw-bold">Coroto</span>
    </div>
    <button type="button" class="btn-close" data-bs-dismiss="offcanvas"></button>
  </div>

  <div class="offcanvas-body px-4 d-flex flex-column">

    <div class="offcanvas-profile mb-4">
      <p class="mb-0 fw-semibold offcanvas-username">Usuario</p>
      <p class="mb-0 text-muted small" id="welcome-msg-mobile"></p>
    </div>

    <ul class="nav flex-column gap-1">
      <li><a class="nav-link" href="./index.html">Inicio</a></li>
      <li><a class="nav-link" href="./about.html">Nosotros</a></li>
      <li><a class="nav-link" href="./contact.html">Contacto</a></li>
    </ul>

    <div class="mt-auto">
      <a href="#" class="offcanvas-logout">
        <i class="bi bi-box-arrow-right"></i> Cerrar Sesión
      </a>
    </div>

  </div>
</div>
`;

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".nav-container");
  if (!container) return;

  container.innerHTML = navbar;

  const user = getUser();

  requestAnimationFrame(() => {
    cartService.updateBadge();

    const usernameEls = document.querySelectorAll(".offcanvas-username");
    const welcome = document.getElementById("welcome-msg");
    const welcomeMobile = document.getElementById("welcome-msg-mobile");

    if (user) {
      usernameEls.forEach(el => el.textContent = user.username || "Usuario");

      const msg = `Bienvenido, ${user.username}`;

      if (welcome) welcome.textContent = msg;
      if (welcomeMobile) welcomeMobile.textContent = msg;
    } else {
      usernameEls.forEach(el => el.textContent = "Invitado");
    }
  });

  const logoutDesktop = document.querySelector(".nav-danger-item");
  const logoutMobile = document.querySelector(".offcanvas-logout");

  const doLogout = (e) => {
    e.preventDefault();
    localStorage.removeItem("authUser");
    window.location.reload();
  };

  logoutDesktop?.addEventListener("click", doLogout);
  logoutMobile?.addEventListener("click", doLogout);

  if (user && user.role !== "Admin") {
    document.querySelectorAll(".admin-section").forEach(el => {
      el.style.display = "none";
    });
  }

  if (!user) {
    document.querySelectorAll(".admin-section").forEach(el => {
      el.style.display = "none";
    });
  }
});