import { registerValidators } from './validations.js';
import { debounce } from '../services/utils.service.js';
import { userService } from '../services/users.services.js';

document.addEventListener('DOMContentLoaded', () => {

    const form = document.getElementById('registroForm');
    const inputs = form.querySelectorAll('input, select');

    document.querySelectorAll('.toggle-password').forEach(btn => {
        btn.addEventListener('click', function () {
            const input = document.getElementById(this.dataset.target);
            const icon = this.querySelector('i');

            input.type = input.type === 'password' ? 'text' : 'password';
            icon.classList.toggle('bi-eye-fill');
            icon.classList.toggle('bi-eye-slash-fill');
        });
    });

    
    const setFieldState = (input, isValid, message = '') => {
        const feedback = input.parentElement.querySelector('.invalid-feedback');

        input.classList.remove('is-valid', 'is-invalid');

        if (!input.value && input.type !== 'checkbox' && input.tagName !== 'SELECT') return;

        if (isValid) {
            input.classList.add('is-valid');
        } else {
            input.classList.add('is-invalid');
            if (feedback) feedback.textContent = message;
        }
    };

    const getFormValues = () => {
        const data = {};
        inputs.forEach(input => {
            data[input.id] =
                input.type === 'checkbox'
                    ? input.checked
                    : input.value.trim();
        });
        return data;
    };

    const validateField = (input) => {
        const validator = registerValidators[input.id];
        if (!validator) return;

        const values = getFormValues();
        const value = values[input.id];

        const result = validator(value, values, input);

        setFieldState(input, result.valid, result.message);
    };

    inputs.forEach(input => {
        input.addEventListener('input', debounce(() => validateField(input), 300));
        input.addEventListener('change', () => validateField(input));
        input.addEventListener('blur', () => validateField(input));
    });


    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        let isValid = true;

        inputs.forEach(input => {
            validateField(input);

            if (input.classList.contains('is-invalid') || !input.checkValidity()) {
                isValid = false;
            }
        });

        form.classList.add('was-validated');

        if (!isValid) {
            return Swal.fire({
                icon: 'warning',
                title: 'Formulario incompleto',
                text: 'Revisa los campos marcados en rojo'
            });
        }

        const data = getFormValues();

        const newUser = {
            username: data.nombre,
            lastname: data.apellidos,
            email: data.correo,
            password: data.password,
            role: "User",
            isActive: true,
            documentType: data.tipoDocumento,
            documentNumber: data.cedula,
            phone: data.celular
        };

        try {
            await userService.create(newUser);

            await Swal.fire({
                icon: 'success',
                title: 'Registro exitoso 🎉',
                text: 'Tu cuenta fue creada correctamente',
                timer: 1500,
                showConfirmButton: false
            });

            form.reset();
            form.classList.remove('was-validated');

            inputs.forEach(i => i.classList.remove('is-valid', 'is-invalid'));

            window.location.href = '/pages/login.html';

        } catch (error) {
            console.error('Error creando usuario:', error);

            Swal.fire({
                icon: 'error',
                title: 'Error al registrar',
                text: 'No se pudo crear el usuario'
            });
        }
    });

});