/**
 * 3 pasos (~1–2 s c/u). Al terminar el paso 3 → onComplete (ocultar timeline, mostrar resumen).
 */

const STEP_MS = 1800;

const STEPS = [
    {
        title: "Confirmando con tu banco",
        message: "Verificando tu transacción con la entidad bancaria…",
        icon: "bi-bank",
        bar: 12,
    },
    {
        title: "Recibiendo respuesta",
        message: "Esperando la confirmación del sistema de pagos…",
        icon: "bi-arrow-repeat",
        bar: 50,
    },
    {
        title: "Preparando tu pedido",
        message: "Registrando tu compra en Coroto…",
        icon: "bi-box-seam",
        bar: 100,
    },
];

const DONE_ICON = '<i class="bi bi-check-lg" aria-hidden="true"></i>';

/**
 * @param {{ onComplete?: () => void, stepMs?: number }} [options]
 */
export function runSuccessTimeline(options = {}) {
    const stepMs = options.stepMs ?? STEP_MS;
    const stepEls = document.querySelectorAll(".success-step");
    const fill = document.getElementById("successTimelineFill");
    const titleEl = document.getElementById("successTimelineTitle");
    const messageEl = document.getElementById("successTimelineMessage");
    const timerIds = [];
    let stopped = false;

    function clearTimers() {
        timerIds.forEach((id) => clearTimeout(id));
        timerIds.length = 0;
    }

    function schedule(fn, ms) {
        timerIds.push(setTimeout(fn, ms));
    }

    function setPhase(phase) {
        stepEls.forEach((el, i) => {
            el.classList.remove("active", "done");
            const dot = el.querySelector(".success-step-dot");
            if (i < phase) {
                el.classList.add("done");
                if (dot) dot.innerHTML = DONE_ICON;
            } else if (i === phase) {
                el.classList.add("active");
                if (dot && STEPS[i]) {
                    dot.innerHTML = `<i class="bi ${STEPS[i].icon}" aria-hidden="true"></i>`;
                }
            } else if (dot && STEPS[i]) {
                dot.innerHTML = `<i class="bi ${STEPS[i].icon}" aria-hidden="true"></i>`;
            }
        });

        if (fill && STEPS[phase]) fill.style.width = `${STEPS[phase].bar}%`;
        if (titleEl && STEPS[phase]) titleEl.textContent = STEPS[phase].title;
        if (messageEl && STEPS[phase]) messageEl.textContent = STEPS[phase].message;
    }

    function finish() {
        if (stopped) return;
        stopped = true;
        clearTimers();
        fill?.classList.remove("is-active");
        options.onComplete?.();
    }

    setPhase(0);

    schedule(() => {
        if (stopped) return;
        setPhase(1);
        schedule(() => {
            if (stopped) return;
            setPhase(2);
            schedule(finish, stepMs);
        }, stepMs);
    }, stepMs);

    return { stop: () => { stopped = true; clearTimers(); } };
}
