function bindRegistrationGateView(browser) {
    const bind = () => {
        const doc = browser.document;
        const gate = doc.getElementById('registration-gate');
        const registration = doc.getElementById('registration-form');
        const login = doc.getElementById('login-form');
        if (!gate || !registration || !login || gate.dataset.viewSwitchBound) return;
        gate.dataset.viewSwitchBound = 'true';

        const headerTag = doc.getElementById('reg-header-tag');
        const headerTitle = doc.getElementById('reg-header-title');
        const headerDescription = doc.getElementById('reg-header-desc');
        const indicators = doc.getElementById('reg-indicators');
        const registerTab = doc.getElementById('tab-register');
        const loginTab = doc.getElementById('tab-login');

        function select(view) {
            const isLogin = view === 'login';
            registration.classList.toggle('hidden', isLogin);
            login.classList.toggle('hidden', !isLogin);
            indicators?.classList.toggle('hidden', isLogin);

            if (headerTag) headerTag.textContent = isLogin ? 'Entrar no Anivoid' : 'Bem-vindo ao Anivoid';
            if (headerTitle) headerTitle.innerHTML = isLogin
                ? 'Bem-vindo de <span class="italic text-brand font-light">Volta</span>'
                : 'Crie seu <span class="italic text-brand font-light">Perfil de Otaku</span>';
            if (headerDescription) headerDescription.textContent = isLogin
                ? 'Insira suas credenciais para acessar sua biblioteca personalizada.'
                : 'Antes de entrar, precisamos de algumas informações para personalizar sua experiência.';

            for (const [button, active] of [[registerTab, !isLogin], [loginTab, isLogin]]) {
                if (!button) continue;
                button.setAttribute('aria-pressed', String(active));
                button.className = active
                    ? 'flex-grow py-1.5 rounded-full text-white bg-brand font-bold transition-all uppercase tracking-wider text-center'
                    : 'flex-grow py-1.5 rounded-full text-white/50 hover:text-white transition-all uppercase tracking-wider text-center';
            }
        }

        // This delegated capture handler is deliberately independent from the
        // legacy registration setup. Login stays available even when optional
        // onboarding content fails to initialize.
        gate.addEventListener('click', event => {
            const button = event.target?.closest?.('#tab-login, #toggle-to-login, #tab-register, #toggle-to-register');
            if (!button) return;
            select(button.id === 'tab-login' || button.id === 'toggle-to-login' ? 'login' : 'register');
        }, true);

        select(login.classList.contains('hidden') ? 'register' : 'login');
    };

    if (browser.document.readyState === 'loading') browser.document.addEventListener('DOMContentLoaded', bind, { once: true });
    else bind();
}

module.exports = { bindRegistrationGateView };
