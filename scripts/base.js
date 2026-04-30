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

 export const authGuard = () => {
    const user = JSON.parse(localStorage.getItem('authUser'));

    if (!user) {
        window.location.replace('/pages/login.html');
    }
};