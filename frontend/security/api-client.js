function createApiFetch(win, fetch, { origin, baseOrigin = win.location.origin, now = Date.now } = {}) {
    const pending = new Map();
    // A server budget is shared across routes; don't hammer another endpoint
    // after receiving 429. Mutations are never replayed automatically.
    let blockedUntil = 0;
    return async function apiFetch(input, init = {}) {
        init = init || {};
        const url = new URL(typeof input === 'string' || input instanceof URL ? input : input.url, baseOrigin);
        if (url.origin !== origin || !url.pathname.startsWith('/api/')) return fetch(input, init);
        if (blockedUntil > now()) return new Response(JSON.stringify({ code: 'RATE_LIMITED', error: 'Muitas requisições. Aguarde e tente novamente.' }), {
            status: 429, headers: { 'Content-Type': 'application/json', 'Retry-After': String(Math.ceil((blockedUntil - now()) / 1000)) }
        });
        const method = String(init.method || input?.method || 'GET').toUpperCase();
        if (method !== 'GET') pending.clear();
        const options = { ...init, credentials: 'include' };
        // Explicit headers/signals can carry caller-specific semantics.
        const share = method === 'GET' && typeof input === 'string' && !init.signal && !init.headers;
        const key = url.href;
        let operation = share && pending.get(key);
        if (!operation) {
            operation = Promise.resolve().then(() => fetch(input, options)).then(response => {
                // A mutation may change the session cookie. Never reuse a read
                // that started under the previous identity during confirmation.
                if (method !== 'GET') pending.clear();
                if (response.status === 429) {
                    const header = response.headers.get('Retry-After');
                    const seconds = /^\d+$/.test(header || '') ? Number(header) : (Date.parse(header) - now()) / 1000;
                    blockedUntil = now() + Math.min(3600, Math.max(1, Number.isFinite(seconds) ? seconds : 60)) * 1000;
                }
                return response;
            }).finally(() => { if (share && pending.get(key) === operation) pending.delete(key); });
            if (share) pending.set(key, operation);
        }
        return (await operation).clone();
    };
}
module.exports = { createApiFetch };
