const defaultConfig = require('./email-config');
const template = require('../../emails/welcome.html');
// Match EmailJS's literal double-brace escaping; do not decode stored entities.
const escapeHtml = value => String(value).replace(/[&<>"']/g, ch => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' })[ch]);

const clean = (value, limit = 160) => String(value || '').replace(/[\u0000-\u001f\u007f]/g, '').slice(0, limit);
const preferences = values => Array.isArray(values) && values.length
    ? values.slice(0, 12).map(value => clean(value, 80)).filter(Boolean).join(', ')
    : 'Seu universo ainda está em descoberta.';

function welcomeParameters(user) {
    return {
        name: clean(user.name || user.username, 40) || 'novo membro',
        email: clean(user.email, 254).trim(),
        title: 'Seu acervo começa agora — ANIVØID',
        favorite_genres: preferences(user.favoriteGenres),
        favorite_studios: preferences(user.favoriteStudios)
    };
}

function renderWelcomeEmail(user) {
    const params = welcomeParameters(user);
    return template.replace(/\{\{(name|favorite_genres|favorite_studios)\}\}/g, (_, name) => escapeHtml(params[name]));
}

function createWelcomeEmail(browser) {
    let mounted = false, currentUser = null, pending = null;
    const sent = new Set();
    function elements() {
        const doc = browser.document;
        return { toast: doc.getElementById('welcome-email-toast'), status: doc.getElementById('welcome-email-status'), retry: doc.getElementById('welcome-email-retry'), dialog: doc.getElementById('welcome-email-dialog'), frame: doc.getElementById('welcome-email-preview') };
    }
    function mount() {
        if (mounted || !elements().toast) return;
        mounted = true;
        const { toast, dialog, frame, retry } = elements();
        // The trusted, escaped letter cannot execute scripts. Same-origin access
        // lets the parent handle Escape while focus is inside its document.
        frame.addEventListener('load', () => {
            frame.contentDocument?.addEventListener('keydown', event => {
                if (event.key === 'Escape') {
                    event.preventDefault();
                    dialog.close();
                }
            });
        });
        browser.document.getElementById('welcome-email-open').addEventListener('click', () => {
            if (!currentUser) return;
            frame.srcdoc = renderWelcomeEmail(currentUser);
            if (!dialog.open) dialog.showModal();
        });
        browser.document.getElementById('welcome-email-close').addEventListener('click', () => dialog.close());
        dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
        browser.document.getElementById('welcome-email-dismiss').addEventListener('click', () => { toast.hidden = true; });
        retry.addEventListener('click', () => { if (currentUser && !pending) send(currentUser); });
    }
    function show(status, retry = false) {
        mount();
        const el = elements();
        if (!el.toast) return;
        el.toast.hidden = false;
        el.status.textContent = status;
        el.retry.hidden = !retry;
        el.retry.disabled = Boolean(pending);
    }
    function send(user) {
        if (pending) return pending;
        currentUser = user;
        const params = welcomeParameters(user), key = params.email.toLowerCase();
        if (sent.has(key)) { show('O e-mail de boas-vindas já foi enviado nesta sessão.'); return Promise.resolve(true); }
        show('Seu perfil está pronto. Enviando suas boas-vindas…');
        pending = (async () => {
            // Defer so even an immediate configuration error releases `pending`.
            await Promise.resolve();
            let timer;
            try {
                const config = browser.__ANIVOID_EMAILJS_CONFIG || defaultConfig;
                if (!params.email || !config.publicKey || !config.serviceId || !config.templateId || typeof browser.emailjs?.send !== 'function') throw new Error('Delivery unavailable');
                const response = await Promise.race([
                    browser.emailjs.send(config.serviceId, config.templateId, params, { publicKey: config.publicKey }),
                    new Promise((_, reject) => { timer = browser.setTimeout(() => reject(new Error('Delivery timeout')), 15000); })
                ]);
                if (response?.status !== 200) throw new Error('Delivery not accepted');
                sent.add(key);
                show('Boas-vindas enviadas! Confira sua caixa de entrada e a pasta de spam.');
                return true;
            } catch {
                show('Seu perfil foi criado. Não foi possível confirmar o envio do e-mail; confira sua caixa antes de tentar novamente.', true);
                return false;
            } finally {
                browser.clearTimeout(timer);
                pending = null;
                const el = elements();
                if (el.retry) el.retry.disabled = false;
            }
        })();
        return pending;
    }
    return { send, mount };
}
module.exports = { createWelcomeEmail, welcomeParameters, renderWelcomeEmail };
