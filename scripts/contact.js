import {
    validateNombre,
    validateCorreo,
    validateCelular,
    validateFeedback
} from './validations.js';

const contactForm = document.querySelector('#contactForm');
const nombreInput = document.querySelector('#nombre');
const correoInput = document.querySelector('#correo');
const celularInput = document.querySelector('#celular');
const mensajeInput = document.querySelector('#mensaje');

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

    const { valid, errors } = validateAll({
        nombre: name,
        correo: email,
        celular: cellphone,
        feedback: message
    });

    // Activar estilos de Bootstrap
    form.classList.add('was-validated');

    // Pintar cada campo
    setFieldState(nombreInput, !errors.nombre, errors.nombre);
    setFieldState(correoInput, !errors.correo, errors.correo);
    setFieldState(celularInput, !errors.celular, errors.celular);
    setFieldState(mensajeInput, !errors.feedback, errors.feedback);

    if (!valid) return;

    // --- envío ---
    try {
        const response = await fetch('https://formspree.io/f/xpqkpydy', {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({
                nombre: name,
                correo: email,
                mensaje: message,
                celular: cellphone
            }),
        });

        if (response.ok) {
            showAlert({
                type: 'success',
                message: '¡Mensaje enviado! Nos pondremos en contacto pronto.'
            });

            form.reset();
            form.classList.remove('was-validated');

            // limpiar estados visuales
            [nombreInput, correoInput, celularInput, mensajeInput]
                .forEach(input => input.classList.remove('is-valid', 'is-invalid'));

        } else {
            const data = await response.json();
            const msg = data?.errors?.[0]?.message || 'Error al enviar el formulario.';
            showAlert({ type: 'error', message: msg });
        }

    } catch (error) {
        showAlert({
            type: 'error',
            message: 'Hubo un problema de red. Intenta de nuevo más tarde.'
        });
        console.error(error);
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

    // opcional: cuando pierde foco
    input.addEventListener('blur', () => {
        validateField(input);
    });
});

contactForm.addEventListener('submit', contactFormHandler);