function createAccountSession(browser, storage = browser.localStorage) {
    let leaving = null;
    let username = '', generation = 0;
    let systemAccess = false;
    let knownAccount = false;
    try { knownAccount = Boolean(storage.getItem?.('anivoid_logged_in_username')); } catch {}
    function acceptUsername(value) {
        value = typeof value === 'string' ? value : '';
        if (username !== value) { generation++; systemAccess = false; }
        if (!value) systemAccess = false;
        username = value;
        if (value) knownAccount = true;
    }
    function clearCache() {
        for (const key of [
            'anivoid_registered_users',
            'anivoid_friends_v2',
            'anivoid_notifications_v1',
            'anivoid_auth_token'
        ]) {
            try {
                storage.removeItem(key);
            } catch {}
        }
        for (const key of storage.keys?.() || []) {
            if (key.startsWith('anivoid_sync_base:') || key.startsWith('anivoid_notifications_v2_')) storage.removeItem(key);
        }
    }
    async function post(path, body = {}) {
        const response = await browser.fetch(path, {
            method: 'POST',
            credentials: 'same-origin',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        const data = await response.json().catch(() => ({}));
        if (!response.ok || !data.success)
            throw new Error(
                data.error ||
                    'Não foi possível concluir a operação. Tente novamente.'
            );
        return data;
    }
    function logout(clearLocal) {
        if (leaving) return leaving;
        generation++;
        systemAccess = false;
        leaving = post('/api/logout')
            .then(() => {
                acceptUsername('');
                clearLocal();
                clearCache();
                browser.location.reload();
            })
            .catch((error) => {
                leaving = null;
                throw error;
            });
        return leaving;
    }
    async function consumeVerification() {
        const url = new URL(browser.location.href),
            token = url.searchParams.get('verify_email');
        if (!token) return;
        url.searchParams.delete('verify_email');
        browser.history.replaceState(
            browser.history.state,
            '',
            url.pathname + url.search + url.hash
        );
        try {
            await post('/api/account/email-verification/confirm', { token });
            browser.alert('E-mail verificado com sucesso.');
        } catch (error) {
            browser.alert(error.message);
        }
    }
    function bindVerification(button) {
        button.addEventListener('click', async () => {
            if (button.disabled) return;
            button.disabled = true;
            button.textContent = 'Enviando link…';
            try {
                await post('/api/account/email-verification/request');
                button.textContent = 'Link enviado';
                browser.alert(
                    'Confira sua caixa de entrada. O link de verificação vale por 30 minutos.'
                );
            } catch (error) {
                button.disabled = false;
                button.textContent = 'Enviar link de verificação';
                browser.alert(error.message);
            }
        });
    }
    return {
        logout, consumeVerification, bindVerification, clearCache,
        acceptUsername,
        acceptViewerPermissions: (viewer, permissions) => {
            systemAccess = Boolean(username && viewer === username && permissions?.canManageSystem === true);
        },
        canManageSystem: () => Boolean(username && systemAccess),
        username: () => username,
        version: () => generation,
        isCurrent: (version) => version === generation,
        invalidatePending: () => { generation++; },
        needsLogin: () => knownAccount && !username
    };
}
module.exports = { createAccountSession };
