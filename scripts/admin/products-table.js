/**
 * DataTable de productos: paginación, búsqueda, orden, exportación y columnas.
 * Requiere jQuery y DataTables (+ extensiones) cargados en la página.
 */

/** @type {import('jquery')} */
const $ = window.jQuery;

let dataTable = null;
let statusFilter = "all";

/** Índices de columnas (deben coincidir con getColumnDefinitions) */
const COL = {
    ID: 0,
    IMAGE: 1,
    NOMBRE: 2,
    MARCA: 3,
    CATEGORIA: 4,
    PRECIO: 5,
    STOCK: 6,
    ESTADO: 7,
    DESCRIPCION: 8,
    ACCIONES: 9,
};

const FILTER_PLACEHOLDERS = {
    [COL.ID]: "ID…",
    [COL.NOMBRE]: "Nombre…",
    [COL.MARCA]: "Marca…",
    [COL.CATEGORIA]: "Categoría…",
    [COL.PRECIO]: "Precio…",
    [COL.STOCK]: "Stock…",
    [COL.ESTADO]: "Estado…",
};

/** Callbacks registrados desde el orquestador principal */
let onEdit = () => {};
let onToggleActive = () => {};

const priceFormatter = new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
});

/**
 * Registra manejadores de acciones por fila.
 * @param {{ onEdit: (product) => void, onToggleActive: (product) => void }} handlers
 */
export function setTableActionHandlers(handlers) {
    onEdit = handlers.onEdit ?? onEdit;
    onToggleActive = handlers.onToggleActive ?? onToggleActive;
}

/**
 * Inicializa o reinicializa la DataTable con el dataset completo.
 * @param {object[]} products
 */
export function initProductsTable(products) {
    if (!$ || !$.fn.DataTable) {
        console.error("DataTables no está disponible. Verifica los scripts CDN.");
        return;
    }

    destroyProductsTable();

    const $table = $("#productsTable");
    const rows = mapProductsToRows(products);

    dataTable = $table.DataTable({
        data: rows,
        columns: getColumnDefinitions(),
        order: [[0, "asc"]],
        pageLength: 10,
        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Todos"]],
        deferRender: true,
        stateSave: true,
        stateDuration: 60 * 60,
        responsive: {
            /* El control (+) va en Acciones, no en ID, para que ID siempre muestre su valor */
            details: {
                type: "column",
                target: COL.ACCIONES,
            },
            breakpoints: [
                { name: "desktop", width: Infinity },
                { name: "tablet", width: 1024 },
                { name: "mobile-l", width: 768 },
                { name: "mobile-p", width: 480 },
            ],
        },
        /* DataTables 2: usar layout (dom + layout son incompatibles; dom ocultaba los botones) */
        layout: {
            top1Start: "pageLength",
            topEnd: {
                search: {
                    placeholder: "Buscar en todos los campos…",
                },
            },
            bottomStart: "info",
            bottomEnd: "paging",
        },
        orderCellsTop: true,
        /* Botones ocultos: la UI visible usa dropdowns Bootstrap (evita saltos del overlay DT) */
        buttons: [
            {
                extend: "csv",
                className: "d-none buttons-export-csv",
                exportOptions: { columns: ":visible:not(.no-export)" },
            },
            {
                extend: "excel",
                className: "d-none buttons-export-excel",
                exportOptions: { columns: ":visible:not(.no-export)" },
            },
            {
                extend: "pdf",
                className: "d-none buttons-export-pdf",
                exportOptions: { columns: ":visible:not(.no-export)" },
            },
            {
                extend: "print",
                className: "d-none buttons-export-print",
                exportOptions: { columns: ":visible:not(.no-export)" },
            },
        ],
        language: {
            url: "https://cdn.datatables.net/plug-ins/2.2.2/i18n/es-ES.json",
            emptyTable: "No hay productos para mostrar",
            zeroRecords: "No se encontraron coincidencias",
            lengthMenu: "Mostrar _MENU_",
            info: "Mostrando _START_ a _END_ de _TOTAL_ productos",
            infoEmpty: "Sin productos",
            infoFiltered: "(filtrado de _MAX_ en total)",
            paginate: {
                first: "«",
                last: "»",
                next: "›",
                previous: "‹",
            },
        },
        initComplete() {
            const api = this.api();
            setupColumnFilters(api);
            setupNameFilter(api);
            bindRowActionDelegation();
            mountControlsToToolbar(api);
            setupShopifyToolbar(api);
            ensureRequiredColumnsVisible(api);
            recalcResponsive(api);
            bindResponsiveEvents();
        },
        stateLoadParams(settings, data) {
            if (data.columns?.[COL.ID]) {
                data.columns[COL.ID].visible = true;
            }
            /* Siempre iniciar mostrando 10 registros por página */
            if (typeof data.length === "number") {
                data.length = 10;
            }
        },
    });

    applyStatusFilter();
}

