export const EMAILJS_PUBLIC_KEY = 'b9IMoKkz0x4wSdU3T';
export const EMAILJS_SERVICE_ID = 'service_xgi7q6v';
export const EMAILJS_ORDER_TEMPLATE_ID = 'template_5jsr4fh';
export const EMAILJS_CONTACT_TEMPLATE_ID = 'template_p0khoxn';
export const STORE_EMAIL = 'coroto2026@outlook.com';

const URL = 'https://api.emailjs.com/api/v1.0/email/send';

export async function sendEmail(templateId, params) {
    const response = await fetch(URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            user_id: EMAILJS_PUBLIC_KEY,
            service_id: EMAILJS_SERVICE_ID,
            template_id: templateId,
            template_params: params,
        }),
    });

    if (!response.ok) {
        throw new Error(await response.text());
    }
}

export function wait(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

export function camposCorreo(para, nombre, asunto, responderA) {
    return {
        to_email: para,
        email: para,
        to_name: nombre,
        name: nombre,
        subject: asunto,
        reply_to: responderA,
    };
}
