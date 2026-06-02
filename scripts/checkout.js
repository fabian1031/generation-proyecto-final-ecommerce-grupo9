import { cartService } from '../services/cartSevices.js';
import { formatPrice } from '../services/utils.service.js';
import { validateCheckout } from './validations.js';
import { authService, mapUserToCheckoutFields } from '../services/auth.service.js';
import { initLogin } from '../components/login.component.js';
import { showLoader, hideLoader } from '../components/loader.component.js';
import { initUbicacion } from '../services/departamentos-ciudades.js';
import { ordenService } from '../services/orden.service.js';

const PAGO_URL = 'https://payment.coroto.online/payment.php';
const CONFIG_URL = 'https://payment.coroto.online/payment-config.php';
const MAX_TARJETA = 5000000;
const IVA = 0.19;

let openpayListo = false;
let mensajeOpenpay = '';
let usuario = null;

const campo = (id) => document.getElementById(id);

document.addEventListener('DOMContentLoaded', () => {
    if (cartService.getCart().length === 0) {
        window.location.href = 'cart.html';
        return;
    }

    initUbicacion();
    mostrarResumen();
    iniciarEventos();
    cargarOpenPay();
    aplicarDatosUsuario();
});

async function aplicarDatosUsuario() {
    if (!authService.isAuthenticated()) {
        mostrarLogin();
        return;
    }

    usuario = await authService.ensureUserProfile();
    if (usuario) {
        llenarDatos(usuario);
    }
}

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

