/**
 * DataTable de usuarios — misma lógica y estilos que productos.
 */

const $ = window.jQuery;

const TABLE_ID = "usersTable";
const TABLE_SEL = `#${TABLE_ID}`;

let dataTable = null;
let statusFilter = "all";

const COL = {
    ID: 0,
    NOMBRE: 1,
    APELLIDO: 2,
    EMAIL: 3,
    ROL: 4,
    ESTADO: 5,
    ACCIONES: 6,
};

const FILTER_PLACEHOLDERS = {
    [COL.ID]: "ID…",
    [COL.NOMBRE]: "Nombre…",
    [COL.APELLIDO]: "Apellido…",
    [COL.EMAIL]: "Email…",
    [COL.ROL]: "Rol…",
    [COL.ESTADO]: "Estado…",
};

const COLVIS_HEADERS = ["ID", "Nombre", "Apellido", "Email", "Rol", "Estado", "Acciones"];

let onEdit = () => {};
let onToggleActive = () => {};
let userLookup = [];

export function setTableActionHandlers(handlers) {
    onEdit = handlers.onEdit ?? onEdit;
    onToggleActive = handlers.onToggleActive ?? onToggleActive;
}

export function setUserLookup(users) {
    userLookup = users;
}

export function initUsersTable(users) {
    if (!$ || !$.fn.DataTable) {
        console.error("DataTables no está disponible.");
        return;
    }

    destroyUsersTable();

    dataTable = $(TABLE_SEL).DataTable({
        data: mapUsersToRows(users),
        columns: getColumnDefinitions(),
        order: [[COL.ID, "asc"]],
        pageLength: 10,
        lengthMenu: [[10, 25, 50, 100, -1], [10, 25, 50, 100, "Todos"]],
        deferRender: true,
        stateSave: true,
        stateDuration: 60 * 60,
        responsive: {
            details: { type: "column", target: COL.ACCIONES },
            breakpoints: [
                { name: "desktop", width: Infinity },
                { name: "tablet", width: 1024 },
                { name: "mobile-l", width: 768 },
                { name: "mobile-p", width: 480 },
            ],
        },
        layout: {
            top1Start: "pageLength",
            topEnd: { search: { placeholder: "Buscar en todos los campos…" } },
            bottomStart: "info",
            bottomEnd: "paging",
        },
        orderCellsTop: true,
        buttons: [
            { extend: "csv", className: "d-none buttons-export-csv", exportOptions: { columns: ":visible:not(.no-export)" } },
            { extend: "excel", className: "d-none buttons-export-excel", exportOptions: { columns: ":visible:not(.no-export)" } },
            { extend: "pdf", className: "d-none buttons-export-pdf", exportOptions: { columns: ":visible:not(.no-export)" } },
            { extend: "print", className: "d-none buttons-export-print", exportOptions: { columns: ":visible:not(.no-export)" } },
        ],
        language: {
            url: "https://cdn.datatables.net/plug-ins/2.2.2/i18n/es-ES.json",
            emptyTable: "No hay usuarios para mostrar",
            zeroRecords: "No se encontraron coincidencias",
            lengthMenu: "Mostrar _MENU_",
            info: "Mostrando _START_ a _END_ de _TOTAL_ usuarios",
            infoEmpty: "Sin usuarios",
            infoFiltered: "(filtrado de _MAX_ en total)",
            paginate: { first: "«", last: "»", next: "›", previous: "‹" },
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
        stateLoadParams(_settings, data) {
            if (data.columns?.[COL.ID]) data.columns[COL.ID].visible = true;
            if (typeof data.length === "number") data.length = 10;
        },
    });

    applyStatusFilter();
}

export function refreshUsersTable(users) {
    if (!dataTable) {
        initUsersTable(users);
        return;
    }
    dataTable.clear();
    dataTable.rows.add(mapUsersToRows(users));
    dataTable.draw(false);
    applyStatusFilter();
    ensureRequiredColumnsVisible(dataTable);
    syncFilterCellsVisibility(dataTable);
    recalcResponsive(dataTable);
}

export function destroyUsersTable() {
    if (dataTable) {
        dataTable.destroy();
        dataTable = null;
    }
    $(`${TABLE_SEL} thead .filters-row`).remove();
    $(`${TABLE_SEL} tbody`).empty();
}

export function setStatusFilter(type) {
    statusFilter = type;
    document.querySelectorAll(".shopify-filter-pill[data-filter]").forEach((btn) => {
        const isActive = btn.dataset.filter === type;
        btn.classList.toggle("active", isActive);
        btn.setAttribute("aria-pressed", String(isActive));
    });
    applyStatusFilter();
}

function applyStatusFilter() {
    if (!dataTable) return;
    const column = dataTable.column(COL.ESTADO);
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
            title: "Nombre",
            data: "nombrePlain",
            responsivePriority: 2,
            render(data, type, row) {
                if (type === "display") return row.nombre;
                return data;
            },
        },
        { title: "Apellido", data: "apellido", responsivePriority: 3 },
        { title: "Email", data: "email", responsivePriority: 6 },
        { title: "Rol", data: "rol", responsivePriority: 5 },
        {
            title: "Estado",
            data: "estadoKey",
            className: "text-center",
            responsivePriority: 4,
            render(data, type) {
                if (type !== "display") return data;
                return data === "activo"
                    ? '<span class="badge badge-admin-active">Activo</span>'
                    : '<span class="badge badge-admin-inactive">Inactivo</span>';
            },
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

function setupColumnFilters(api) {
    const $thead = $(`${TABLE_SEL} thead`);
    const filterRow = $('<tr class="filters-row"></tr>');

    api.columns().every(function (colIdx) {
        const column = this;
        const def = column.settings()[0].aoColumns[colIdx];
        const th = $("<th></th>").attr("data-dt-column", colIdx);

        if (def.bSearchable === false || colIdx === COL.ACCIONES) {
            th.addClass("col-filter-empty");
            filterRow.append(th);
            return;
        }

        const placeholder = FILTER_PLACEHOLDERS[colIdx] || "Filtrar…";
        const input = $(`<input type="text" class="shopify-filter-input shopify-filter-input--col" placeholder="${placeholder}" autocomplete="off" />`);
        input.on("keyup change clear", function () {
            if (column.search() !== this.value) column.search(this.value).draw();
            if (colIdx === COL.NOMBRE) syncNameFilterInputs(this.value);
        });
        th.append(input);
        if (colIdx === COL.NOMBRE) th.addClass("col-filter-nombre");
        filterRow.append(th);
    });

    $thead.append(filterRow);
    syncFilterCellsVisibility(api);

    if (!window._usersColVisSyncBound) {
        window._usersColVisSyncBound = true;
        $(TABLE_SEL).on("column-visibility.dt", () => {
            if (dataTable) syncFilterCellsVisibility(dataTable);
        });
    }
}

function setupNameFilter(api) {
    const toolbarInput = document.getElementById("filterByUserName");
    if (!toolbarInput) return;

    const apply = (value) => {
        const term = value.trim();
        api.column(COL.NOMBRE).search(term).draw();
        syncNameFilterInputs(term, toolbarInput);
    };

    if (!toolbarInput.dataset.bound) {
        toolbarInput.dataset.bound = "true";
        toolbarInput.addEventListener("input", () => apply(toolbarInput.value));
        toolbarInput.addEventListener("search", () => apply(toolbarInput.value));
    }
}

function syncNameFilterInputs(value, skipInput = null) {
    const toolbar = document.getElementById("filterByUserName");
    if (toolbar && toolbar !== skipInput) toolbar.value = value;

    const colInput = document.querySelector(
        `${TABLE_SEL} thead tr.filters-row th[data-dt-column="${COL.NOMBRE}"] input`
    );
    if (colInput && colInput !== skipInput) colInput.value = value;
}

function mountControlsToToolbar() {
    const $wrapper = $("#usersTable_wrapper");

    const $search = $wrapper.find(".dt-search").first();
    if ($("#usersTableToolbarSearch").length && $search.length) {
        $("#usersTableToolbarSearch").empty().append($search);
    }

    const $length = $wrapper.find(".dt-length").first();
    if ($("#usersTableToolbarLength").length && $length.length) {
        $("#usersTableToolbarLength").empty().append($length);
    }

    $wrapper.children(".dt-layout-row, .row").each(function () {
        const $row = $(this);
        if ($row.find("table").length) return;
        if ($row.find(".dt-paging, .dt-info, .dataTables_paginate, .dataTables_info").length) return;
        $row.addClass("d-none");
    });
}

function setupShopifyToolbar(api) {
    const toolbar = document.querySelector(".admin-users-toolbar .admin-dt-toolbar-actions");
    if (toolbar && !toolbar.dataset.shopifyBound) {
        toolbar.dataset.shopifyBound = "true";
        const exportMap = {
            csv: ".buttons-export-csv",
            excel: ".buttons-export-excel",
            pdf: ".buttons-export-pdf",
            print: ".buttons-export-print",
        };
        document.querySelectorAll(".admin-users-toolbar [data-export]").forEach((btn) => {
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                const sel = exportMap[btn.dataset.export];
                if (sel && api.button) api.button(sel).trigger();
            });
        });
    }
    setupColumnVisibilityMenu(api);
}

