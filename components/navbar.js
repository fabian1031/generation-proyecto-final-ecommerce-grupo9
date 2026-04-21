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
          <a class="nav-link active" href="./index.html">Inicio</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="./about.html">Acerca de nosotros</a>
        </li>
        <li class="nav-item">
          <a class="nav-link" href="./contact.html">Contacto</a>
        </li>
      </ul>

      <ul class="navbar-nav text-center">

        <!-- Carrito -->
        <li class="nav-item">
          <a class="nav-link position-relative" href="./cart.html">
            <i class="bi bi-cart"></i>
            <span class="cart-badge"></span>
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
            <li><a class="dropdown-item" href="./admin_dashboard.html">Admin Products</a></li>
            <li><a class="dropdown-item" href="./admin_users.html">Admin Users</a></li>
    
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






