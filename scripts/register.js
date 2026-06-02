import { registerValidators } from './validations.js';
import { debounce, getPagesPath } from '../services/utils.service.js';
import { api } from '../services/api.js';
import { authService } from '../services/auth.service.js';

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

        const telefono = String(data.celular || '').replace(/\D/g, '');

        if (telefono.length < 10) {
            return Swal.fire({
                icon: 'warning',
                title: 'Celular inválido',
                text: 'Ingresa un número de celular de al menos 10 dígitos.',
            });
        }

        const tipoDocumentoMap = { CC: 'CC', PA: 'PASAPORTE', PASAPORTE: 'PASAPORTE' };
        const tipoDocumento = tipoDocumentoMap[data.tipoDocumento];

        if (!tipoDocumento) {
            return Swal.fire({
                icon: 'warning',
                title: 'Tipo de documento',
                text: 'Por ahora solo se acepta Cédula de ciudadanía (CC) o Pasaporte.',
            });
        }

        const newUser = {
            nombre: data.nombre,
            apellido: data.apellidos,
            email: data.correo,
            password: data.password,
            tipoDocumento,
            numeroDocumento: data.cedula,
            telefono,
        };

        try {
            await api.post('/auth/register', newUser);

            authService.savePhoneForCheckout(telefono);

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

            window.location.href = `${getPagesPath()}login.html`;

        } catch (error) {
            console.error('Error creando usuario:', error);

            const msg = String(error?.message || '');
            const detail =
                msg === 'FORBIDDEN' || msg === 'AUTH'
                    ? 'Revisa que el celular tenga al menos 10 dígitos y que el correo no esté registrado.'
                    : msg || 'No se pudo crear el usuario';

            Swal.fire({
                icon: 'error',
                title: 'Error al registrar',
                text: detail,
            });
        }
    });

});