function setupColumnVisibilityMenu(api) {
    const menu = document.getElementById("usersColvisMenu");
    if (!menu) return;
    menu.innerHTML = "";

    api.columns().every(function (colIdx) {
        const column = this;
        const def = column.settings()[0].aoColumns[colIdx];
        if (def.className?.includes("no-colvis")) return;

        const isLocked = def.className?.includes("col-always-visible");
        const title = COLVIS_HEADERS[colIdx] || `Columna ${colIdx}`;
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
            column.visible(checkbox.checked);
            if (!checkbox.checked) {
                column.search("");
                const inp = document.querySelector(
                    `${TABLE_SEL} thead tr.filters-row th[data-dt-column="${colIdx}"] input`
                );
                if (inp) inp.value = "";
            }
            syncFilterCellsVisibility(api);
            recalcResponsive(api);
        });
        li.querySelector("label").addEventListener("click", (e) => e.stopPropagation());
        menu.appendChild(li);
    });
}

function syncFilterCellsVisibility(api) {
    api.columns().every(function (colIdx) {
        const cell = document.querySelector(
            `${TABLE_SEL} thead tr.filters-row th[data-dt-column="${colIdx}"]`
        );
        if (!cell) return;
        const visible = this.visible();
        cell.classList.toggle("col-filter-hidden", !visible);
        cell.style.display = visible ? "" : "none";
    });
}

