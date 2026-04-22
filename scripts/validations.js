/**
 * Valida un nombre completo.
 * - Obligatorio
 * - Mínimo 2 caracteres
 * - Solo letras (incluye tildes, ñ), espacios, guiones y apóstrofes
 */
export function validateNombre(value) {
  const val = (value || '').trim();

  if (!val) {
    return { valid: false, message: 'El nombre es obligatorio.' };
  }
  if (val.length < 2) {
    return { valid: false, message: 'El nombre debe tener al menos 2 caracteres.' };
  }
  if (!/^[a-záéíóúüñA-ZÁÉÍÓÚÜÑ\s'\-]+$/.test(val)) {
    return { valid: false, message: 'El nombre solo puede contener letras, espacios, guiones o apóstrofes.' };
  }

  return { valid: true, message: 'Nombre válido.' };
}

/**
 * Valida un correo electrónico.
 * - Obligatorio
 * - Formato estándar: usuario@dominio.ext
 */
export function validateCorreo(value) {
  const val = (value || '').trim();

  if (!val) {
    return { valid: false, message: 'El correo electrónico es obligatorio.' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  if (!emailRegex.test(val)) {
    return { valid: false, message: 'Ingresa un correo válido. Ej: usuario@dominio.com' };
  }

  return { valid: true, message: 'Correo válido.' };
}

/**
 * Valida un número de celular.
 * - Obligatorio
 * - Permite dígitos, espacios, guiones, paréntesis y + (para indicativos internacionales)
 * - Entre 7 y 15 dígitos (sin contar separadores)
 */
export function validateCelular(value) {
  const val = (value || '').trim();

  if (!val) {
    return { valid: false, message: 'El número de celular es obligatorio.' };
  }

  // Elimina separadores permitidos antes de contar dígitos
  const soloDigitos = val.replace(/[\s\-()+]/g, '');

  if (!/^\d+$/.test(soloDigitos)) {
    return { valid: false, message: 'El número solo puede contener dígitos, espacios, guiones o paréntesis.' };
  }
  if (soloDigitos.length < 7) {
    return { valid: false, message: 'El número debe tener al menos 7 dígitos.' };
  }
  if (soloDigitos.length > 15) {
    return { valid: false, message: 'El número no puede superar 15 dígitos.' };
  }

  return { valid: true, message: 'Número válido.' };
}

/**
 * Valida el texto de retroalimentación.
 * - Obligatorio
 * - Mínimo 10 caracteres
 * - Máximo 500 caracteres
 */
export function validateFeedback(value) {
  const val = (value || '').trim();

  if (!val) {
    return { valid: false, message: 'La retroalimentación es obligatoria.' };
  }
  if (val.length < 10) {
    return { valid: false, message: 'La retroalimentación debe tener al menos 10 caracteres.' };
  }
  if (val.length > 500) {
    return { valid: false, message: `Máximo 500 caracteres. Actualmente: ${val.length}.` };
  }

  return { valid: true, message: 'Gracias por tu comentario.' };
}

export const validatePassword = (value) => {
    const val = (value || '').trim();

    if (!val) {
        return { valid: false, message: 'La contraseña es obligatoria.' };
    }

    if (val.length < 6) {
        return { valid: false, message: 'Debe tener al menos 6 caracteres.' };
    }

    return { valid: true, message: 'OK' };
};

// -----------------------
// Validaciones adicionales
// -----------------------

export const validateConfirmPassword = (value, allValues) => {
  if (!value) {
    return { valid: false, message: 'Confirma tu contraseña.' };
  }

  if (value !== allValues.password) {
    return { valid: false, message: 'Las contraseñas no coinciden.' };
  }

  return { valid: true, message: 'OK' };
};

export const simpleRequired = (message) => (value) => ({
  valid: !!value,
  message
});

export const validateCedula = (value) => ({
  valid: /^[A-Za-z0-9\-]{5,20}$/.test(value),
  message: 'Documento inválido.'
});

export const validateDireccion = (value) => ({
  valid: value.trim().length > 5,
  message: 'Dirección muy corta.'
});

// -----------------------
// Mapa centralizado
// -----------------------
export const registerValidators = {
  nombre: validateNombre,
  apellidos: validateNombre,
  correo: validateCorreo,
  celular: validateCelular,
  password: validatePassword,
  confirmPassword: validateConfirmPassword,

  tipoDocumento: simpleRequired('Selecciona un tipo.'),
  cedula: validateCedula,
  fechaNacimiento: simpleRequired('Ingresa tu fecha.'),
  genero: simpleRequired('Selecciona una opción.'),
  ciudad: simpleRequired('Selecciona tu ciudad.'),
  direccion: validateDireccion,
  terminos: (v, _, input) => ({
    valid: input.checked,
    message: 'Debes aceptar los términos.'
  })
};


//validaciones a los campos que capturamos en checkout

export function validateCheckout(fields) {

  const results = {
    nombre: validateNombre(fields.nombre),
    apellidos: validateNombre(fields.apellidos),
    correo: validateCorreo(fields.correo),
    celular: validateCelular(fields.celular),
    direccion: validateDireccion(fields.direccion)
  };

  const errors = {};
  let valid = true;

  for (const [key, result] of Object.entries(results)) {
    if (!result.valid) {
      valid = false;
      errors[key] = result.message;
    }
  }

  return { valid, errors };
}

//validamos el formulario de contacto

export function validateForm(fields, schema) {
  const errors = {};
  let valid = true;

  for (const key in schema) {
    const validator = schema[key];

    const result = validator(fields[key], fields);

    if (!result.valid) {
      valid = false;
      errors[key] = result.message;
    }
  }

  return { valid, errors };
}

//exportamos el esquema de contacto.

export const contactValidators = {
  nombre: validateNombre,
  correo: validateCorreo,
  celular: validateCelular,
  feedback: validateFeedback
};

