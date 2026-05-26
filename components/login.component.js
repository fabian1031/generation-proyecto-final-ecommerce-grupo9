import { validateCorreo, validatePassword } from "../scripts/validations.js";
import { userService } from "../services/users.services.js";
import { authService } from "../services/auth.service.js";

export function initLogin(container, onSuccess) {
  if (!container) return;

  container.innerHTML = `
    <form id="loginForm" class="m-3">
      <input id="email" type="email" placeholder="Email" class="form-control mb-2" />
      <input id="password" type="password" placeholder="Password" class="form-control mb-2" />
      <div class="d-grid">
        <button type="submit" class="btn btn-primary">Ingresar</button>
      </div>
    </form>
  `;

  const form = container.querySelector("#loginForm");
  const emailInput = container.querySelector("#email");
  const passwordInput = container.querySelector("#password");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.disabled = true;

    try {
      const users = await userService.getByEmail(email);
      const user = users[0];

      if (!user || user.password !== password) {
        await Swal.fire({
          icon: "error",
          title: "Credenciales inválidas",
          text: "Verifica tu correo y contraseña"
        });
        return;
      }

      if (!user.isActive) {
        await Swal.fire({
          icon: "warning",
          title: "Usuario inactivo",
          text: "Contacta al administrador"
        });
        return;
      }

      authService.login(user);

      if (onSuccess) {
        await onSuccess(user);
      }
    } catch (error) {
      console.error("Error en login:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo iniciar sesión"
      });
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}