/**
 * Actualiza filas sin destruir preferencias de usuario (página, orden).
 * @param {object[]} products
 */
export function refreshProductsTable(products) {
    if (!dataTable) {
        initProductsTable(products);
        return;
    }

    dataTable.clear();
    dataTable.rows.add(mapProductsToRows(products));
    dataTable.draw(false);
    applyStatusFilter();
    ensureRequiredColumnsVisible(dataTable);
    syncFilterCellsVisibility(dataTable);
    recalcResponsive(dataTable);
}

export function destroyProductsTable() {
    if (dataTable) {
        dataTable.destroy();
        dataTable = null;
    }
    $("#productsTable thead .filters-row").remove();
    $("#productsTable tbody").empty();
}

/**
 * Filtro rápido activos / inactivos / todos (sobre columna estado).
 * @param {"all"|"active"|"inactive"} type
 */
export function setStatusFilter(type) {
    statusFilter = type;

    document.querySelectorAll(".shopify-filter-pill[data-filter]").forEach((btn) => {
        const isActive = btn.dataset.filter === type;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
    });

    applyStatusFilter();
}

export function getStatusFilter() {
    return statusFilter;
}

function applyStatusFilter() {
    if (!dataTable) return;

    const column = dataTable.column(7);
    if (statusFilter === "all") {
        column.search("").draw();
        return;
    }
    const term = statusFilter === "active" ? "^activo$" : "^inactivo$";
    column.search(term, true, false).draw();
}

function getColumnDefinitions() {
    return [
        {
            title: "ID",
            data: "id",
            className: "text-nowrap col-id col-always-visible",
            responsivePriority: 1,
        },
        {
            title: "Imagen",
            data: "imageHtml",
            orderable: false,
            searchable: false,
            className: "no-export text-center",
            width: "56px",
            responsivePriority: 8,
        },
        {
            title: "Nombre",
            data: "nombrePlain",
            responsivePriority: 2,
            render(data, type, row) {
                if (type === "display") return row.nombre;
                return data;
            },
        },
        { title: "Marca", data: "marca", defaultContent: "—", responsivePriority: 7 },
        { title: "Categoría", data: "categoria", responsivePriority: 6 },
        {
            title: "Precio",
            data: "precioSort",
            responsivePriority: 5,
            render: (data, type, row) => {
                if (type === "sort" || type === "filter") return data;
                return row.precioDisplay;
            },
        },
        {
            title: "Stock",
            data: "stock",
            className: "text-center",
            responsivePriority: 6,
        },
        {
            title: "Estado",
            data: "estadoKey",
            className: "text-center",
            responsivePriority: 3,
            render(data, type) {
                if (type !== "display") return data;
                const isActive = data === "activo";
                return isActive
                    ? '<span class="badge badge-admin-active">Activo</span>'
                    : '<span class="badge badge-admin-inactive">Inactivo</span>';
            },
        },
        {
            title: "Descripción",
            data: "descripcion",
            visible: false,
            responsivePriority: 10000,
        },
        {
            title: "Acciones",
            data: "actionsHtml",
            orderable: false,
            searchable: false,
            className: "no-export no-colvis text-nowrap text-center col-actions",
            width: "100px",
            responsivePriority: 4,
        },
    ];
}

/**
 * Segunda fila del thead: inputs de filtro por columna.
 * @param {import('datatables.net').Api} api
 */
function setupColumnFilters(api) {
    const $thead = $("#productsTable thead");
    const filterRow = $('<tr class="filters-row"></tr>');

    api.columns().every(function (colIdx) {
        const column = this;
        const def = column.settings()[0].aoColumns[colIdx];
        const th = $("<th></th>").attr("data-dt-column", colIdx);

        if (def.bSearchable === false || colIdx === COL.IMAGE || colIdx === COL.ACCIONES) {
            th.addClass("col-filter-empty");
            filterRow.append(th);
            return;
        }

        const placeholder = FILTER_PLACEHOLDERS[colIdx] || "Filtrar…";
        const input = $(
            `<input type="text" class="shopify-filter-input shopify-filter-input--col" placeholder="${placeholder}" autocomplete="off" aria-label="Filtrar ${placeholder}" />`
        );
        input.on("keyup change clear", function () {
            if (column.search() !== this.value) {
                column.search(this.value).draw();
            }
            if (colIdx === COL.NOMBRE) {
                syncNameFilterInputs(this.value);
            }
        });
        th.append(input);
        if (colIdx === COL.NOMBRE) {
            th.addClass("col-filter-nombre");
        }
        filterRow.append(th);
    });

    $thead.append(filterRow);
    syncFilterCellsVisibility(api);

    if (!window._colVisSyncBound) {
        window._colVisSyncBound = true;
        $("#productsTable").on("column-visibility.dt", () => {
            if (dataTable) syncFilterCellsVisibility(dataTable);
        });
    }

}

