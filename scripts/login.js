document.addEventListener('DOMContentLoaded', () => {
    const input = document.getElementById('password');
    const buttonShowPassword = document.getElementById('showPassword');
    const icon = document.getElementById('icon');

    if (!input || !buttonShowPassword || !icon) return;

    buttonShowPassword.addEventListener('click', () => {
        const isPassword = input.type === 'password';

        input.type = isPassword ? 'text' : 'password';
        icon.classList.toggle('bi-eye');
        icon.classList.toggle('bi-eye-slash');
    });
});