function ensureRequiredColumnsVisible(api) {
    api.column(COL.ID).visible(true);
}

function recalcResponsive(api) {
    requestAnimationFrame(() => {
        if (window.matchMedia("(min-width: 768px)").matches) api.columns.adjust();
        if (api.responsive?.recalc) api.responsive.recalc();
    });
}

function bindResponsiveEvents() {
    $(TABLE_SEL).off(".adminUsersResponsive");
    $(TABLE_SEL).on("responsive-resize.dt.adminUsersResponsive column-visibility.dt.adminUsersResponsive", () => {
        if (!dataTable) return;
        syncFilterCellsVisibility(dataTable);
        recalcResponsive(dataTable);
    });

    if (window._adminUsersResponsiveBound) return;
    window._adminUsersResponsiveBound = true;

    let resizeTimer;
    const onResize = () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => dataTable && recalcResponsive(dataTable), 160);
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("orientationchange", onResize);
}

function bindRowActionDelegation() {
    const tbody = document.querySelector(`${TABLE_SEL} tbody`);
    if (!tbody || tbody.dataset.bound === "true") return;
    tbody.dataset.bound = "true";

    tbody.addEventListener("click", (e) => {
        const editBtn = e.target.closest("[data-action='edit']");
        const toggleBtn = e.target.closest("[data-action='toggle']");
        if (!editBtn && !toggleBtn) return;
        e.preventDefault();
        e.stopPropagation();

        const user = findUserById((editBtn || toggleBtn).dataset.id);
        if (!user) return;
        if (editBtn) onEdit(user);
        if (toggleBtn) onToggleActive(user);
    });
}

function findUserById(id) {
    return userLookup.find((u) => String(u.id) === String(id));
}

function mapUsersToRows(users) {
    return users.map((u) => {
        const isActive = u.activo !== false;
        return {
            id: u.id,
            nombre: escapeHtml(u.nombre || ""),
            nombrePlain: u.nombre || "",
            apellido: escapeHtml(u.apellido || "—"),
            email: escapeHtml(u.email || "—"),
            rol: escapeHtml(u.rol || "—"),
            estadoKey: isActive ? "activo" : "inactivo",
            actionsHtml: buildActionsHtml(u, isActive),
        };
    });
}

function buildActionsHtml(u, isActive) {
    const id = escapeAttr(u.id);
    return `
        <div class="btn-group btn-group-sm" role="group">
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
    return String(text ?? "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
}
