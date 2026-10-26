const { passwordChangeError } = require('../../shared/security/policy');
const controllers = new WeakMap();

function bindProfileForm(browser, { client, session, getUsername, readFields, onSaved }) {
    const doc = browser.document, form = doc.getElementById('edit-profile-form');
    if (!form) return null;
    if (controllers.has(form)) return controllers.get(form);
    const field = id => doc.getElementById('edit-profile-' + id);
    const current = field('current-password'), replacement = field('new-password'), confirmation = field('confirm-password');
    const status = field('status'), email = field('email'), modal = doc.getElementById('edit-profile-modal');
    const submit = form.querySelector('button[type="submit"]');
    let busy = false, dirty = false, generation = 0, originalEmail = '', owner = '';
    let disabled = [];
    const clearSecrets = () => { current.value = replacement.value = confirmation.value = ''; };
    const message = (text, error = false) => { status.textContent = text; status.hidden = !text; status.dataset.error = String(error); };
    function setBusy(value) {
        busy = value; form.setAttribute('aria-busy', String(value));
        if (value) {
            disabled = [...form.querySelectorAll('input, select, button, textarea'), doc.getElementById('close-edit-profile')].filter(Boolean).map(node => [node, node.disabled]);
            for (const [node] of disabled) node.disabled = true;
        } else { for (const [node, wasDisabled] of disabled) node.disabled = wasDisabled; disabled = []; }
        submit.textContent = value ? 'Salvando…' : 'Salvar alterações';
    }
    const api = {
        get busy() { return busy; },
        begin() { generation++; dirty = false; owner = getUsername(); originalEmail = email.value.trim().toLowerCase(); clearSecrets(); message(''); return generation; },
        canRefresh(token) { return token === generation && !dirty && !busy && owner === getUsername() && !modal.classList.contains('hidden'); },
        close() { generation++; clearSecrets(); message(''); }
    };
    form.addEventListener('input', () => { dirty = true; });
    form.addEventListener('change', () => { dirty = true; });
    form.addEventListener('click', () => { dirty = true; });
    form.addEventListener('submit', async event => {
        event.preventDefault(); if (busy) return;
        if (!owner || owner !== getUsername() || modal.dataset.editUsername !== owner) { message('Sua sessão mudou. Feche esta janela e entre novamente antes de salvar.', true); status.focus(); return; }
        const fields = readFields();
        if (email.value.trim().toLowerCase() !== originalEmail) fields.email = email.value.trim();
        const newPassword = replacement.value, currentPassword = current.value;
        let validation = '';
        if ((newPassword || Object.hasOwn(fields, 'email')) && !currentPassword) validation = 'Digite sua senha atual para alterar o e-mail ou a senha.';
        else if (newPassword) validation = passwordChangeError(currentPassword, newPassword);
        if (!validation && (newPassword || confirmation.value) && newPassword !== confirmation.value) validation = 'As novas senhas não coincidem.';
        if (validation) { message(validation, true); status.focus(); return; }
        const editGeneration = generation;
        session?.invalidatePending();
        setBusy(true); message('Salvando suas alterações…');
        let result, error;
        try { result = await client.save({ username: owner, fields, currentPassword, newPassword }); }
        catch (failure) { error = failure; }
        finally { setBusy(false); }
        if (editGeneration !== generation || owner !== getUsername()) { clearSecrets(); message('Sua sessão mudou. Entre novamente antes de continuar.', true); return; }
        if (error) {
            if (error.saved || error.code === 'CHANGE_UNCONFIRMED') clearSecrets();
            if (error.saved) originalEmail = email.value.trim().toLowerCase();
            message(error.message || 'Não foi possível salvar. Tente novamente.', true); status.focus(); return;
        }
        clearSecrets(); dirty = false; originalEmail = email.value.trim().toLowerCase(); message('Alterações salvas.');
        await onSaved(result);
    });
    controllers.set(form, api); return api;
}
module.exports = { bindProfileForm };
