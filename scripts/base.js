function cssVar(name) {
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

if (typeof Swal !== 'undefined') {
    const swalFire = Swal.fire.bind(Swal);
    Swal.fire = (options = {}) =>
        swalFire({
            confirmButtonColor: cssVar('--primary'),
            cancelButtonColor: cssVar('--text-medium'),
            ...options,
        });
}

function showAlert({ type, message }) {
    Swal.fire({
        toast: true,
        position: 'top',
        icon: type,
        title: message,
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true,
        iconColor: type === 'error' ? cssVar('--error') : cssVar('--primary'),
        customClass: {
            popup: 'coroto-swal-toast',
            timerProgressBar: 'coroto-swal-toast__progress',
        },
    });
}

const authGuard = () => {
    const user = JSON.parse(localStorage.getItem('authUser'));

    if (!user) {
        const inPages = window.location.pathname.includes('/pages/');
        window.location.replace(inPages ? './login.html' : './pages/login.html');
    }
};
