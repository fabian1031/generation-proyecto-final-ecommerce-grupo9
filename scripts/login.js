import { validateCorreo, validatePassword } from './validations.js';
import { authService } from '../services/auth.service.js';
import { api } from '../services/api.js';
import { getRootPath } from '../services/utils.service.js';

document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('loginForm');
    const emailInput = document.getElementById('email');
    const passwordInput = document.getElementById('password');

    const buttonShowPassword = document.getElementById('showPassword');
    const icon = document.getElementById('icon');

    buttonShowPassword.addEventListener('click', () => {
        const isPassword = passwordInput.type === 'password';

        passwordInput.type = isPassword ? 'text' : 'password';
        icon.classList.toggle('bi-eye');
        icon.classList.toggle('bi-eye-slash');
    });

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

    const validateField = (input) => {
        const value = input.value.trim();
        if (!value) return;

        let result;

        if (input.id === 'email') {
            result = validateCorreo(value);
        }

        if (input.id === 'password') {
            result = validatePassword(value);
        }

        setFieldState(input, result.valid, result.message);
    };

    [emailInput, passwordInput].forEach(input => {
        input.addEventListener('input', () => validateField(input));
        input.addEventListener('blur', () => validateField(input));
    });


    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        const emailResult = validateCorreo(email);
        const passResult = validatePassword(password);

        setFieldState(emailInput, emailResult.valid, emailResult.message);
        setFieldState(passwordInput, passResult.valid, passResult.message);

        if (!emailResult.valid || !passResult.valid) return;

        const submitBtn = form.querySelector('button[type="submit"]');
        if (submitBtn) submitBtn.disabled = true;

        try {
            const response = await api.post('/auth/login', {
                email,
                password
            });

            if (!response) {
                return Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'No se recibió respuesta del servidor'
                });
            }

            // Guardar usuario y token
            authService.setUser(response.usuario || response, response.token);

            await Swal.fire({
                icon: 'success',
                title: `Bienvenido ${response.usuario?.nombre || 'Usuario'}`,
                text: 'Inicio de sesión exitoso',
                confirmButtonText: 'Continuar',
                allowOutsideClick: false
            });

            window.location.href = `${getRootPath()}index.html`;

        } catch (error) {
            console.error('Error en login:', error);

            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: error.message || 'No se pudo iniciar sesión'
            });
        } finally {
            if (submitBtn) submitBtn.disabled = false;
        }
    });

});