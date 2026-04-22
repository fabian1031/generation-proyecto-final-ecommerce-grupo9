import { registerValidators } from './validations.js';
import { debounce } from '../services/utils.service.js';

const form = document.getElementById('registroForm');
const inputs = form.querySelectorAll('input, select');


// Toggle password

document.querySelectorAll('.toggle-password').forEach(btn => {
    btn.addEventListener('click', function () {
        const input = document.getElementById(this.dataset.target);
        const icon = this.querySelector('i');

        input.type = input.type === 'password' ? 'text' : 'password';
        icon.classList.toggle('bi-eye-fill');
        icon.classList.toggle('bi-eye-slash-fill');
    });
});


// Helper visual

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


// Obtener valores del form

const getFormValues = () => {
    const data = {};
    inputs.forEach(input => {
        data[input.id] = input.type === 'checkbox' ? input.checked : input.value;
    });
    return data;
};


// Validar campo

const validateField = (input) => {
    const validator = registerValidators[input.id];
    if (!validator) return;

    const values = getFormValues();
    const value = values[input.id];

    const result = validator(value, values, input);

    setFieldState(input, result.valid, result.message);
};


// Eventos

inputs.forEach(input => {
    input.addEventListener('input', debounce(() => validateField(input)));
    input.addEventListener('change', () => validateField(input));
    input.addEventListener('blur', () => validateField(input));
});


// Submit

form.addEventListener('submit', (e) => {
    e.preventDefault();

    let isValid = true;

    inputs.forEach(input => {
        validateField(input);

        if (input.classList.contains('is-invalid') || !input.checkValidity()) {
            isValid = false;
        }
    });

    form.classList.add('was-validated');

    if (!isValid) return;

    console.log('Registro válido 🚀');

    alert('Registro exitoso');

    form.reset();
    form.classList.remove('was-validated');
    inputs.forEach(i => i.classList.remove('is-valid', 'is-invalid'));
});