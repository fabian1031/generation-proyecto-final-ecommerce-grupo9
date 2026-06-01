import { validateCorreo, validatePassword } from "../scripts/validations.js";
import { authService, parseLoginResponse } from "../services/auth.service.js";
import { api } from "../services/api.js";

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

    const emailResult = validateCorreo(email);
    const passResult = validatePassword(password);

    if (!emailResult.valid || !passResult.valid) {
      await Swal.fire({
        icon: "error",
        title: "Credenciales inválidas",
        text: !emailResult.valid ? emailResult.message : passResult.message,
      });
      return;
    }

    const submitBtn = form.querySelector("button[type='submit']");
    if (submitBtn) submitBtn.disabled = true;

    try {
      const response = await api.post("/auth/login", { email, password });

      const session = parseLoginResponse(response);

      if (!session?.token) {
        await Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se recibió respuesta válida del servidor",
        });
        return;
      }

      const user = session.user;

      if (user?.activo === false) {
        await Swal.fire({
          icon: "warning",
          title: "Usuario inactivo",
          text: "Contacta al administrador",
        });
        return;
      }

      authService.setUser(session.user, session.token);

      const profile =
        (await authService.ensureUserProfile({ loginEmail: email, loginResponse: response })) ||
        session.user;

      if (onSuccess) {
        await onSuccess(profile);
      }
    } catch (error) {
      console.error("Error en login:", error);
      await Swal.fire({
        icon: "error",
        title: "Error",
        text: error.message || "No se pudo iniciar sesión",
      });
    } finally {
      if (submitBtn) submitBtn.disabled = false;
    }
  });
}
