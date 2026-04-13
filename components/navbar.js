const navbar = `
<nav class="navbar navbar-expand-lg navbar-light navbar-clean">
  <div class="container-fluid">

    <a class="navbar-brand logo" href="#">coroto</a>

    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
      <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" id="navbarNav">

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

      <ul class="navbar-nav ms-auto text-center">

        <!-- Carrito -->
        <li class="nav-item">
          <a class="nav-link position-relative" href="#">
            <i class="bi bi-cart"></i>
            <span class="cart-badge">2</span>
          </a>
        </li>

        <!-- Usuario -->
        <li class="nav-item dropdown">
          <a class="nav-link dropdown-toggle" href="#" data-bs-toggle="dropdown">
            <i class="bi bi-person-circle"></i> Cuenta
          </a>

          <ul class="dropdown-menu dropdown-menu-end text-center">
            <li><a class="dropdown-item" href="#">Mi perfil</a></li>
            <li><a class="dropdown-item" href="#">Mis pedidos</a></li>
            <li><hr class="dropdown-divider"></li>
            <li><a class="dropdown-item" href="#">Cerrar sesión</a></li>
          </ul>
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






