const { SecurityError } = require('../../shared/security/policy');
const unavailable = () => new SecurityError(503, 'RECOVERY_UNAVAILABLE', 'A recuperação por e-mail está temporariamente indisponível. Tente novamente mais tarde.');
function recoveryEmailConfigured(env) {
    if (env.RECOVERY_EMAIL_PROVIDER === 'emailjs') return Boolean(env.EMAILJS_PUBLIC_KEY && env.EMAILJS_PRIVATE_KEY && env.EMAILJS_SERVICE_ID && env.EMAILJS_RECOVERY_TEMPLATE_ID);
    return Boolean((env.RECOVERY_EMAIL_API_KEY || env.EMAIL_VERIFICATION_API_KEY) && env.EMAIL_FROM);
}
async function sendRecoveryEmail(env, { email, token, link }) {
    if (!recoveryEmailConfigured(env)) throw unavailable();
    let url, payload, headers = { 'Content-Type': 'application/json' };
    if (env.RECOVERY_EMAIL_PROVIDER === 'emailjs') {
        url = 'https://api.emailjs.com/api/v1.0/email/send';
        payload = { service_id: env.EMAILJS_SERVICE_ID, template_id: env.EMAILJS_RECOVERY_TEMPLATE_ID, user_id: env.EMAILJS_PUBLIC_KEY, accessToken: env.EMAILJS_PRIVATE_KEY,
            template_params: { to_email: email, reset_token: token } };
    } else {
        url = 'https://api.resend.com/emails';
        headers.Authorization = 'Bearer ' + (env.RECOVERY_EMAIL_API_KEY || env.EMAIL_VERIFICATION_API_KEY);
        payload = { from: env.EMAIL_FROM, to: [email], subject: 'Redefina sua senha — ANIVØID', text: `Recebemos um pedido para redefinir sua senha no ANIVØID.\n\nAbra este link em até 20 minutos:\n${link}\n\nO link funciona uma única vez. Se não foi você, ignore esta mensagem. Sua senha continua igual.` };
    }
    const response = await fetch(url, { method: 'POST', headers, body: JSON.stringify(payload), signal: AbortSignal.timeout(10000) });
    if (!response.ok) throw unavailable();
}
module.exports = { recoveryEmailConfigured, sendRecoveryEmail, unavailable };