/**
 * Filtro por nombre en la barra superior (siempre visible, también en móvil).
 * @param {import('datatables.net').Api} api
 */
function setupNameFilter(api) {
    const toolbarInput = document.getElementById("filterByName");
    if (!toolbarInput) return;

    const applyNameSearch = (value) => {
        const term = value.trim();
        api.column(COL.NOMBRE).search(term).draw();
        syncNameFilterInputs(term, toolbarInput);
    };

    if (!toolbarInput.dataset.bound) {
        toolbarInput.dataset.bound = "true";
        toolbarInput.addEventListener("input", () => applyNameSearch(toolbarInput.value));
        toolbarInput.addEventListener("search", () => applyNameSearch(toolbarInput.value));
    }
}

/** Sincroniza el input de nombre del toolbar con el de la fila de filtros */
function syncNameFilterInputs(value, skipInput = null) {
    if (skipInput !== document.getElementById("filterByName")) {
        const toolbar = document.getElementById("filterByName");
        if (toolbar) toolbar.value = value;
    }

    const colInput = document.querySelector(
        `#productsTable thead tr.filters-row th[data-dt-column="${COL.NOMBRE}"] input`
    );
    if (colInput && colInput !== skipInput) {
        colInput.value = value;
    }
}

/**
 * Coloca botones, búsqueda y selector de filas en la barra superior personalizada.
 * @param {import('datatables.net').Api} api
 */
function mountControlsToToolbar(api) {
    const $wrapper = $("#productsTable_wrapper");

    const $searchSlot = $("#productsTableToolbarSearch");
    const $search = $wrapper.find(".dt-search").first();
    if ($searchSlot.length && $search.length) {
        $searchSlot.empty().append($search);
    }

    const $lengthSlot = $("#productsTableToolbarLength");
    const $length = $wrapper.find(".dt-length").first();
    if ($lengthSlot.length && $length.length) {
        $lengthSlot.empty().append($length);
    }

    /* Ocultar filas superiores vacías del layout (controles ya en la barra custom) */
    $wrapper.children(".dt-layout-row, .row").each(function () {
        const $row = $(this);
        if ($row.find("table").length) return;
        if ($row.find(".dt-paging, .dt-info, .dataTables_paginate, .dataTables_info").length) return;
        $row.addClass("d-none");
    });
}

/**
 * Dropdowns Bootstrap para exportar y columnas (estilo Shopify, sin overlay DT).
 * @param {import('datatables.net').Api} api
 */
function setupShopifyToolbar(api) {
    const toolbar = document.querySelector(".admin-dt-toolbar-actions");

    if (toolbar && !toolbar.dataset.shopifyBound) {
        toolbar.dataset.shopifyBound = "true";

        const exportMap = {
            csv: ".buttons-export-csv",
            excel: ".buttons-export-excel",
            pdf: ".buttons-export-pdf",
            print: ".buttons-export-print",
        };

        document.querySelectorAll("[data-export]").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const selector = exportMap[btn.dataset.export];
                if (selector && api.button) {
                    api.button(selector).trigger();
                }
            });
        });
    }

    setupColumnVisibilityMenu(api);
}

/** Menú de columnas visibles con checkboxes */
function setupColumnVisibilityMenu(api) {
    const menu = document.getElementById("colvisMenu");
    if (!menu) return;

    menu.innerHTML = "";
    const headers = ["ID", "Imagen", "Nombre", "Marca", "Categoría", "Precio", "Stock", "Estado", "Descripción", "Acciones"];

    api.columns().every(function (colIdx) {
        const column = this;
        const def = column.settings()[0].aoColumns[colIdx];
        if (def.className?.includes("no-colvis")) return;

        const isLocked = def.className?.includes("col-always-visible");
        const title = headers[colIdx] || `Columna ${colIdx}`;
        const li = document.createElement("li");
        li.innerHTML = `
            <label class="dropdown-item shopify-colvis-item ${isLocked ? "shopify-colvis-item--locked" : ""}">
                <input type="checkbox" class="form-check-input m-0" ${column.visible() ? "checked" : ""} ${isLocked ? "disabled" : ""}>
                <span>${title}${isLocked ? " (siempre visible)" : ""}</span>
            </label>`;

        const checkbox = li.querySelector("input");
        if (isLocked) {
            menu.appendChild(li);
            return;
        }

        checkbox.addEventListener("change", () => {
            const visible = checkbox.checked;
            column.visible(visible);
            if (!visible) {
                column.search("");
                const filterInput = document.querySelector(
                    `#productsTable thead tr.filters-row th[data-dt-column="${colIdx}"] input`
                );
                if (filterInput) filterInput.value = "";
            }
            syncFilterCellsVisibility(api);
            recalcResponsive(api);
        });

        li.querySelector("label").addEventListener("click", (e) => e.stopPropagation());
        menu.appendChild(li);
    });
}

