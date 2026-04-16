import { validateAll } from "./validations";

const contactForm = document.querySelector('#contactForm');

contactForm.addEventListener('submit', contactFormHandler);

const contactFormHandler = async (event) => {
    event.preventDefault();

    console.log('Formulario enviado');

    const name = document.querySelector('#nombre').value.trim();
    const email = document.querySelector('#correo').value.trim();
    const message = document.querySelector('#mensaje').value.trim();
    const cellphone = document.querySelector('#celular').value.trim();

    const { valid, errors } = validateAll({ nombre: name, correo: email, feedback: message, celular: cellphone });

    if (!valid) {
        console.warn('Errores de validación:', errors);
        // acá puedes mostrar los errores en el DOM en lugar del alert
        showAlert({ type: 'error', message: errors });
        return;
    }

    try {
        const response = await fetch('https://formspree.io/f/xpqkpydy', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({ nombre: name, correo: email, feedback: message, celular: cellphone }),
            });

        if (response.ok) {
            alert("¡Mensaje enviado!");
            form.reset();
        } else {
            alert("Error al enviar.");
        }
    } catch (error) {
        showAlert({ type: 'error', message: error });
    }
};

window.contactFormHandler = contactFormHandler;