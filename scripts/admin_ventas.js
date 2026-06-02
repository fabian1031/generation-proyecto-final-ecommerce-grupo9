// ─── admin_ventas.js ─────────────────────────────────────────────────────────
// Fuente de datos: localStorage bajo la clave 'corotoSalesHistory'
// Escrito por: success.js cuando una compra se confirma exitosamente
// ─────────────────────────────────────────────────────────────────────────────

import { ordenService } from '../services/orden.service.js';

const SALES_HISTORY_KEY = 'corotoSalesHistory';

// Pedidos cargados desde el backend (si están disponibles)
let remoteSales = [];

// Instancias Chart.js activas (para destruirlas antes de redibujar)
let chartDay   = null;
let chartWeek  = null;
let chartMonth = null;

// Rango activo (null = sin filtro)
let activeFrom = null;
let activeTo   = null;

// ─── Utilidades ──────────────────────────────────────────────────────────────

function getSalesHistory() {
    // Preferir pedidos remotos si ya fueron cargados
    if (Array.isArray(remoteSales) && remoteSales.length > 0) return remoteSales;

    try {
        const raw = localStorage.getItem(SALES_HISTORY_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch {
        return [];
    }
}

async function loadRemoteSales() {
    try {
        const [pedidos, detalles] = await Promise.all([
            ordenService.getAll(),
            ordenService.getAllItems()
        ]);

        remoteSales = pedidos.map((pedido) => ({
            ...pedido,
            items: detalles.filter(
                (item) => Number(item.ordenId) === Number(pedido.id)
            )
        }));

        console.log('Pedidos cargados:', remoteSales);

        return true;
    } catch (err) {
        console.error('No se pudo obtener pedidos remotos:', err);
        remoteSales = [];
        return false;
    }
}

// Recargar pedidos manualmente (invocado por el botón en la vista)
async function reloadOrders() {
    const btn = document.getElementById('btnReloadOrders');
    if (!btn) return;

    const original = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span> Cargando...';

    try {
        const ok = await loadRemoteSales();
        render();

        if (ok) {
            Swal.fire({ icon: 'success', title: 'Pedidos recargados', timer: 1200, showConfirmButton: false });
        } else {
            Swal.fire({ icon: 'warning', title: 'No se encontraron pedidos remotos', timer: 1400, showConfirmButton: false });
        }
    } catch (err) {
        Swal.fire({ icon: 'error', title: 'Error al recargar pedidos', text: String(err) });
    } finally {
        btn.disabled = false;
        btn.innerHTML = original;
    }
}


function formatPrice(value) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0,
    }).format(value);
}

function toDateStr(isoDate) {
    // Retorna 'YYYY-MM-DD' en zona local
    return new Date(isoDate).toLocaleDateString('en-CA');
}

function isoToLocalDate(isoDate) {
    return new Date(isoDate);
}

function getWeekLabel(isoDate) {
    const d = new Date(isoDate);
    // Inicio de semana (lunes)
    const day   = d.getDay() === 0 ? 6 : d.getDay() - 1;
    const start = new Date(d);
    start.setDate(d.getDate() - day);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);

    const fmt = (dt) => dt.toLocaleDateString('es-CO', { day: '2-digit', month: 'short' });
    return `${fmt(start)} - ${fmt(end)}`;
}

function getMonthLabel(isoDate) {
    return new Date(isoDate).toLocaleDateString('es-CO', { month: 'short', year: 'numeric' });
}

