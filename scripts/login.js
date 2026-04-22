import { validateCorreo, validatePassword } from './validations.js';

document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const buttonShowPassword = document.getElementById('showPassword');
    const icon = document.getElementById('icon');


    // Toggle password

    buttonShowPassword.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';

        passwordInput.type = isPassword ? 'text' : 'password';
        icon.classList.toggle('bi-eye');
        icon.classList.toggle('bi-eye-slash');
    });


    // Helper visual

    const setFieldState = (input, isValid, message = '') => {
        const feedback = input.parentElement.querySelector('.invalid-feedback');

        input.classList.remove('is-valid', 'is-invalid');

        if (!input.value.trim()) return;

        if (isValid) {
            input.classList.add('is-valid');
        } else {
            input.classList.add('is-invalid');
            if (feedback) feedback.textContent = message;
        }
    };


    // Validación individual

    const validateField = (input) => {
        const value = input.value.trim();

        if (!value) {
            input.classList.remove('is-valid', 'is-invalid');
            return;
        }

        let result;

        if (input.id === 'email') {
            result = validateCorreo(value);
        }

        if (input.id === 'password') {
            result = validatePassword(value);
        }

        setFieldState(input, result.valid, result.message);
    };


    // Eventos en tiempo real

    [emailInput, passwordInput].forEach(input => {
        input.addEventListener('input', () => validateField(input));
        input.addEventListener('blur', () => validateField(input));
    });


    // Submit

    form.addEventListener('submit', (e) => {
        e.preventDefault();

        const emailResult = validateCorreo(emailInput.value);
        const passResult = validatePassword(passwordInput.value);

        form.classList.add('was-validated');

        setFieldState(emailInput, emailResult.valid, emailResult.message);
        setFieldState(passwordInput, passResult.valid, passResult.message);

        if (!emailResult.valid || !passResult.valid) return;

        // Aquí iría tu lógica real de login
        console.log('Login válido 🚀');

        // Ejemplo visual
        alert('Login exitoso (simulado)');
    });

});