function mostrarLogin() {
    const contenedor = document.querySelector('.checkout-container');
    if (!contenedor) return;

    contenedor.innerHTML = `
        <div class="alert alert-light border d-flex flex-wrap align-items-center justify-content-between gap-2 mb-3">
            <span class="small mb-0">
                <i class="bi bi-person-circle me-1"></i>
                Inicia sesión para autocompletar tus datos
            </span>
            <button type="button" class="btn btn-sm btn-primary" id="openLogin">
                <i class="bi bi-box-arrow-in-right me-1"></i>Iniciar sesión
            </button>
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
            title: `Bienvenido ${usuario.nombre || 'Usuario'}`,
            text: 'Datos cargados en el formulario',
            timer: 1800,
            showConfirmButton: false,
        });
        modal.remove();
    });

    campo('closeLogin').addEventListener('click', () => modal.remove());
}

function llenarDatos(usuario) {
    const datos = mapUserToCheckoutFields(usuario);

    Object.entries(datos).forEach(([id, valor]) => {
        const input = campo(id);
        if (input != null) input.value = String(valor ?? "");
    });
}

function iniciarEventos() {
    const seccionTarjeta = campo('cardPaymentSection');
    const textoBoton = campo('confirmPurchaseLabel');

    document.querySelectorAll('input[name="metodoPago"]').forEach((radio) => {
        radio.addEventListener('change', async () => {
            const tarjeta = metodoPago() === 'card';
            seccionTarjeta?.classList.toggle('d-none', !tarjeta);
            if (textoBoton) {
                textoBoton.textContent = tarjeta ? 'Pagar con tarjeta' : 'Confirmar compra';
            }
            if (tarjeta) {
                if (!openpayListo) await cargarOpenPay();
                const input = campo('cardNumber');
                if (input?.value) input.value = formatearTarjeta(input.value);
                requestAnimationFrame(sesionDispositivo);
            }
        });
    });

    campo('confirmPurchase')?.addEventListener('click', () => {
        confirmarCompra().catch((err) => {
            Swal.fire({
                icon: 'error',
                title: 'No se pudo continuar',
                text: mensajeParaUsuario(err?.message) || 'Intenta de nuevo.',
            });
        });
    });

    const inputTarjeta = campo('cardNumber');
    if (!inputTarjeta) return;

    const aplicarFormato = () => {
        inputTarjeta.value = formatearTarjeta(inputTarjeta.value);
    };

    inputTarjeta.addEventListener('input', aplicarFormato);
    inputTarjeta.addEventListener('change', aplicarFormato);
    inputTarjeta.addEventListener('paste', () => setTimeout(aplicarFormato, 0));
    setTimeout(aplicarFormato, 300);
    setTimeout(aplicarFormato, 800);

    soloDigitos(campo('cardExpMonth'), 2);
    soloDigitos(campo('cardExpYear'), 2);
    soloDigitos(campo('cardCvv'), 4);
    campo('cardExpMonth')?.addEventListener('blur', normalizarVencimiento);
}

function formatearTarjeta(valor) {
    const digitos = String(valor).replace(/\D/g, '').slice(0, 16);
    return digitos.replace(/(\d{4})(?=\d)/g, '$1 ');
}

function soloDigitos(input, max) {
    if (!input) return;
    input.addEventListener('input', () => {
        input.value = input.value.replace(/\D/g, '').slice(0, max);
    });
}

function normalizarVencimiento() {
    const mesInput = campo('cardExpMonth');
    const anioInput = campo('cardExpYear');
    if (!mesInput || !anioInput) return;

    let mes = mesInput.value.replace(/\D/g, '').slice(0, 2);
    let anio = anioInput.value.replace(/\D/g, '').slice(0, 2);

    if (mes.length === 1) mes = `0${mes}`;
    mesInput.value = mes;
    anioInput.value = anio;
}

function mensajeParaUsuario(texto) {
    const msg = String(texto || '').trim();
    if (!msg) return 'No se pudo procesar el pago. Intenta de nuevo.';

    const reglas = [
        [/expiration_month/i, 'El mes debe tener 2 dígitos (01 a 12).'],
        [/expiration_year/i, 'El año debe tener 2 dígitos (ej: 28).'],
        [/card_number/i, 'Revisa el número de tarjeta.'],
        [/cvv2|cvv/i, 'El CVV debe tener 3 o 4 dígitos.'],
        [/holder_name/i, 'Escribe el nombre del titular como aparece en la tarjeta.'],
        [/amount must be less/i, 'El monto supera el límite permitido con tarjeta. Usa PSE.'],
        [/only allows/i, 'Revisa los datos de la tarjeta.'],
    ];

    for (const [patron, mensaje] of reglas) {
        if (patron.test(msg)) return mensaje;
    }

    if (/[a-z_]+\s+only allows/i.test(msg)) {
        return 'Revisa los datos de la tarjeta e intenta de nuevo.';
    }

    return msg;
}

function validarTarjeta() {
    normalizarVencimiento();

    const errores = {};
    const titular = campo('cardHolder')?.value.trim();
    const numero = campo('cardNumber')?.value.replace(/\D/g, '') || '';
    const mes = campo('cardExpMonth')?.value.replace(/\D/g, '') || '';
    const anio = campo('cardExpYear')?.value.replace(/\D/g, '') || '';
    const cvv = campo('cardCvv')?.value.replace(/\D/g, '') || '';

    if (!titular) errores.cardHolder = 'Ingresa el nombre del titular.';
    if (numero.length < 15 || numero.length > 16) {
        errores.cardNumber = 'Ingresa un número de tarjeta válido (16 dígitos).';
    }
    if (mes.length !== 2 || Number(mes) < 1 || Number(mes) > 12) {
        errores.cardExpMonth = 'Mes inválido. Ejemplo: 01, 06, 12.';
    }
    if (anio.length !== 2) {
        errores.cardExpYear = 'Año inválido. Usa 2 dígitos, por ejemplo 28.';
    }
    if (cvv.length < 3 || cvv.length > 4) {
        errores.cardCvv = 'CVV inválido. Debe tener 3 o 4 dígitos.';
    }

    return { valid: Object.keys(errores).length === 0, errores };
}

function marcarCampoError(input, mensaje) {
    if (!input) return;
    input.classList.add('is-invalid');
    input.classList.remove('is-valid');
    const grupo = input.closest('.input-group');
    grupo?.classList.add('is-invalid');
    const feedback = grupo?.parentElement?.querySelector('.invalid-feedback');
    if (feedback) feedback.textContent = mensaje;
}

function avisarErrores(errores, titulo) {
    const mensaje = Object.values(errores)[0];
    if (!mensaje) return Promise.resolve();
    return Swal.fire({ icon: 'warning', title: titulo, text: mensaje });
}

function mostrarErroresTarjeta(errores) {
    document.querySelectorAll('#openpayCardForm .form-control, #openpayCardForm .input-group').forEach((el) => {
        el.classList.remove('is-invalid', 'is-valid');
    });
    document.querySelectorAll('#openpayCardForm .invalid-feedback').forEach((el) => {
        el.textContent = '';
    });

    let primero = null;
    Object.entries(errores).forEach(([id, mensaje]) => {
        marcarCampoError(campo(id), mensaje);
        if (!primero) primero = campo(id);
    });
    primero?.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

function leerDatos() {
    return {
        nombre: campo('nombre')?.value ?? '',
        apellidos: campo('apellidos')?.value ?? '',
        celular: campo('celular')?.value ?? '',
        correo: campo('correo')?.value ?? '',
        direccion: campo('direccion')?.value ?? '',
        departamento: campo('departamento')?.value ?? '',
        ciudad: campo('ciudad')?.value ?? '',
    };
}

function calcularTotales() {
    const subtotal = cartService.getTotalPrice();
    const iva = Math.round(subtotal * IVA);
    return { subtotal, iva, total: Math.round(subtotal + iva) };
}

function metodoPago() {
    return document.querySelector('input[name="metodoPago"]:checked')?.value === 'card' ? 'card' : 'pse';
}

function mostrarErrores(errores) {
    document.querySelectorAll('#checkoutForm .form-control, #checkoutForm .form-select, #checkoutForm .input-group').forEach((el) => {
        el.classList.remove('is-invalid', 'is-valid');
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
    } catch { }

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
        console.log('PASO 1 - respuesta recibida');
        if (resultado.status !== 'ok') {
            throw new Error(mensajeParaUsuario(resultado.mensaje || 'Error en el pago'));
            console.log('PASO 2 - antes de guardar');
        }

        console.log('RESPUESTA OPENPAY', resultado);

        console.log('GUARDANDO ORDER', {
            id_pedido: idPedido,
            items: cartService.getCart()
        });
        localStorage.setItem('corotoOrder', JSON.stringify({
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
        console.log('PASO 3 - después de guardar');

        console.log(
            'ORDER GUARDADA',
            localStorage.getItem('corotoOrder')
        );

        const carrito = [...cartService.getCart()];
        console.log('PASO 4 - antes de redirigir');
        const orden = await ordenService.create({
            estadoPago: "NO_PAGO",
            estado: "PENDIENTE",
            direccionEnvio: datos.direccion,
            ciudadEnvio: datos.ciudad,
            usuarioId: usuario?.userId ?? null
        });

        console.log("ORDEN CREADA", orden);
        for (const item of carrito) {

            console.log("CREANDO DETALLE", {
                ordenId: orden.id,
                productoId: item.id,
                cantidad: item.quantity,
                precioUnitario: item.price
            });

            const detalle = await ordenService.createItem({
                ordenId: orden.id,
                productoId: item.id,
                cantidad: item.quantity,
                precioUnitario: Number(item.price) 
            });

            console.log("DETALLE CREADO", detalle);
        }
        localStorage.setItem('corotoOrder', JSON.stringify({
            id_pedido: idPedido,
            id_transaccion: resultado.id_transaccion,
            order_id: resultado.order_id,
            metodo_pago: pago,
            createdAt: new Date().toISOString(),
            items: carrito,
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
            backendOrderId: orden.id
        }));
        console.log(
            "ORDER GUARDADA",
            JSON.parse(localStorage.getItem('corotoOrder'))
        );
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
