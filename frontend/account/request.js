class AccountError extends Error {
    constructor(message, code = '') { super(message); this.code = code; }
}

function createAccountRequest(browser, { baseUrl = '', timeoutMs = 20000 } = {}) {
    return async function request(path, body) {
        const controller = new AbortController();
        let timer;
        try {
            return await Promise.race([
                (async () => {
                    const response = await browser.fetch(baseUrl + path, {
                        method: body === undefined ? 'GET' : 'POST', credentials: 'include', cache: 'no-store', signal: controller.signal,
                        ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
                    });
                    const data = await response.json().catch(() => null);
                    if (response.status === 429) {
                        const header = response.headers.get('Retry-After');
                        const seconds = /^\d+$/.test(header || '') ? Number(header) : (Date.parse(header) - Date.now()) / 1000;
                        const wait = seconds > 0 ? ` Aguarde ${Math.ceil(seconds / 60)} minuto(s).` : ' Aguarde alguns minutos.';
                        throw new AccountError('Muitas tentativas.' + wait + ' Depois tente novamente.', 'RATE_LIMITED');
                    }
                    if (!response.ok) {
                        const failure = new AccountError(response.status >= 500
                            ? 'O serviço de conta está indisponível. Tente novamente em instantes.'
                            : data?.error || 'Não foi possível concluir. Confira seus dados e tente novamente.', data?.code);
                        failure.status = response.status;
                        throw failure;
                    }
                    if (!data || typeof data !== 'object' || Array.isArray(data)) throw new AccountError('O servidor enviou uma resposta inválida. Tente novamente.', 'INVALID_RESPONSE');
                    return data;
                })(),
                new Promise((_, reject) => {
                    timer = browser.setTimeout(() => {
                        reject(new AccountError('A conexão demorou demais. Confira sua internet e tente novamente.', 'TIMEOUT'));
                        controller.abort();
                    }, timeoutMs);
                })
            ]);
        } catch (error) {
            if (error instanceof AccountError) throw error;
            throw new AccountError('Não foi possível conectar. Confira sua internet e tente novamente.', 'NETWORK_ERROR');
        } finally { browser.clearTimeout(timer); }
    };
}
module.exports = { AccountError, createAccountRequest };
