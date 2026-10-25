class LoginError extends Error {
    constructor(message, code = '') { super(message); this.code = code; }
}

function createLoginClient(browser, { baseUrl = '', timeoutMs = 20000 } = {}) {
    async function request(path, body) {
        const controller = new AbortController();
        let timer;
        try {
            return await Promise.race([
                (async () => {
                    const response = await browser.fetch(baseUrl + path, {
                        method: body === undefined ? 'GET' : 'POST',
                        credentials: 'include',
                        cache: 'no-store',
                        signal: controller.signal,
                        ...(body === undefined ? {} : {
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(body)
                        })
                    });
                    const data = await response.json().catch(() => null);
                    if (response.status === 429) {
                        const seconds = Number(response.headers.get('Retry-After'));
                        const wait = seconds > 0 ? ` Aguarde ${Math.ceil(seconds / 60)} minuto(s).` : ' Aguarde alguns minutos.';
                        throw new LoginError('Muitas tentativas.' + wait + ' Depois tente novamente.', 'RATE_LIMITED');
                    }
                    if (!response.ok) {
                        throw new LoginError(response.status >= 500
                            ? 'O serviço de login está indisponível. Tente novamente em instantes.'
                            : data?.error || 'Não foi possível entrar. Confira seus dados e tente novamente.', data?.code);
                    }
                    if (!data || typeof data !== 'object') throw new LoginError('O servidor enviou uma resposta inválida. Tente novamente.', 'INVALID_RESPONSE');
                    return data;
                })(),
                new Promise((_, reject) => {
                    timer = browser.setTimeout(() => {
                        reject(new LoginError('A conexão demorou demais. Confira sua internet e tente novamente.', 'TIMEOUT'));
                        controller.abort();
                    }, timeoutMs);
                })
            ]);
        } catch (error) {
            if (error instanceof LoginError) throw error;
            throw new LoginError('Não foi possível conectar. Confira sua internet e tente novamente.', 'NETWORK_ERROR');
        } finally { browser.clearTimeout(timer); }
    }
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
        await request('/api/account/change-password-forced', { email: identifier.trim(), oldPassword, newPassword });
        try { return await login(identifier, newPassword); }
        catch { throw new LoginError('Sua senha foi alterada. Entre novamente usando a nova senha.', 'PASSWORD_CHANGED'); }
    }
    return { login, resetAndLogin, confirmSession };
}
module.exports = { createLoginClient, LoginError };
