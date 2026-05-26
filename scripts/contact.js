import { validateForm, contactValidators, validateNombre, validateCorreo, validateCelular, validateFeedback } from './validations.js';
import { sendContactMessage } from '../services/email.service.js';
import { showLoader, hideLoader } from '../components/loader.component.js';

const contactForm = document.querySelector('#contactForm');
const nombreInput = document.querySelector('#nombre');
const correoInput = document.querySelector('#correo');
const celularInput = document.querySelector('#celular');
const mensajeInput = document.querySelector('#mensaje');
const submitButton = contactForm?.querySelector('button[type="submit"]');

const setFieldState = (input, isValid, message = '') => {
    const feedback = input.parentElement.querySelector('.invalid-feedback');

    input.classList.remove('is-valid', 'is-invalid');

    if (isValid) {
        input.classList.add('is-valid');
    } else {
        input.classList.add('is-invalid');
        if (feedback) feedback.textContent = message;
    }
};

const contactFormHandler = async (event) => {
    event.preventDefault();

    const form = event.currentTarget;

    const name = nombreInput.value.trim();
    const email = correoInput.value.trim();
    const cellphone = celularInput.value.trim();
    const message = mensajeInput.value.trim();

    const { valid, errors } = validateForm({
        nombre: name,
        correo: email,
        celular: cellphone,
        feedback: message
    }, contactValidators);

    form.classList.add('was-validated');

    setFieldState(nombreInput, !errors.nombre, errors.nombre);
    setFieldState(correoInput, !errors.correo, errors.correo);
    setFieldState(celularInput, !errors.celular, errors.celular);
    setFieldState(mensajeInput, !errors.feedback, errors.feedback);

    if (!valid) return;

    if (submitButton) submitButton.disabled = true;
    showLoader('Enviando tu mensaje...', 'Por favor espera un momento.');

    try {
        await sendContactMessage({
            name,
            email,
            cellphone,
            message,
        });

        showAlert({
            type: 'success',
            message: '¡Mensaje enviado! Nos pondremos en contacto pronto.'
        });

        form.reset();
        form.classList.remove('was-validated');

        [nombreInput, correoInput, celularInput, mensajeInput]
            .forEach(input => input.classList.remove('is-valid', 'is-invalid'));

    } catch (error) {
        showAlert({
            type: 'error',
            message: error.message || 'Hubo un problema de red. Intenta de nuevo más tarde.'
        });
        console.error(error);
    } finally {
        hideLoader();
        if (submitButton) submitButton.disabled = false;
    }
};

const validateField = (input) => {
    if (!input.value.trim()) {
        input.classList.remove('is-valid', 'is-invalid');
        return;
    }

    let result;

    switch (input.id) {
        case 'nombre':
            result = validateNombre(input.value);
            break;
        case 'correo':
            result = validateCorreo(input.value);
            break;
        case 'celular':
            result = validateCelular(input.value);
            break;
        case 'mensaje':
            result = validateFeedback(input.value);
            break;
    }

    setFieldState(input, result.valid, result.message);
};

[nombreInput, correoInput, celularInput, mensajeInput].forEach(input => {
    input.addEventListener('input', () => {
        validateField(input);
    });

    input.addEventListener('blur', () => {
        validateField(input);
    });
});

contactForm.addEventListener('submit', contactFormHandler);
