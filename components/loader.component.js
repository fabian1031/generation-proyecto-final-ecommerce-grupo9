const LOADER_ID = 'appLoader';

export function showLoader(message, note = '') {
    hideLoader();

    const mount = document.createElement('div');
    mount.id = LOADER_ID;
    mount.innerHTML = `
        <div class="modal-backdrop-custom">
            <div class="modal-box app-loader">
                <div class="app-loader__spinner" role="status" aria-hidden="true"></div>
                <p class="app-loader__title" id="appLoaderText">${message}</p>
                ${note ? `<p class="app-loader__note" id="appLoaderNote">${note}</p>` : ''}
            </div>
        </div>
    `;

    document.body.appendChild(mount);
}

export function updateLoader(message, note) {
    const text = document.getElementById('appLoaderText');
    if (text) text.textContent = message;

    if (note === undefined) return;

    const noteEl = document.getElementById('appLoaderNote');

    if (note && noteEl) {
        noteEl.textContent = note;
    } else if (note) {
        document.querySelector(`#${LOADER_ID} .app-loader`)?.insertAdjacentHTML(
            'beforeend',
            `<p class="app-loader__note" id="appLoaderNote">${note}</p>`,
        );
    } else if (noteEl) {
        noteEl.remove();
    }
}

export function hideLoader() {
    document.getElementById(LOADER_ID)?.remove();
}
