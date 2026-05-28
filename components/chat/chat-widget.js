/** @returns {string} HTML del botón flotante y panel del chat */
export function createChatWidgetMarkup() {
    return `
    <div class="fab-stack" aria-label="Asistente de compras">
        <button type="button" id="fab-coroto-chat" class="fab-ai-launch" title="CoroTIA"
            aria-controls="coroto-chat-panel" aria-expanded="false">
            <span class="fab-ai-launch__pulse" aria-hidden="true"></span>
            <span class="fab-ai-launch__mark" aria-hidden="true">
                <i class="bi bi-stars fab-ai-launch__icon"></i>
            </span>
            <span class="fab-ai-launch__text">
                <span class="fab-ai-launch__title">CoroTIA</span>
            </span>
            <span class="sr-only">CoroTIA</span>
        </button>
    </div>

    <div id="coroto-chat-panel" class="ai-chat-panel" role="dialog" aria-modal="true"
        aria-labelledby="coroto-chat-title" hidden>
        <div class="ai-chat-shell">
            <header class="ai-chat-header">
                <div class="ai-chat-header__brand">
                    <div class="ai-chat-header__orb" aria-hidden="true">IA</div>
                    <div>
                        <h2 id="coroto-chat-title" class="ai-chat-header__title">CoroTIA</h2>
                        <p class="ai-chat-header__sub">
                            <span class="ai-chat-status" aria-hidden="true"></span>
                            En línea · te ayudo con tu presupuesto
                        </p>
                    </div>
                </div>
                <button type="button" id="coroto-chat-close" class="ai-chat-close" aria-label="Cerrar">&times;</button>
            </header>
            <div id="coroto-chat-messages" class="ai-chat-messages" tabindex="-1" aria-live="polite"></div>
            <div id="coroto-chat-chips" class="ai-chat-chips">
                <button type="button" class="ai-chip" data-prompt="Tengo un presupuesto de 2.000.000 pesos, ¿qué me recomiendas?">💰 Presupuesto $2M</button>
                <button type="button" class="ai-chip" data-prompt="Busco una tarjeta gráfica para gaming, ¿qué opciones tienen?">🎮 GPU gaming</button>
                <button type="button" class="ai-chip" data-prompt="Quiero armar un PC básico de oficina con poco presupuesto">🖥️ PC oficina</button>
                <button type="button" class="ai-chip" data-prompt="¿Qué laptops gamer tienen disponibles?">💻 Laptops</button>
            </div>
            <div class="ai-chat-footer">
                <form id="coroto-chat-form" class="ai-chat-form">
                    <label class="sr-only" for="coroto-chat-input">Mensaje</label>
                    <input id="coroto-chat-input" type="text" required maxlength="2000"
                        class="ai-chat-input" placeholder="Ej: tengo 1.500.000 para una GPU..."
                        autocomplete="off">
                    <button type="submit" class="ai-chat-send" aria-label="Enviar">
                        <i class="bi bi-send-fill" aria-hidden="true"></i>
                    </button>
                </form>
            </div>
        </div>
    </div>`;
}
