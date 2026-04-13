const navbar = `
<nav class="navbar navbar-expand-lg navbar-light navbar-clean">
  <div class="container-fluid">

    <a class="navbar-brand logo" href="#">coroto</a>

    <div class="d-flex align-items-center order-lg-3 nav-icons">
      <a href="#" class="position-relative">
        <i class="bi bi-cart"></i>
        <span class="cart-badge">2</span>
      </a>

      <div class="dropdown ms-3">
        <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" data-bs-toggle="dropdown">
          <i class="bi bi-person-circle"></i>
        </a>

        <ul class="dropdown-menu dropdown-menu-end">
          <li><a class="dropdown-item" href="#">Mi perfil</a></li>
          <li><a class="dropdown-item" href="#">Mis pedidos</a></li>
          <li><hr class="dropdown-divider"></li>
          <li><a class="dropdown-item" href="#">Cerrar sesión</a></li>
        </ul>
      </div>
    </div>

    <button class="navbar-toggler order-lg-2" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse order-lg-1" id="navbarNav">
      <ul class="navbar-nav mx-auto text-center">
        <li class="nav-item">
          <a class="nav-link active" href="#">Inicio</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#">Acerca de nosotros</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="#">Productos</a>
        </li>
      </ul>
    </div>

  </div>
</nav>
`;

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".nav-container");
  if (container) {
    container.innerHTML = navbar;
  }
});