function formatDate(isoDate) {
    return new Date(isoDate).toLocaleString('es-CO', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

function capitalize(text) {
    return String(text)
        .toLowerCase()
        .replace(/(^|\s)\S/g, (l) => l.toUpperCase());
}

// ─── Filtrado ─────────────────────────────────────────────────────────────────

function filterSales(sales) {
    if (!activeFrom && !activeTo) return sales;

    return sales.filter((s) => {
        const d = toDateStr(s.fechaPedido);
        if (activeFrom && d < activeFrom) return false;
        if (activeTo   && d > activeTo)   return false;
        return true;
    });
}

// Setea acceso rápido (hoy / semana / mes / todo)
function setQuickFilter(period) {
    const today = new Date();
    const toStr = (dt) => dt.toLocaleDateString('en-CA');

    if (period === 'today') {
        activeFrom = toStr(today);
        activeTo   = toStr(today);
    } else if (period === 'week') {
        const start = new Date(today);
        const day   = today.getDay() === 0 ? 6 : today.getDay() - 1;
        start.setDate(today.getDate() - day);
        activeFrom = toStr(start);
        activeTo   = toStr(today);
    } else if (period === 'month') {
        const start = new Date(today.getFullYear(), today.getMonth(), 1);
        activeFrom  = toStr(start);
        activeTo    = toStr(today);
    } else {
        activeFrom = null;
        activeTo   = null;
    }

    syncDateInputs();
    render();
}

function applyFilter() {
    activeFrom = document.getElementById('dateFrom').value || null;
    activeTo   = document.getElementById('dateTo').value   || null;
    render();
}

function clearFilter() {
    activeFrom = null;
    activeTo   = null;
    syncDateInputs();
    render();
}

function syncDateInputs() {
    document.getElementById('dateFrom').value = activeFrom || '';
    document.getElementById('dateTo').value   = activeTo   || '';
}

// ─── Contadores ───────────────────────────────────────────────────────────────

function renderCounters(sales) {
    const orders = sales.length;

    const total = sales.reduce(
        (sum, s) => sum + Number(s.total || 0),
        0
    );

    const subtotal = total / 1.19;
    const iva = total - subtotal;

    document.getElementById('counterOrders').textContent =
        orders;

    document.getElementById('counterSubtotal').textContent =
        formatPrice(subtotal);

    document.getElementById('counterIva').textContent =
        formatPrice(iva);

    document.getElementById('counterTotal').textContent =
        formatPrice(total);

    document.getElementById('badgeCount').textContent =
        `${orders} pedido${orders !== 1 ? 's' : ''}`;
}

// ─── Charts ───────────────────────────────────────────────────────────────────

const CHART_COLORS = {
    bar:    'rgba(33, 37, 41, 0.8)',
    border: 'rgba(33, 37, 41, 1)',
};

function buildGrouped(sales, keyFn) {
    const map = {};
    sales.forEach((s) => {
        const key = keyFn(s.fechaPedido)
        map[key] = (map[key] || 0) + (s.total || 0);
    });
    return map;
}

function destroyChart(instance) {
    if (instance) instance.destroy();
}

function createBarChart(canvasId, labels, data, label) {
    const ctx = document.getElementById(canvasId).getContext('2d');
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label,
                data,
                backgroundColor: CHART_COLORS.bar,
                borderColor:     CHART_COLORS.border,
                borderWidth:     1,
                borderRadius:    4,
            }],
        },
        options: {
            responsive: true,
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: (ctx) => ` ${formatPrice(ctx.parsed.y)}`,
                    },
                },
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: (v) => formatPrice(v),
                        font: { size: 10 },
                    },
                    grid: { color: 'rgba(0,0,0,0.05)' },
                },
                x: {
                    ticks: { font: { size: 10 } },
                    grid: { display: false },
                },
            },
        },
    });
}

function renderCharts(sales) {
    // ── Chart día ──
    const byDay  = buildGrouped(sales, toDateStr);
    const dDays  = Object.keys(byDay).sort();
    const dData  = dDays.map((k) => byDay[k]);

    destroyChart(chartDay);
    chartDay = createBarChart(
        'chartDay',
        dDays.map((d) => new Date(d + 'T00:00:00').toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })),
        dData,
        'Total por día',
    );

    // ── Chart semana ──
    const byWeek = buildGrouped(sales, getWeekLabel);
    const wKeys  = Object.keys(byWeek);
    const wData  = wKeys.map((k) => byWeek[k]);

    destroyChart(chartWeek);
    chartWeek = createBarChart('chartWeek', wKeys, wData, 'Total por semana');

    // ── Chart mes ──
    const byMonth = buildGrouped(sales, getMonthLabel);
    const mKeys   = Object.keys(byMonth);
    const mData   = mKeys.map((k) => byMonth[k]);

    destroyChart(chartMonth);
    chartMonth = createBarChart('chartMonth', mKeys, mData, 'Total por mes');
}

// ─── Tabla de pedidos ─────────────────────────────────────────────────────────

