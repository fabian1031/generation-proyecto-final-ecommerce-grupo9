const footer = `
<footer class=" text-white pt-5 pb-4">
  <div class="container">
    <div class="row g-4">

      <!-- Marca -->
      <div class="col-12 col-lg-4">
        <a class="d-flex align-items-center gap-2 text-decoration-none mb-3" href="#">
          <span class="fw-bold fs-4 text-white">Coroto</span>
        </a>
        <p class="text-white mb-1">
          <span class="fw-semibold" style="color: var(--beige);">"Lo que uno desecha, otro lo necesita"</span>
        </p>
        <p class="text-white small mb-4">
          Dándole una segunda oportunidad a la tecnología y el hogar en Colombia.
        </p>
        <div class="d-flex gap-2">
          <a href="#" class="btn btn-outline-light rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;" aria-label="Facebook">
            <i class="bi bi-facebook"></i>
          </a>
          <a href="#" class="btn btn-outline-light rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;" aria-label="Instagram">
            <i class="bi bi-instagram"></i>
          </a>
          <a href="#" class="btn btn-outline-light rounded-circle d-flex align-items-center justify-content-center" style="width: 40px; height: 40px;" aria-label="Twitter X">
            <i class="bi bi-twitter-x"></i>
          </a>
        </div>
      </div>

      <!-- Nosotros -->
      <div class="col-6 col-sm-4 col-lg-2 offset-lg-1">
        <h6 class="text-uppercase small fw-bold mb-3" style="color: var(--beige); letter-spacing: 1px;">Nosotros</h6>
        <ul class="list-unstyled mb-0">
          <li class="mb-2"><a href="./about.html" class="text-white text-decoration-none small d-flex align-items-center gap-2 hover-beige"><i class="bi bi-people" style="color: var(--beige);"></i>Quiénes Somos</a></li>
          <li class="mb-2"><a href="./contact.html" class="text-white text-decoration-none small d-flex align-items-center gap-2 hover-beige"><i class="bi bi-chat-dots" style="color: var(--beige);"></i>Contacto</a></li>
          <li class="mb-2"><a href="#" class="text-white text-decoration-none small d-flex align-items-center gap-2 hover-beige"><i class="bi bi-tree" style="color: var(--beige);"></i>Sostenibilidad</a></li>
        </ul>
      </div>

      <!-- Legal -->
      <div class="col-6 col-sm-4 col-lg-2">
        <h6 class="text-uppercase small fw-bold mb-3" style="color: var(--beige); letter-spacing: 1px;">Legal</h6>
        <ul class="list-unstyled mb-0">
          <li class="mb-2"><a href="#" class="text-white text-decoration-none small d-flex align-items-center gap-2 hover-beige"><i class="bi bi-file-text" style="color: var(--beige);"></i>Términos</a></li>
          <li class="mb-2"><a href="#" class="text-white text-decoration-none small d-flex align-items-center gap-2 hover-beige"><i class="bi bi-shield-check" style="color: var(--beige);"></i>Privacidad</a></li>
          <li class="mb-2"><a href="#" class="text-white text-decoration-none small d-flex align-items-center gap-2 hover-beige"><i class="bi bi-arrow-return-left" style="color: var(--beige);"></i>Devoluciones</a></li>
        </ul>
      </div>

      <!-- Ubicación -->
      <div class="col-12 col-sm-4 col-lg-3">
        <h6 class="text-uppercase small fw-bold mb-3" style="color: var(--beige); letter-spacing: 1px;">Ubicación</h6>
        <ul class="list-unstyled mb-0">
          <li class="mb-2 d-flex align-items-center gap-2 text-white small">
            <i class="bi bi-geo-alt-fill" style="color: var(--beige);"></i>
            <span>Medellín, Antioquia</span>
          </li>
          <li class="mb-2 d-flex align-items-center gap-2 text-white small">
            <i class="bi bi-envelope-at-fill" style="color: var(--beige);"></i>
            <span>contacto@coroto.com</span>
          </li>
          <li class="mb-2 d-flex align-items-center gap-2 text-white small">
            <i class="bi bi-whatsapp" style="color: var(--beige);"></i>
            <span>+57 (300) 000-0000</span>
          </li>
        </ul>
      </div>

    </div>

    <hr class="border-secondary opacity-25 mt-5 mb-4">

    <div class="row">
      <div class="col-12 col-md-6">
        <small class="text-white">
          © 2026 <span class="fw-semibold" style="color: var(--beige);">Coroto</span>. Todos los derechos reservados.
        </small>
      </div>
    </div>

  </div>
</footer>
`;

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".footer-container");
  if (container) {
    container.innerHTML = footer;
  }
});