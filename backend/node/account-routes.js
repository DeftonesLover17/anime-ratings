const policy = require('../../shared/security/policy');
const { parseStoredState } = require('../../shared/state-integrity');
const { API_LIMITS } = require('../../shared/security/rate-limits');
const identity = require('../../shared/security/identity');
const { createEmailVerification } = require('../security/email-verification');
const { createPasswordRecovery, ACCEPTED } = require('../security/password-recovery');
const { createMemoryEmailStore } = require('./email-store');
const ACCOUNT_PATHS = new Set([
    '/api/account/password-recovery/request',
    '/api/account/password-recovery/confirm',
    '/api/logout',
    '/api/account/signout-all',
    '/api/account/change-password',
    '/api/account/change-password-forced',
    '/api/patch-user',
    '/api/account/email-verification/request',
    '/api/account/email-verification/confirm'
]);

function createAccountRoutes({
    recoveryStore,
    readState,
    writeState,
    sessionStore,
    verifyPassword,
    setPassword,
    sanitizeUser,
    sanitizeState,
    sendJson,
    enforceRateLimit
}) {
    const emailVerification = createEmailVerification({
        crypto: require('node:crypto').webcrypto,
        store: createMemoryEmailStore()
    });
    const passwordRecovery = createPasswordRecovery({ crypto: require('node:crypto').webcrypto, store: recoveryStore });
    const load = () =>
        new Promise((resolve, reject) =>
            readState((error, text) => {
                if (error) return reject(error);
                try {
                    resolve(parseStoredState(text));
                } catch (err) {
                    reject(err);
                }
            })
        );
    const save = (state) =>
        new Promise((resolve, reject) =>
            writeState(state, (error) => (error ? reject(error) : resolve()))
        );
    async function body(req) {
        let size = 0;
        const chunks = [];
        for await (const chunk of req) {
            size += chunk.length;
            if (size > policy.MAX_JSON_BYTES)
                throw new policy.SecurityError(
                    413,
                    'BODY_TOO_LARGE',
                    'Requisição grande demais.'
                );
            chunks.push(chunk);
        }
        try {
            const data = chunks.length
                ? JSON.parse(Buffer.concat(chunks).toString('utf8'))
                : {};
            if (!data || typeof data !== 'object' || Array.isArray(data))
                throw new Error();
            return data;
        } catch {
            throw new policy.SecurityError(
                400,
                'INVALID_JSON',
                'JSON inválido.'
            );
        }
    }
    async function enforceRecoveryTarget(req, email) {
        const key = await passwordRecovery.digest(email);
        return enforceRateLimit(req, null, 'recovery-account', 3, 60 * 60 * 1000, key);
    }
    const handle = async function (req, res) {
        try {
            if (req.url === '/api/logout') {
                sessionStore.revokeCurrent(req);
                res.setHeader('Set-Cookie', policy.expiredCookie());
                sendJson(res, 200, { success: true });
                return true;
            }
            const input = await body(req),
                state = await load();
            if (req.url === '/api/account/password-recovery/request') {
                const started = Date.now();
                if (enforceRateLimit(req, res, 'recovery-request-ip', 5, 15 * 60 * 1000)) return true;
                if (!passwordRecovery.available(process.env)) throw new policy.SecurityError(503, 'RECOVERY_UNAVAILABLE', 'A recuperação por e-mail está temporariamente indisponível.');
                const email = typeof input.email === 'string' ? identity.emailKey(input.email) : '';
                if (identity.validEmail(email) && !(await enforceRecoveryTarget(req, email))) {
                    const matches = state.registeredUsers.filter(user => identity.emailKey(user.email) === email);
                    const user = matches.length === 1 && matches[0];
                    if (user) {
                        if (!user.accountId) { identity.assignAccountIds(state, () => require('node:crypto').randomUUID()); await save(state); }
                        await passwordRecovery.request(process.env, user, task => { void task; });
                    }
                }
                await new Promise(resolve => setTimeout(resolve, Math.max(0, 200 - (Date.now() - started))));
                sendJson(res, 202, { success: true, message: ACCEPTED }); return true;
            }
            if (req.url === '/api/account/password-recovery/confirm') {
                if (enforceRateLimit(req, res, 'recovery-confirm-ip', 10, 15 * 60 * 1000)) return true;
                await passwordRecovery.reset(process.env, input.token, input.password, state, { saveState: save, setPassword, verifyPassword, revokeSessions: username => sessionStore.revokeUser(username) });
                res.setHeader('Set-Cookie', policy.expiredCookie()); sendJson(res, 200, { success: true }); return true;
            }
            if (req.url === '/api/account/email-verification/confirm') {
                if (
                    enforceRateLimit(
                        req,
                        res,
                        'verification-confirm',
                        12,
                        30 * 60 * 1000
                    )
                )
                    return true;
                await emailVerification.confirm(
                    process.env,
                    input.token,
                    state,
                    save
                );
                sendJson(res, 200, { success: true });
                return true;
            }
            if (req.url === '/api/account/change-password-forced') {
                const user = identity.findLoginUser(state, input.email);
                if (
                    enforceRateLimit(
                        req,
                        res,
                        'forced-password-reset',
                        5,
                        30 * 60 * 1000,
                        input.email
                    )
                )
                    return true;
                if (!user || !verifyPassword(user, input.oldPassword))
                    throw new policy.SecurityError(
                        401,
                        'INVALID_CREDENTIALS',
                        'Credenciais inválidas.'
                    );
                if (!user.passwordResetRequired) throw new policy.SecurityError(409, 'PASSWORD_RESET_NOT_REQUIRED', 'Entre na sua conta para trocar a senha pelo perfil.');
                const error = policy.passwordChangeError(input.oldPassword, input.newPassword);
                if (error)
                    throw new policy.SecurityError(
                        400,
                        'INVALID_PASSWORD',
                        error
                    );
                setPassword(user, input.newPassword);
                user.passwordResetRequired = false;
                await save(state);
                sessionStore.revokeUser(user.username);
                res.setHeader('Set-Cookie', policy.expiredCookie());
                sendJson(res, 200, { success: true });
                return true;
            }
            const user = sessionStore.authenticate(req, state);
            if (user && enforceRateLimit(req, res, 'account', API_LIMITS.account.max, API_LIMITS.account.windowMs, user.accountId || user.username)) return;
            if (!user)
                throw new policy.SecurityError(
                    401,
                    'AUTH_REQUIRED',
                    'Entre novamente para continuar.'
                );
            if (req.url === '/api/account/email-verification/request') {
                if (
                    enforceRateLimit(
                        req,
                        res,
                        'verification-request',
                        3,
                        60 * 60 * 1000,
                        user.username
                    )
                )
                    return true;
                await emailVerification.request(process.env, user);
                sendJson(res, 200, { success: true });
                return true;
            }
            if (req.url === '/api/account/signout-all') {
                sessionStore.revokeUser(user.username);
                res.setHeader('Set-Cookie', policy.expiredCookie());
                sendJson(res, 200, { success: true });
                return true;
            }
            if (req.url === '/api/account/change-password') {
                if (
                    enforceRateLimit(
                        req,
                        res,
                        'password-change',
                        5,
                        30 * 60 * 1000,
                        user.username
                    )
                )
                    return true;
                if (!verifyPassword(user, input.currentPassword))
                    throw new policy.SecurityError(
                        403,
                        'REAUTH_REQUIRED',
                        'Senha atual incorreta.'
                    );
                const error = policy.passwordChangeError(input.currentPassword, input.password);
                if (error)
                    throw new policy.SecurityError(
                        400,
                        'INVALID_PASSWORD',
                        error
                    );
                setPassword(user, input.password);
                await save(state);
                sessionStore.revokeUser(user.username);
                sessionStore.create(user, res);
                sendJson(res, 200, { success: true });
                return true;
            }
            if (
                identity.usernameKey(user.username) !==
                identity.usernameKey(input.username)
            )
                throw new policy.SecurityError(
                    403,
                    'FORBIDDEN',
                    'Você só pode alterar o próprio perfil.'
                );
            const patch = policy.profilePatch(
                user,
                input.fields || {},
                state.registeredUsers
            );
            if (
                Object.hasOwn(patch, 'email') &&
                enforceRateLimit(
                    req,
                    res,
                    'email-change',
                    5,
                    30 * 60 * 1000,
                    user.username
                )
            )
                return true;
            const changesPassword = Object.hasOwn(input, 'newPassword');
            if (changesPassword) {
                if (enforceRateLimit(req, res, 'password-change', 5, 30 * 60 * 1000, user.username)) return true;
                const error = policy.passwordChangeError(input.currentPassword, input.newPassword);
                if (error) throw new policy.SecurityError(400, 'INVALID_PASSWORD', error);
            }
            const credentialsChanged = changesPassword || Object.hasOwn(patch, 'email');
            if (credentialsChanged && !verifyPassword(user, input.currentPassword)) throw new policy.SecurityError(403, 'REAUTH_REQUIRED', 'Senha atual incorreta. Confira e tente novamente.');
            if (changesPassword) setPassword(user, input.newPassword);
            Object.assign(user, patch);
            for (const key of Object.keys(patch))
                if (patch[key] === null) delete user[key];
            await save(state);
            if (credentialsChanged) {
                sessionStore.revokeUser(user.username);
                sessionStore.create(user, res);
            }
            sendJson(res, 200, {
                success: true,
                credentialsChanged,
                user: sanitizeUser(user, user.username),
                registeredUsers: sanitizeState(state, user.username)
                    .registeredUsers
            });
        } catch (error) {
            sendJson(res, error.status || 500, {
                error: error.status
                    ? error.message
                    : 'Não foi possível concluir a operação.',
                code: error.code || 'INTERNAL_ERROR'
            });
        }
        return true;
    };
    handle.handles = (req) =>
        req.method === 'POST' && ACCOUNT_PATHS.has(req.url);
    return handle;
}
module.exports = { createAccountRoutes };
