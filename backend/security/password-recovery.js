const identity = require('../../shared/security/identity');
const { SecurityError, passwordPolicyError } = require('../../shared/security/policy');
const { recoveryEmailConfigured, sendRecoveryEmail, unavailable } = require('./recovery-email');
const TTL_MS = 20 * 60 * 1000;
const ACCEPTED = 'Se esse e-mail estiver cadastrado, você receberá um link para redefinir sua senha. Confira também a pasta de spam.';
const invalid = () => new SecurityError(400, 'INVALID_RECOVERY', 'Este link é inválido, já foi usado ou expirou. Solicite um novo link.');

function createPasswordRecovery({ crypto, store, deliver = sendRecoveryEmail, now = Date.now }) {
    const digest = async value => [...new Uint8Array(await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value)))].map(byte => byte.toString(16).padStart(2, '0')).join('');
    function available(env) { return deliver !== sendRecoveryEmail || recoveryEmailConfigured(env); }
    async function request(env, user, defer) {
        if (!available(env)) throw unavailable();
        if (!user?.accountId || !identity.validEmail(user.email)) return;
        const site = new URL(env.PUBLIC_SITE_ORIGIN || 'https://anime-ratings.pages.dev');
        if (site.protocol !== 'https:' || site.username || site.password || site.pathname !== '/' || site.search || site.hash) throw unavailable();
        const token = [...crypto.getRandomValues(new Uint8Array(32))].map(byte => byte.toString(16).padStart(2, '0')).join('');
        const proof = { hash: await digest(token), accountId: user.accountId, email: identity.emailKey(user.email), credentialVersion: Number(user.credentialVersion) || 0, expiresAt: now() + TTL_MS };
        await store.save(env, proof);
        const delivery = Promise.resolve().then(() => deliver(env, { email: proof.email, token, link: `${site.origin}/#redefinir-senha=${token}` })).catch(async () => {
            try { await store.remove(env, proof.hash); } catch { /* Expiry still bounds a proof if cleanup is unavailable. */ }
            // Neither token, email, provider body nor credentials may enter logs.
            console.error('password_recovery_delivery_failed');
        });
        if (defer) defer(delivery); else await delivery;
    }
    async function reset(env, token, password, state, { saveState, setPassword, verifyPassword, revokeSessions }) {
        const error = passwordPolicyError(password);
        if (error) throw new SecurityError(400, 'INVALID_PASSWORD', error);
        if (typeof token !== 'string' || !/^[a-f0-9]{64}$/.test(token)) throw invalid();
        const proof = await store.consume(env, await digest(token), now());
        if (!proof || proof.expiresAt <= now()) throw invalid();
        const users = (state.registeredUsers || []).filter(user => user?.accountId === proof.accountId);
        const user = users.length === 1 && users[0];
        if (!user || identity.emailKey(user.email) !== proof.email || (Number(user.credentialVersion) || 0) !== proof.credentialVersion) throw invalid();
        let committed = false;
        try {
            if (await verifyPassword(user, password)) throw new SecurityError(400, 'PASSWORD_REUSED', 'Escolha uma senha diferente da anterior.');
            await setPassword(user, password);
            user.passwordResetRequired = false;
            await saveState(state);
            committed = true;
            await revokeSessions(user.username);
        } catch (failure) {
            if (!committed && proof.expiresAt > now()) await store.restore(env, proof);
            throw failure;
        }
    }
    return { available, request, reset, digest };
}
module.exports = { createPasswordRecovery, ACCEPTED, TTL_MS };
