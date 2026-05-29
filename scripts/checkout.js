import { cartService } from '../services/cartSevices.js';
import { formatPrice } from '../services/utils.service.js';
import { validateCheckout } from './validations.js';
import { authService } from '../services/auth.service.js';
import { initLogin } from '../components/login.component.js';
import { showLoader, hideLoader } from '../components/loader.component.js';
import { initUbicacion } from '../services/departamentos-ciudades.js';

document.addEventListener('DOMContentLoaded', () => {
    if (cartService.getCart().length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    initUbicacion();
    mostrarResumen();
    iniciarEventos();
    cargarOpenPay();

    const usuario = authService.getUser();
    if (usuario) {
        llenarDatos(usuario);
    } else {
        mostrarLogin();
    }
});

function mostrarResumen() {
    const carrito = cartService.getCart();
    const { subtotal, iva, total } = calcularTotales();

    campo('checkoutItems').innerHTML = carrito.map((item) => `
        <div class="d-flex justify-content-between align-items-start small mb-2 gap-2">
            <span class="text-truncate">${item.name} <span class="text-muted">×${item.quantity}</span></span>
            <span class="fw-semibold text-nowrap">${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join('');

    campo('checkoutProducts').textContent = `Productos (${cartService.getTotalItems()})`;
    campo('checkoutSubtotal').textContent = formatPrice(subtotal);
    campo('checkoutIva').textContent = formatPrice(iva);
    campo('checkoutTotal').textContent = formatPrice(total);
}

function fillCheckoutForm(user) {
    const map = {
        nombre: user.username || user.name || '',
        apellidos: user.lastname || '',
        correo: user.email || '',
        celular: user.phone || user.celular || ''
    };

    Object.entries(map).forEach(([key, value]) => {
        const input = document.getElementById(key);
        if (input) input.value = value;
    });
}

function renderLoginCTA() {
    const mount = document.querySelector('.checkout-container');

    const wrapper = document.createElement('div');
    wrapper.innerHTML = `
        <div class="login-cta">
            <div class="d-flex justify-content-between align-items-center p-3 bg-light rounded">
                <span class="small text-muted">
                    Inicia sesión para autocompletar tus datos
                </span>

                <button class="btn btn-primary btn-sm" id="openLogin">
                    Iniciar sesión
                </button>
            </div>
        </div>
    `;

    campo('openLogin').addEventListener('click', abrirLogin);
}

function abrirLogin() {
    const modal = document.createElement('div');
    modal.id = 'loginModalMount';
    document.body.appendChild(modal);
    modal.innerHTML = `
        <div class="modal-backdrop-custom">
            <div class="modal-box">
                <button type="button" id="closeLogin" class="btn-close float-end" aria-label="Cerrar"></button>
                <h5 class="mb-3"><i class="bi bi-box-arrow-in-right me-2"></i>Iniciar sesión</h5>
                <div id="loginFormMount"></div>
            </div>
        </div>
    `;

    initLogin(campo('loginFormMount'), async (usuario) => {
        llenarDatos(usuario);
        document.querySelector('.checkout-container')?.replaceChildren();
        await Swal.fire({
            icon: 'success',
            title: `Bienvenido ${usuario.username}`,
            text: 'Datos cargados en el formulario',
            timer: 1800,
            showConfirmButton: false,
        });
        modal.remove();
    });

    campo('closeLogin').addEventListener('click', () => modal.remove());
}

function bindCheckoutEvents() {
    const button = document.getElementById('confirmPurchase');

    if (!button) return;

    button.addEventListener('click', async () => {

        const fields = {
            nombre: document.getElementById('nombre').value,
            apellidos: document.getElementById('apellidos').value,
            celular: document.getElementById('celular').value,
            correo: document.getElementById('correo').value,
            direccion: document.getElementById('direccion').value,
            departamento: document.getElementById('departamento').value,
            ciudad: document.getElementById('ciudad').value
        };

        const result = validateCheckout(fields);

        if (!result.valid) {
            applyValidationErrors(result.errors);
            applyValidStates(fields, result.errors);
            return;
        }

        const confirm = await Swal.fire({
            title: '¿Confirmar compra?',
            text: 'Se procesará tu pedido',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, comprar'
        });

        if (!confirm.isConfirmed) return;

        const subtotal = cartService.getTotalPrice();
        const iva = Math.round(subtotal * 0.19);
        const total = Math.round(subtotal + iva);
        const idPedido = Date.now();

        button.disabled = true;
        showLoader(
            'Te estamos redirigiendo a la pasarela de pagos...',
            'Una vez confirmado el pago, procesaremos tu pedido.',
        );

        try {
            const [res] = await Promise.all([
                fetch('https://coroto.online', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        id_pedido: idPedido,
                        nombre: fields.nombre.trim(),
                        apellido: fields.apellidos.trim(),
                        email: fields.correo.trim(),
                        telefono: fields.celular.trim(),
                        direccion: fields.direccion.trim(),
                        departamento: fields.departamento,
                        ciudad: fields.ciudad,
                        total,
                        iva,
                    }),
                }),
                wait(1800),
            ]);

            updateLoader('Te estamos redirigiendo a la pasarela de pagos...');

            const payment = await res.json();

            if (payment.status === 'ok' && payment.url_pse) {
                sessionStorage.setItem('corotoOrder', JSON.stringify({
                    id_pedido: idPedido,
                    id_transaccion: payment.id_transaccion,
                    order_id: payment.order_id,
                    createdAt: new Date().toISOString(),
                    items: cartService.getCart(),
                    subtotal,
                    iva,
                    total,
                    customer: {
                        nombre: fields.nombre.trim(),
                        apellido: fields.apellidos.trim(),
                        email: fields.correo.trim(),
                        telefono: fields.celular.trim(),
                        direccion: fields.direccion.trim(),
                        departamento: fields.departamento,
                        ciudad: fields.ciudad,
                    },
                }));

                await wait(2000);
                cartService.clear();
                window.location.href = payment.url_pse;
                return;
            }

            throw new Error(payment.mensaje || 'No se pudo iniciar el pago');
        } catch (error) {
            hideLoader();
            button.disabled = false;

            await Swal.fire({
                icon: 'error',
                title: 'Error al procesar el pago',
                text: error.message || 'No se pudo conectar con la pasarela de pagos',
            });
        }
    });
}



function applyValidationErrors(errors) {
    document.querySelectorAll('.form-control, .form-select').forEach(input => {
        input.classList.remove('is-invalid', 'is-valid');
    });
    document.querySelectorAll('#checkoutForm .invalid-feedback').forEach((el) => {
        el.textContent = '';
    });

    let primero = null;
    Object.entries(errores).forEach(([id, mensaje]) => {
        marcarCampoError(campo(id), mensaje);
        if (!primero) primero = campo(id);
    });
    primero?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function marcarValidos(datos, errores) {
    Object.keys(datos).forEach((id) => {
        if (!errores[id] && campo(id)?.value.trim()) {
            campo(id).classList.add('is-valid');
        }
    });
}

function configurarOpenPay() {
    if (typeof OpenPay === 'undefined') return;
    OpenPay.hostname = 'https://api.openpay.co/v1/';
    OpenPay.sandboxHostname = 'https://sandbox-api.openpay.co/v1/';
    if (OpenPay.deviceData) {
        OpenPay.deviceData._hostname = 'https://api.openpay.co/';
        OpenPay.deviceData._sandboxHostname = 'https://sandbox-api.openpay.co/';
    }
}

async function cargarOpenPay() {
    if (typeof OpenPay === 'undefined') {
        mensajeOpenpay = 'No cargó la librería OpenPay';
        return false;
    }

    try {
        const res = await fetch(CONFIG_URL);
        const config = await res.json();

        if (!res.ok || config.status !== 'ok' || !config.public_key) {
            mensajeOpenpay = config.mensaje || 'Configuración de pago incompleta';
            return false;
        }

        configurarOpenPay();
        OpenPay.setSandboxMode(!!config.sandbox);
        OpenPay.setId(String(config.merchant_id).trim());
        OpenPay.setApiKey(String(config.public_key).trim());

        openpayListo = true;
        mensajeOpenpay = '';
        return true;
    } catch (err) {
        mensajeOpenpay = err.message || 'No se pudo conectar con el servidor de pagos';
        return false;
    }
}

function sesionDispositivo() {
    configurarOpenPay();
    const input = campo('device_session_id');
    if (!campo('openpayCardForm') || !input || !OpenPay?.deviceData?.setup) return '';

    try {
        const id = OpenPay.deviceData.setup('openpayCardForm', 'device_session_id');
        if (id) {
            input.value = String(id);
            return String(id).trim();
        }
    } catch {}

    return input.value.trim();
}

function tokenTarjeta() {
    const input = campo('cardNumber');
    const conEspacios = input?.value || '';

    if (input) input.value = conEspacios.replace(/\D/g, '');

    return new Promise((resolve, reject) => {
        const restaurar = () => {
            if (input) input.value = formatearTarjeta(conEspacios);
        };

        OpenPay.token.extractFormAndCreate(
            'openpayCardForm',
            (res) => {
                restaurar();
                const id = res?.data?.id;
                id ? resolve(id) : reject(new Error('Token de tarjeta inválido'));
            },
            (res) => {
                restaurar();
                const tecnico = res?.data?.description || res?.message || 'Tarjeta rechazada';
                reject(new Error(mensajeParaUsuario(tecnico)));
            },
        );
    });
}

async function agregarPagoTarjeta(body) {
    const tarjeta = validarTarjeta();
    if (!tarjeta.valid) {
        mostrarErroresTarjeta(tarjeta.errores);
        throw new Error(Object.values(tarjeta.errores)[0]);
    }

    campo('cardPaymentSection')?.classList.remove('d-none');
    configurarOpenPay();

    let sesion = sesionDispositivo();
    if (!sesion) {
        await new Promise((r) => setTimeout(r, 400));
        sesion = sesionDispositivo();
    }

    body.token_id = await tokenTarjeta();
    body.device_session_id = sesion || campo('device_session_id')?.value?.trim() || '';

    if (!body.device_session_id) {
        throw new Error('Espera un momento en Tarjeta e intenta de nuevo.');
    }
}

async function confirmarCompra() {
    const pago = metodoPago();
    const datos = leerDatos();
    const validacion = validateCheckout(datos);

    if (!validacion.valid) {
        mostrarErrores(validacion.errors);
        marcarValidos(datos, validacion.errors);
        await avisarErrores(validacion.errors, 'Revisa tus datos');
        return;
    }

    if (pago === 'card' && !openpayListo && !(await cargarOpenPay())) {
        await Swal.fire({ icon: 'error', title: 'Tarjeta no disponible', text: mensajeOpenpay });
        return;
    }

    const totales = calcularTotales();

    if (pago === 'card') {
        const tarjeta = validarTarjeta();
        if (!tarjeta.valid) {
            campo('cardPaymentSection')?.classList.remove('d-none');
            mostrarErroresTarjeta(tarjeta.errores);
            await avisarErrores(tarjeta.errores, 'Datos de tarjeta');
            return;
        }
    }

    if (pago === 'card' && totales.total > MAX_TARJETA) {
        await Swal.fire({
            icon: 'warning',
            title: 'Monto máximo con tarjeta',
            html: `Máximo <strong>${formatPrice(MAX_TARJETA)}</strong> con tarjeta.<br>
                Tu total: <strong>${formatPrice(totales.total)}</strong>.<br>
                Usa <strong>PSE</strong> para montos mayores.`,
        });
        return;
    }

    const respuesta = await Swal.fire({
        title: '¿Confirmar compra?',
        text: pago === 'card' ? 'Se cargará tu tarjeta' : 'Serás redirigido al banco (PSE)',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí, comprar',
    });

    if (!respuesta.isConfirmed) return;

    const boton = campo('confirmPurchase');
    boton.disabled = true;
    showLoader('Procesando pago...', 'Espera un momento.');

    try {
        const idPedido = Date.now();
        const body = {
            metodo_pago: pago,
            id_pedido: idPedido,
            nombre: datos.nombre.trim(),
            apellido: datos.apellidos.trim(),
            email: datos.correo.trim(),
            telefono: datos.celular.trim(),
            direccion: datos.direccion.trim(),
            departamento: datos.departamento,
            ciudad: datos.ciudad,
            total: totales.total,
            iva: totales.iva,
        };

        if (pago === 'card') await agregarPagoTarjeta(body);

        const res = await fetch(PAGO_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
        });

        const resultado = await res.json();
        if (resultado.status !== 'ok') {
            throw new Error(mensajeParaUsuario(resultado.mensaje || 'Error en el pago'));
        }

        sessionStorage.setItem('corotoOrder', JSON.stringify({
            id_pedido: idPedido,
            id_transaccion: resultado.id_transaccion,
            order_id: resultado.order_id,
            metodo_pago: pago,
            createdAt: new Date().toISOString(),
            items: cartService.getCart(),
            ...totales,
            customer: {
                nombre: body.nombre,
                apellido: body.apellido,
                email: body.email,
                telefono: body.telefono,
                direccion: body.direccion,
                departamento: body.departamento,
                ciudad: body.ciudad,
            },
        }));

        cartService.clear();
        window.location.href = resultado.url_pse || resultado.url_3ds || 'success.html';
    } catch (err) {
        hideLoader();
        boton.disabled = false;
        await Swal.fire({
            icon: 'error',
            title: 'Error al procesar el pago',
            text: mensajeParaUsuario(err.message) || 'Intenta de nuevo',
        });
    }
}
