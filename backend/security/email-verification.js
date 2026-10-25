const identity = require('../../shared/security/identity');
const { SecurityError } = require('../../shared/security/policy');
const TOKEN_TTL_MS = 30 * 60 * 1000;
async function sendVerificationEmail(env, email, link) {
    if (!env.EMAIL_VERIFICATION_API_KEY || !env.EMAIL_FROM)
        throw new SecurityError(
            503,
            'EMAIL_DELIVERY_UNAVAILABLE',
            'A verificação por e-mail ainda não está disponível.'
        );
    const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
            Authorization: `Bearer ${env.EMAIL_VERIFICATION_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            from: env.EMAIL_FROM,
            to: [email],
            subject: 'Confirme seu e-mail no ANIVØID',
            text: `Confirme seu e-mail abrindo este link em até 30 minutos:\n\n${link}\n\nSe você não fez esta solicitação, ignore esta mensagem.`
        }),
        signal: AbortSignal.timeout(10000)
    });
    if (!response.ok)
        throw new SecurityError(
            503,
            'EMAIL_DELIVERY_UNAVAILABLE',
            'Não foi possível enviar o link de verificação agora.'
        );
}
function createEmailVerification({
    crypto,
    store,
    deliver = sendVerificationEmail
}) {
    const digest = async (token) =>
        Array.from(
            new Uint8Array(
                await crypto.subtle.digest(
                    'SHA-256',
                    new TextEncoder().encode(token)
                )
            ),
            (byte) => byte.toString(16).padStart(2, '0')
        ).join('');
    async function request(env, user) {
        if (
            deliver === sendVerificationEmail &&
            (!env.EMAIL_VERIFICATION_API_KEY || !env.EMAIL_FROM)
        )
            throw new SecurityError(
                503,
                'EMAIL_DELIVERY_UNAVAILABLE',
                'A verificação por e-mail ainda não está disponível.'
            );
        const bytes = crypto.getRandomValues(new Uint8Array(32));
        const token = Array.from(bytes, (byte) =>
            byte.toString(16).padStart(2, '0')
        ).join('');
        const hash = await digest(token),
            email = identity.emailKey(user.email);
        const origin =
            env.PUBLIC_SITE_ORIGIN || 'https://anime-ratings.pages.dev';
        if (new URL(origin).protocol !== 'https:')
            throw new SecurityError(
                503,
                'EMAIL_DELIVERY_UNAVAILABLE',
                'Configuração de e-mail indisponível.'
            );
        await store.save(env, {
            hash,
            accountId: user.accountId,
            email,
            expiresAt: Date.now() + TOKEN_TTL_MS
        });
        try {
            await deliver(env, email, `${origin}/?verify_email=${token}`);
        } catch (error) {
            await store.remove(env, hash);
            throw error;
        }
    }
    async function confirm(env, token, state, saveState) {
        const invalid = () =>
            new SecurityError(
                400,
                'INVALID_VERIFICATION',
                'Link de verificação inválido ou expirado.'
            );
        if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token))
            throw invalid();
        const hash = await digest(token),
            record = await store.consume(env, hash, Date.now());
        if (!record || record.expiresAt <= Date.now()) throw invalid();
        const user = (state.registeredUsers || []).find(
            (user) => user.accountId === record.accountId
        );
        if (!user || identity.emailKey(user.email) !== record.email) {
            await store.remove(env, hash);
            throw invalid();
        }
        user.emailVerified = true;
        user.emailVerifiedAt = new Date().toISOString();
        user.emailVerifiedEmail = record.email;
        try {
            await saveState(state);
        } catch (error) {
            if (error.code === 'STATE_CONFLICT') {
                throw new SecurityError(
                    409,
                    'VERIFICATION_RETRY_REQUIRED',
                    'Os dados da conta mudaram. Solicite um novo link de verificação.'
                );
            }
            throw error;
        }
    }
    return { request, confirm };
}
module.exports = { createEmailVerification };
