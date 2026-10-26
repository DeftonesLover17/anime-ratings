function createEditorialNotices(browser) {
    let activeToast = null;
    let hideTimer = null;
    let removalTimer = null;

    function removeActive() {
        browser.clearTimeout(hideTimer);
        browser.clearTimeout(removalTimer);
        activeToast?.remove();
        activeToast = null;
        hideTimer = null;
        removalTimer = null;
    }

    function show(label, message) {
        removeActive();
        const toast = browser.document.createElement('section');
        toast.id = 'av-session-toast';
        toast.className = 'av-session-toast';
        toast.setAttribute('role', 'status');
        toast.setAttribute('aria-live', 'polite');
        toast.setAttribute('aria-atomic', 'true');
        toast.innerHTML = `
            <span class="av-session-toast__mark" aria-hidden="true"><svg viewBox="0 0 32 32" fill="none"><path d="M16 3.5 19.2 12.8 28.5 16l-9.3 3.2L16 28.5l-3.2-9.3L3.5 16l9.3-3.2L16 3.5Z" fill="currentColor"/><circle cx="25.5" cy="6.5" r="2" fill="currentColor"/></svg></span>
            <div class="av-session-toast__copy"><p class="av-session-toast__label"></p><p class="av-session-toast__message"></p></div>
            <button class="av-session-toast__close" type="button" aria-label="Fechar aviso">×</button>
        `;
        toast.querySelector('.av-session-toast__label').textContent = label;
        toast.querySelector('.av-session-toast__message').textContent = message;

        const dismiss = () => {
            if (activeToast !== toast || toast.classList.contains('is-leaving')) return;
            browser.clearTimeout(hideTimer);
            toast.classList.add('is-leaving');
            const delay = browser.matchMedia?.('(prefers-reduced-motion: reduce)').matches ? 0 : 220;
            removalTimer = browser.setTimeout(removeActive, delay);
        };
        toast.querySelector('.av-session-toast__close').addEventListener('click', dismiss);
        browser.document.body.appendChild(toast);
        activeToast = toast;
        hideTimer = browser.setTimeout(dismiss, 5500);
    }

    return {
        welcome(username) {
            show('ANIVØID / ENTRADA AUTORIZADA', `Que bom ter você de volta, ${String(username || '').trim()}!`);
        },
        friendship(message) {
            show('ANIVØID / SUA REDE', String(message || ''));
        }
    };
}

module.exports = { createEditorialNotices };
