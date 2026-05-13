import { validateCorreo, validatePassword } from "../scripts/validations.js";
import { userService } from "../services/users.services.js";
import { authService } from "../services/auth.service.js";

export function initLogin(container, onSuccess) {
  if (!container) return;

  container.innerHTML = `
    <form id="loginForm" class="m-3">
      <input id="email" type="email" placeholder="Email" class="form-control mb-2" />
      <input id="password" type="password" placeholder="Password" class="form-control mb-2" />
      <button class="btn btn-primary w-100">Ingresar</button>
    </form>
  `;

  const form = container.querySelector("#loginForm");
  const emailInput = container.querySelector("#email");
  const passwordInput = container.querySelector("#password");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();
    const password = passwordInput.value.trim();

    const users = await userService.getByEmail(email);
    const user = users[0];

    if (!user || user.password !== password) {
      alert("Credenciales inválidas");
      return;
    }

    if (!user.isActive) {
      alert("Usuario inactivo");
      return;
    }

    authService.login(user);

    if (onSuccess) {
      onSuccess(user);
    }
  });
}