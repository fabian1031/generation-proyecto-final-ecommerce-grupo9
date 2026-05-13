import { initLogin } from "./login.component.js";
import { authService } from "../auth/auth.service.js";

export function initCheckout(container) {
  const user = authService.getUser();

  if (!user) {
    container.innerHTML = `
      <div class="text-center p-4">
        <h4>Debes iniciar sesión para continuar</h4>
        <div id="loginMount"></div>
      </div>
    `;

    const loginMount = container.querySelector("#loginMount");

    initLogin(loginMount, () => {
      renderCheckout(container);
    });

    return;
  }

  renderCheckout(container);
}

function renderCheckout(container) {
  container.innerHTML = `
    <h4>Checkout</h4>

    <form id="checkoutForm">
      <input class="form-control mb-2" placeholder="Nombre" />
      <input class="form-control mb-2" placeholder="Email" />
      <button class="btn btn-success w-100">Confirmar compra</button>
    </form>
  `;
}