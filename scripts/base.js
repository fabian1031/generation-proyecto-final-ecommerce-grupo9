 function showAlert({ type, message }) {
    Swal.fire({
        toast: true,
        position: 'top',
        icon: type,
        title: message,
        showConfirmButton: false,
        timer: 4000,
        timerProgressBar: true
    });
 };

 const authGuard = () => {
    const user = JSON.parse(localStorage.getItem('authUser'));

    if (!user) {
        const inPages = window.location.pathname.includes('/pages/');
        window.location.replace(inPages ? './login.html' : './pages/login.html');
    }
};