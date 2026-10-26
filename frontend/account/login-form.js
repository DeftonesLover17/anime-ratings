const { passwordChangeError } = require('../../shared/security/policy');

function bindLoginForm(browser, { client, session, onAuthenticated }) {
    const doc = browser.document, form = doc.getElementById('login-form');
    if (!form || form.dataset.loginBound) return;
    form.dataset.loginBound = 'true';
    const identifier = doc.getElementById('login-email'), password = doc.getElementById('login-password');
    const resetFields = doc.getElementById('login-reset-fields');
    const newPassword = doc.getElementById('login-new-password'), confirmation = doc.getElementById('login-confirm-password');
    const status = doc.getElementById('login-status'), submit = form.querySelector('button[type="submit"]');
    const switchers = ['tab-login', 'tab-register', 'toggle-to-login', 'toggle-to-register'].map(id => doc.getElementById(id)).filter(Boolean);
    let busy = false, resetting = false;
    function message(text, error = false) {
        status.textContent = text;
        status.hidden = !text;
        status.dataset.error = String(error);
        if (error) status.focus();
    }
    function resetMode(enabled) {
        resetting = enabled;
        resetFields.hidden = !enabled;
        newPassword.required = confirmation.required = enabled;
        newPassword.disabled = confirmation.disabled = !enabled;
        submit.textContent = enabled ? 'Salvar senha e entrar' : 'Entrar';
        if (!enabled) newPassword.value = confirmation.value = '';
    }
    function setBusy(value) {
        busy = value;
        form.setAttribute('aria-busy', String(value));
        for (const field of [identifier, password, ...switchers]) field.disabled = value;
        newPassword.disabled = confirmation.disabled = value || !resetting;
        submit.disabled = value;
        submit.textContent = value ? 'Entrando…' : resetting ? 'Salvar senha e entrar' : 'Entrar';
    }
    identifier.addEventListener('input', () => { resetMode(false); message(''); });
    password.addEventListener('input', () => { if (resetting) { resetMode(false); message(''); } });
    doc.getElementById('tab-register')?.addEventListener('click', () => { resetMode(false); message(''); });
    doc.getElementById('toggle-to-register')?.addEventListener('click', () => { resetMode(false); message(''); });
    resetMode(false);
    form.addEventListener('submit', async event => {
        event.preventDefault();
        if (busy) return;
        if (!identifier.value.trim() || !password.value) { message('Informe seu e-mail ou usuário e sua senha.', true); return; }
        if (resetting) {
            const error = passwordChangeError(password.value, newPassword.value);
            if (error) { message(error, true); newPassword.focus(); return; }
            if (newPassword.value !== confirmation.value) { message('As novas senhas não coincidem.', true); confirmation.focus(); return; }
        }
        session.invalidatePending();
        setBusy(true);
        message('Conferindo seus dados…');
        let focusReset = false;
        try {
            const data = resetting
                ? await client.resetAndLogin(identifier.value, password.value, newPassword.value)
                : await client.login(identifier.value, password.value);
            // Publish the identity only after a second request confirms the cookie.
            onAuthenticated(data);
            password.value = '';
            resetMode(false);
            message('');
        } catch (error) {
            if (error.code === 'PASSWORD_RESET_REQUIRED') {
                resetMode(true);
                focusReset = true;
                message('Crie uma senha pessoal para continuar. Use de 10 a 256 caracteres, com letras e números.');
            } else {
                if (['PASSWORD_CHANGED', 'CHANGE_UNCONFIRMED', 'PASSWORD_RESET_NOT_REQUIRED'].includes(error.code)) { password.value = ''; resetMode(false); }
                message(error.message || 'Não foi possível entrar. Tente novamente.', true);
            }
        } finally {
            setBusy(false);
            if (focusReset) newPassword.focus();
        }
    });
}
module.exports = { bindLoginForm };
