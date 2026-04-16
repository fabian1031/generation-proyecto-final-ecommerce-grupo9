import { validateAll } from './validations.js';

const contactForm = document.querySelector('#contactForm');

const contactFormHandler = async (event) => {
    event.preventDefault();

    const name = document.querySelector('#nombre').value.trim();
    const email = document.querySelector('#correo').value.trim();
    const message = document.querySelector('#mensaje').value.trim();
    const cellphone = document.querySelector('#celular').value.trim();

    const { valid, errors } = validateAll({ nombre: name, correo: email, feedback: message, celular: cellphone });

    if (!valid) {
        const errorMessages = Object.values(errors).join('\n');
        showAlert({ type: 'error', message: errorMessages });
        return;
    }

    try {
        const response = await fetch('https://formspree.io/f/xpqkpydy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ nombre: name, correo: email, mensaje: message, celular: cellphone }),
        });

        if (response.ok) {
            showAlert({ type: 'success', message: '¡Mensaje enviado! Nos pondremos en contacto pronto.' });
            contactForm.reset();
        } else {
            const data = await response.json();
            const msg = data?.errors?.[0]?.message || 'Error al enviar el formulario.';
            showAlert({ type: 'error', message: msg });
        }
    } catch (error) {
        showAlert({ type: 'error', message: 'Hubo un problema de red. Intenta de nuevo más tarde.' });
        console.error(error);
    }
};

contactForm.addEventListener('submit', contactFormHandler);