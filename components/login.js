const login = `
    <div class="dinamic-container login-container">
        <main class="main-container">

            <div class="container">
                <div class="row d-flex justify-content-center">
                    <div class="col-12 col-md-6 d-flex justify-content-center align-items-center">
                        <div class="w-100">
                            <h4 class="text-center mb-4 fw-semibold">Iniciar sesión</h4>
                            <form id="loginForm" class="m-5 needs-validation" novalidate>
                                <!-- Email -->
                                <div class="mb-3">
                                    <label class="form-label text-muted" for="email">
                                        <i class="bi bi-envelope-fill"></i> Correo
                                    </label>

                                    <input id="email" type="email" class="form-control rounded-4 border-0 py-2 px-2"
                                        placeholder="Tu email" required>

                                    <div class="invalid-feedback">
                                        Ingresa un correo válido.
                                    </div>
                                </div>

                                <!-- Password -->
                                <div class="mb-4 position-relative">
                                    <label class="form-label text-muted" for="password">
                                        <i class="bi bi-person-fill-lock"></i> Contraseña
                                    </label>

                                    <input id="password" type="password"
                                        class="form-control rounded-4 border-0 py-2 px-3 pe-5"
                                        placeholder="Tus password" required>

                                    <div class="invalid-feedback">
                                        La contraseña es obligatoria (mínimo 6 caracteres).
                                    </div>

                                    <span id="showPassword" class="position-absolute top-50 end-0 mt-1 me-3"
                                        style="cursor: pointer;">
                                        <i id="icon" class="bi bi-eye"></i>
                                    </span>
                                </div>

                                <div class="d-grid mb-3">
                                    <button class="btn btn-primary rounded-3 py-2">
                                        Ingresar
                                    </button>
                                </div>
                            </form>
                            <p class="text-center mt-3 mb-0">
                                ¿No tienes una cuenta?
                                <a href="./register.html" class="fw-semibold text-secondary text-decoration-none">
                                    Regístrate
                                </a>
                            </p>
                        </div>
                    </div>

                </div>
            </div>

        </main>

        <!-- footer -->
        <footer class="footer-container">
        </footer>

    </div>
`;

document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".checkout-container");
  if (container) {
    container.innerHTML = login;
  }
});