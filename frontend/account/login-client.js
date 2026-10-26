const { AccountError: LoginError, createAccountRequest } = require('./request');

function createLoginClient(browser, options = {}) {
    const request = createAccountRequest(browser, options);
    async function confirmSession(expectedUsername) {
        const data = await request('/api/users');
        if (!expectedUsername || data.viewerUsername !== expectedUsername) {
            throw new LoginError('Não foi possível manter sua sessão. Permita os cookies deste site e tente entrar novamente.', 'COOKIE_REQUIRED');
        }
        return data;
    }
    async function login(identifier, password) {
        const data = await request('/api/login', { identifier: identifier.trim(), password });
        if (typeof data.user?.username !== 'string' || !data.user.username) throw new LoginError('O servidor enviou uma resposta inválida. Tente novamente.', 'INVALID_RESPONSE');
        await confirmSession(data.user.username);
        return data;
    }
    async function resetAndLogin(identifier, oldPassword, newPassword) {
        let data;
        try { data = await request('/api/account/change-password-forced', { email: identifier.trim(), oldPassword, newPassword }); }
        catch (error) {
            if (error.status >= 500 || ['TIMEOUT', 'NETWORK_ERROR', 'INVALID_RESPONSE'].includes(error.code)) {
                throw new LoginError('Não foi possível confirmar a troca. Tente entrar com a nova senha; se não funcionar, use a senha anterior para repetir.', 'CHANGE_UNCONFIRMED');
            }
            throw error;
        }
        if (data.success !== true) throw new LoginError('Não foi possível confirmar a troca de senha. Entre novamente com a nova senha, se ela foi alterada.', 'PASSWORD_CHANGED');
        try { return await login(identifier, newPassword); }
        catch { throw new LoginError('Sua senha foi alterada. Entre novamente usando a nova senha.', 'PASSWORD_CHANGED'); }
    }
    return { login, resetAndLogin, confirmSession };
}
module.exports = { createLoginClient, LoginError };
