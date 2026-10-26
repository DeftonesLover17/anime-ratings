const { createAccountRequest } = require('./request');
const { passwordPolicyError } = require('../../shared/security/policy');

function createRecoveryController(win, options = {}) {
    const request = createAccountRequest(win, options);
    const url = new URL(win.location.href);
    const fromLink = url.hash.startsWith('#redefinir-senha=');
    let token = '';
    if (fromLink) {
        token = url.hash.slice('#redefinir-senha='.length);
        // Fragments never reach the server; remove it before other scripts load.
        win.history.replaceState(win.history.state, '', url.pathname + url.search);
    }
    let dialog, mode = fromLink ? 'reset' : 'request', busy = false, opener, nextRequestAt = 0, timer;
    const validToken = () => /^[a-f0-9]{64}$/.test(token);
    function mount() {
        if (dialog) return;
        dialog = win.document.createElement('dialog');
        dialog.id = 'password-recovery-dialog'; dialog.className = 'av-recovery'; dialog.setAttribute('aria-labelledby', 'av-recovery-title');
        dialog.innerHTML = `<form novalidate>
            <div class="av-recovery-top"><span>ANIVØID / SUA CONTA</span><button type="button" data-close aria-label="Fechar recuperação de senha">✕</button></div>
            <h2 id="av-recovery-title">Recupere seu acesso<span>.</span></h2>
            <p data-intro>Informe o e-mail usado no cadastro. Enviaremos um link para criar sua nova senha.</p>
            <div data-request><label for="av-recovery-email">E-mail cadastrado</label><input id="av-recovery-email" type="email" name="email" autocomplete="email" maxlength="254" required placeholder="voce@exemplo.com"></div>
            <div data-reset hidden><label for="av-recovery-password">Nova senha</label><input id="av-recovery-password" type="password" name="new-password" autocomplete="new-password" maxlength="256">
            <label for="av-recovery-confirm">Confirme a nova senha</label><input id="av-recovery-confirm" type="password" name="confirm-password" autocomplete="new-password" maxlength="256">
            <p class="av-recovery-help">De 10 a 256 caracteres, com letras e números. Espaços fazem parte da senha.</p></div>
            <p data-status role="status" aria-live="polite" tabindex="-1" hidden></p>
            <button type="submit" class="av-recovery-submit">Enviar link de recuperação</button>
            <button type="button" data-again hidden>Solicitar um novo link</button>
            <button type="button" data-login>Voltar ao login</button>
        </form>`;
        win.document.body.append(dialog);
        const q = selector => dialog.querySelector(selector), form = q('form'), submit = q('[type=submit]'), email = q('[name=email]'), password = q('[name=new-password]'), confirm = q('[name=confirm-password]');
        const status = (text, error = false) => { q('[data-status]').textContent = text; q('[data-status]').hidden = !text; q('[data-status]').dataset.error = String(error); };
        function render() {
            win.clearTimeout(timer); status('');
            const resetting = mode === 'reset';
            q('[data-request]').hidden = resetting; q('[data-reset]').hidden = !resetting;
            q('#av-recovery-title').innerHTML = resetting ? 'Crie uma nova senha<span>.</span>' : 'Recupere seu acesso<span>.</span>';
            q('[data-intro]').textContent = resetting ? 'Uma nova senha para continuar sua história no ANIVØID.' : 'Informe o e-mail usado no cadastro. Enviaremos um link para criar sua nova senha.';
            password.value = confirm.value = '';
            submit.textContent = resetting ? 'Salvar nova senha' : 'Enviar link de recuperação'; submit.hidden = false;
            q('[data-again]').hidden = !resetting;
            submit.disabled = !resetting && Date.now() < nextRequestAt;
            if (submit.disabled) timer = win.setTimeout(() => { submit.disabled = false; }, nextRequestAt - Date.now());
            if (resetting && !validToken()) { status('Este link é inválido ou expirou. Solicite um novo link.', true); submit.disabled = true; }
        }
        const close = () => { if (busy) return; if (mode === 'done') { win.location.replace(win.location.pathname + '?login=1'); return; } win.clearTimeout(timer); password.value = confirm.value = ''; dialog.close(); opener?.focus?.(); };
        q('[data-close]').addEventListener('click', close);
        q('[data-login]').addEventListener('click', () => { if (mode === 'done') win.location.replace(win.location.pathname + '?login=1'); else close(); });
        q('[data-again]').addEventListener('click', () => { if (!busy) { mode = 'request'; token = ''; render(); email.focus(); } });
        dialog.addEventListener('cancel', event => { event.preventDefault(); close(); });
        dialog.addEventListener('click', event => { if (event.target === dialog) close(); });
        form.addEventListener('submit', async event => {
            event.preventDefault(); if (busy || submit.disabled) return;
            if (mode === 'request' && !email.checkValidity()) { status('Informe um e-mail válido.', true); email.focus(); return; }
            if (mode === 'reset') {
                const error = passwordPolicyError(password.value);
                if (error || password.value !== confirm.value) { status(error || 'As novas senhas não coincidem.', true); q('[data-status]').focus(); return; }
            }
            busy = true; form.setAttribute('aria-busy', 'true');
            for (const control of form.querySelectorAll('input,button')) control.disabled = true;
            status(mode === 'request' ? 'Solicitando seu link…' : 'Salvando sua nova senha…');
            try {
                const resetting = mode === 'reset';
                const data = await request('/api/account/password-recovery/' + (resetting ? 'confirm' : 'request'), resetting ? { token, password: password.value } : { email: email.value.trim() });
                if (data.success !== true) throw new Error('Não foi possível confirmar a operação. Tente novamente.');
                if (resetting) {
                    token = ''; password.value = confirm.value = ''; mode = 'done';
                    q('[data-reset]').hidden = true; submit.hidden = true; q('[data-again]').hidden = true;
                    q('#av-recovery-title').innerHTML = 'Acesso renovado<span>.</span>';
                    q('[data-intro]').textContent = 'Sua senha foi atualizada e as sessões anteriores foram encerradas.';
                    status('Entre usando sua nova senha.');
                } else { nextRequestAt = Date.now() + 60000; status(data.message || 'Se esse e-mail estiver cadastrado, você receberá um link para redefinir sua senha. Confira também a pasta de spam.'); }
            } catch (error) {
                const uncertain = mode === 'reset' && (error.status >= 500 || ['NETWORK_ERROR', 'TIMEOUT', 'INVALID_RESPONSE'].includes(error.code));
                status(uncertain ? 'Não foi possível confirmar a troca. Tente entrar com a nova senha; se não funcionar, solicite outro link.' : error.message, true);
                if (error.code === 'INVALID_RECOVERY') submit.hidden = true;
            } finally {
                busy = false; form.setAttribute('aria-busy', 'false');
                for (const control of form.querySelectorAll('input,button')) control.disabled = false;
                if (mode === 'request' && Date.now() < nextRequestAt) { submit.disabled = true; timer = win.setTimeout(() => { submit.disabled = false; }, nextRequestAt - Date.now()); }
                q('[data-status]').focus();
            }
        });
        dialog.renderRecovery = render;
        win.document.getElementById('forgot-password')?.addEventListener('click', () => open('request'));
        if (fromLink) open('reset');
    }
    function open(nextMode) {
        mount(); mode = nextMode || (token ? 'reset' : 'request'); opener = win.document.activeElement;
        dialog.renderRecovery(); if (!dialog.open) dialog.showModal();
        dialog.querySelector(mode === 'reset' ? '[name=new-password]' : '[name=email]').focus();
    }
    function install() { if (win.document.readyState === 'loading') win.document.addEventListener('DOMContentLoaded', mount, { once: true }); else mount(); }
    return { install, open };
}
module.exports = { createRecoveryController };