function renderTable(sales) {
    const tbody = document.getElementById('ordersTableBody');

    if (!sales || sales.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted py-4">
                    Sin pedidos registrados
                </td>
            </tr>
        `;
        return;
    }

    const sorted = [...sales].sort(
        (a, b) => new Date(b.fechaPedido) - new Date(a.fechaPedido)
    );

    tbody.innerHTML = sorted.map((s) => `
        <tr>
            <td>#${s.id}</td>
            <td>${formatDate(s.fechaPedido)}</td>
            <td>${s.usuarioNombre ?? 'Sin nombre'}</td>
            <td>${s.ciudadEnvio ?? 'N/A'}</td>
            <td class="text-end fw-semibold">
                ${formatPrice(s.total)}
            </td>
            <td class="text-center">
                <button
                    class="btn btn-sm btn-outline-dark py-0 px-2"
                    onclick="openOrderDetail('${s.id}')">
                    <i class="bi bi-eye"></i>
                </button>
            </td>
        </tr>
    `).join('');
}

// ─── Offcanvas detalle ────────────────────────────────────────────────────────
function openOrderDetail(idPedido) {
    const history = getSalesHistory();

    const order = history.find(
        (s) => String(s.id) === String(idPedido)
    );

    if (!order) return;

    const subtotal = Number(order.total) / 1.19;
    const iva = Number(order.total) - subtotal;

    document.getElementById('offcanvasOrderTitle').textContent =
        `Pedido #${order.id}`;

    document.getElementById('offcanvasOrderBody').innerHTML = `
        <div class="mb-3">
            <p class="text-muted small mb-1">Cliente</p>
            <p class="fw-semibold mb-0">
                ${order.usuarioNombre}
            </p>
        </div>

        <div class="mb-3">
            <p class="text-muted small mb-1">Fecha</p>
            <p class="mb-0">
                ${formatDate(order.fechaPedido)}
            </p>
        </div>

        <div class="mb-3">
            <p class="text-muted small mb-1">Dirección</p>
            <p class="mb-0">
                ${order.direccionEnvio}
            </p>
            <p class="small text-muted mb-0">
                ${order.ciudadEnvio}
            </p>
        </div>

        <div class="mb-3">
            <p class="text-muted small mb-1">Estado</p>
            <p class="mb-0">
                ${order.estado}
            </p>
            <p class="small text-muted">
                Pago: ${order.estadoPago}
            </p>
        </div>

        <hr>

        <p class="text-muted small mb-2">
            Productos
        </p>

        ${
            order.items?.length
                ? order.items.map(item => `
                    <div class="d-flex justify-content-between align-items-start small mb-2">
                        <div>
                            <span class="fw-semibold d-block">
                                ${item.productoNombre}
                            </span>

                            <span class="text-muted">
                                Cantidad: ${item.cantidad}
                            </span>
                        </div>

                        <span>
                            ${formatPrice(
                                item.precioUnitario * item.cantidad
                            )}
                        </span>
                    </div>
                `).join('')
                : '<p class="text-muted">Sin productos</p>'
        }

        <hr>

        <div class="d-flex justify-content-between small mb-1">
            <span class="text-muted">
                Subtotal
            </span>

            <span>
                ${formatPrice(subtotal)}
            </span>
        </div>

        <div class="d-flex justify-content-between small mb-1">
            <span class="text-muted">
                IVA
            </span>

            <span>
                ${formatPrice(iva)}
            </span>
        </div>

        <div class="d-flex justify-content-between fw-bold mt-2">
            <span>Total</span>

            <span>
                ${formatPrice(order.total)}
            </span>
        </div>
    `;

    const offcanvas = new bootstrap.Offcanvas(
        document.getElementById('offcanvasOrder')
    );

    offcanvas.show();
}
// ─── Limpiar historial ────────────────────────────────────────────────────────

async function clearSalesHistory() {
    const result = await Swal.fire({
        title: '¿Limpiar historial?',
        text: 'Se eliminarán todas las ventas guardadas. Esta acción no se puede deshacer.',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor:  '#6c757d',
        confirmButtonText:  'Sí, limpiar',
        cancelButtonText:   'Cancelar',
    });

    if (!result.isConfirmed) return;

    localStorage.removeItem(SALES_HISTORY_KEY);
    render();

    Swal.fire({
        icon:              'success',
        title:             'Historial limpiado',
        timer:             1500,
        showConfirmButton: false,
    });
}

// ─── Render principal ─────────────────────────────────────────────────────────

function render() {
    const all     = getSalesHistory();
    const visible = filterSales(all);

    renderCounters(visible);
    renderCharts(visible);
    renderTable(visible);
}

// ─── Exponer funciones globales (llamadas desde HTML) ─────────────────────────
window.applyFilter       = applyFilter;
window.clearFilter       = clearFilter;
window.setQuickFilter    = setQuickFilter;
window.openOrderDetail   = openOrderDetail;
window.clearSalesHistory = clearSalesHistory;

// ─── Init ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
    await loadRemoteSales();
    setQuickFilter('all');
});