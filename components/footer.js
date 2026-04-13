const footer = `
<footer class="footer-clean py-5">
  <div class="container">
    <div class="row align-items-start">

      <div class="col-md-6 mb-4">
        <h2 class="logo">coroto</h2>

        <p class="footer-text">
          Lo que uno desecha,<br>
          otro lo necesita
        </p>

        <div class="footer-social">
          <a href="#"><i class="bi bi-facebook"></i></a>
          <a href="#"><i class="bi bi-instagram"></i></a>
          <a href="#"><i class="bi bi-twitter-x"></i></a>
        </div>
      </div>

    
      <div class="col-md-6">
        <div class="row">

          <div class="col-6">
            <h6 class="footer-title">Nosotros</h6>
            <p><a href="#">Contacto</a></p>
          </div>

          <div class="col-6">
            <h6 class="footer-title">Enlaces de interés</h6>
            <p><a href="#">Términos y condiciones</a></p>
          </div>

        </div>
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