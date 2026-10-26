const policy = require('../../shared/security/policy');
const { API_LIMITS } = require('../../shared/security/rate-limits');
const identity = require('../../shared/security/identity');
const { createEmailVerification } = require('../security/email-verification');
const { createMemoryEmailStore } = require('./email-store');
const ACCOUNT_PATHS = new Set([
    '/api/logout',
    '/api/account/signout-all',
    '/api/account/change-password',
    '/api/account/change-password-forced',
    '/api/patch-user',
    '/api/account/email-verification/request',
    '/api/account/email-verification/confirm'
]);

function createAccountRoutes({
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
    const load = () =>
        new Promise((resolve, reject) =>
            readState((error, text) => {
                if (error) return reject(error);
                try {
                    resolve(JSON.parse(text));
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
                const error = policy.passwordPolicyError(input.newPassword);
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
                const error = policy.passwordPolicyError(input.password);
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
            if (
                Object.hasOwn(patch, 'email') &&
                !verifyPassword(user, input.currentPassword)
            )
                throw new policy.SecurityError(
                    403,
                    'REAUTH_REQUIRED',
                    'Confirme sua senha atual para alterar o e-mail.'
                );
            Object.assign(user, patch);
            for (const key of Object.keys(patch))
                if (patch[key] === null) delete user[key];
            await save(state);
            if (Object.hasOwn(patch, 'email')) {
                sessionStore.revokeUser(user.username);
                sessionStore.create(user, res);
            }
            sendJson(res, 200, {
                success: true,
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