/**
 * Oculta o muestra la celda de filtro según la visibilidad de la columna.
 * La fila .filters-row no la controla DataTables automáticamente.
 * @param {import('datatables.net').Api} api
 */
function syncFilterCellsVisibility(api) {
    api.columns().every(function (colIdx) {
        const visible = this.visible();
        const cell = document.querySelector(
            `#productsTable thead tr.filters-row th[data-dt-column="${colIdx}"]`
        );
        if (!cell) return;

        cell.classList.toggle("col-filter-hidden", !visible);
        cell.style.display = visible ? "" : "none";
    });
}

/** ID y otras columnas obligatorias siempre visibles */
function ensureRequiredColumnsVisible(api) {
    api.column(COL.ID).visible(true);
}

/** Recalcula columnas visibles según ancho (móvil / tablet / desktop) */
function recalcResponsive(api) {
    requestAnimationFrame(() => {
        if (window.matchMedia("(min-width: 768px)").matches) {
            api.columns.adjust();
        }
        if (api.responsive && typeof api.responsive.recalc === "function") {
            api.responsive.recalc();
        }
    });
}

/** Reajusta al cambiar tamaño de ventana u orientación */
function bindResponsiveEvents() {
    $("#productsTable").off(".adminResponsive");
    $("#productsTable").on(
        "responsive-resize.dt.adminResponsive column-visibility.dt.adminResponsive",
        () => {
            if (!dataTable) return;
            syncFilterCellsVisibility(dataTable);
            recalcResponsive(dataTable);
        }
    );

    if (window._adminProductsResponsiveBound) return;
    window._adminProductsResponsiveBound = true;

    let resizeTimer;
    const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            if (dataTable) recalcResponsive(dataTable);
        }, 160);
    };

    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
}

function bindRowActionDelegation() {
    const tbody = document.querySelector("#productsTable tbody");
    if (!tbody || tbody.dataset.bound === "true") return;
    tbody.dataset.bound = "true";

    tbody.addEventListener("click", (e) => {
        const editBtn = e.target.closest("[data-action='edit']");
        const toggleBtn = e.target.closest("[data-action='toggle']");

        if (!editBtn && !toggleBtn) return;

        e.preventDefault();
        e.stopPropagation();

        const id = (editBtn || toggleBtn).dataset.id;
        const product = findProductById(id);
        if (!product) return;

        if (editBtn) onEdit(product);
        if (toggleBtn) onToggleActive(product);
    });
}

/** Referencia al dataset en memoria (inyectada desde fuera) */
let productLookup = [];

export function setProductLookup(products) {
    productLookup = products;
}

function findProductById(id) {
    return productLookup.find((p) => String(p.id) === String(id));
}

function mapProductsToRows(products) {
    return products.map((p) => {
        const isActive = p.activo !== false;
        const img = p.imageUrl
            ? `<img src="${escapeAttr(p.imageUrl)}" alt="" class="product-thumb" loading="lazy" onerror="this.classList.add('d-none')">`
            : '<span class="text-muted small">—</span>';

        return {
            id: p.id,
            imageHtml: img,
            nombre: escapeHtml(p.nombre || ""),
            nombrePlain: p.nombre || "",
            marca: escapeHtml(p.brand || "—"),
            categoria: escapeHtml(p.categoria || ""),
            precioSort: Number(p.precio) || 0,
            precioDisplay: priceFormatter.format(Number(p.precio) || 0),
            stock: Number(p.cantidad) || 0,
            estadoKey: isActive ? "activo" : "inactivo",
            descripcion: escapeHtml(p.descripcion || ""),
            actionsHtml: buildActionsHtml(p, isActive),
            _raw: p,
        };
    });
}

function buildActionsHtml(p, isActive) {
    const id = escapeAttr(p.id);
    return `
        <div class="btn-group btn-group-sm" role="group" aria-label="Acciones producto ${id}">
            <button type="button" class="btn btn-sm btn-admin-action-edit" data-action="edit" data-id="${id}" title="Editar">
                <i class="bi bi-pencil-square"></i>
            </button>
            <button type="button" class="btn btn-sm btn-admin-action-${isActive ? "delete" : "restore"}" data-action="toggle" data-id="${id}" title="${isActive ? "Desactivar" : "Reactivar"}">
                <i class="bi bi-${isActive ? "trash" : "arrow-counterclockwise"}"></i>
            </button>
        </div>`;
}

function escapeHtml(text) {
    const div = document.createElement("div");
    div.textContent = String(text ?? "");
    return div.innerHTML;
}

function escapeAttr(text) {
    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/"/g, "&quot;")
        .replace(/</g, "&lt;");
}
