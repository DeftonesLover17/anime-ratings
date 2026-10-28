const { escapeHtml: e, imageUrl } = require('../shared/dom');

const svg = (path) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${path}"/></svg>`;
const arrow = svg('M5 12h14m-5-5 5 5-5 5');
const icons = {
    edit: 'M12 20H4V12M14 4l6 6M10 14l-1 4 4-1L21 9a2 2 0 0 0-6-6Z',
    profile: 'M20 21v-2a6 6 0 0 0-6-6h-4a6 6 0 0 0-6 6v2M16 5a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z',
    friends: 'M15 21v-2a5 5 0 0 0-5-5H8a5 5 0 0 0-5 5v2M13 6a4 4 0 1 1-8 0 4 4 0 0 1 8 0ZM19 8v6m-3-3h6',
    bell: 'M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4',
    backup: 'M20 5c0 2-4 3-8 3S4 7 4 5s4-3 8-3 8 1 8 3ZM4 5v14c0 2 4 3 8 3s8-1 8-3V5M4 12c0 2 4 3 8 3s8-1 8-3',
    admin: 'M12 3l8 3v6c0 5-8 9-8 9s-8-4-8-9V6ZM8 12l3 3 5-6',
    stats: 'M4 21V11m8 10V3m8 18v-7',
    logout: 'M9 4H4v16h5m5-12 4 4-4 4m-6-4h12',
};
const groups = [
    { label: 'Seu perfil', actions: [
        ['open-edit-profile', 'Editar perfil', 'edit', 'edit-profile-modal'],
        ['open-player-profile', 'Perfil de jogador', 'profile', 'player-profile-modal'],
    ] },
    { label: 'Sua comunidade', actions: [
        ['open-add-friend', 'Adicionar amigo', 'friends', 'add-friend-modal'],
        ['open-notifications', 'Notificações', 'bell', 'notifications-modal'],
        ['open-group-stats', 'Estatísticas do grupo', 'stats', 'group-stats-modal'],
    ] },
    { label: 'Ferramentas', ownerOnly: true, actions: [
        ['open-backup-center', 'Backup dos dados', 'backup', 'backup-modal'],
        ['open-admin-center', 'Painel admin', 'admin', 'admin-modal'],
    ] },
];

function actionMarkup([id, label, icon, destination]) {
    const badge = id === 'open-notifications' ? '<span id="notifications-dropdown-badge" class="av-account-count hidden">0</span>' : '';
    const ownerOnly = ['open-backup-center', 'open-admin-center'].includes(id);
    return `<button type="button" id="${id}" class="av-account-action${ownerOnly ? ' hidden' : ''}" ${ownerOnly ? 'hidden disabled data-account-owner-only' : ''} data-account-action data-account-destination="${destination}">${svg(icons[icon])}<span class="av-account-action-label"><span>${label}</span>${badge}</span><span class="av-account-arrow">${arrow}</span></button>`;
}

function createAccountDrawer(browser, motion, { canManageSystem = () => false, refreshAccess = () => {} } = {}) {
    const document = browser.document;
    const reduced = browser.matchMedia('(prefers-reduced-motion: reduce)');
    const animatedNodes = new Set();
    let dialog, panel, scrim, trigger, closer;
    let phase = 'closed';
    let sequence = 0;
    let installed = false;
    let previousOverflow = '';
    let closing = Promise.resolve();
    let handoff = null;

    function cancelAnimations() {
        animatedNodes.forEach((node) => motion.cancel(node));
        animatedNodes.clear();
    }

    function play(node, frames, duration, delay = 0) {
        animatedNodes.add(node);
        return motion.animate(node, frames, { channel: node, duration, delay, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'both' });
    }

    const settled = (animation) => animation ? animation.finished.catch(() => {}) : Promise.resolve();

    function setPhase(value) {
        phase = value;
        dialog.dataset.state = value;
        trigger.setAttribute('aria-expanded', String(value === 'opening' || value === 'open'));
    }

    function finishClose(restoreFocus) {
        cancelAnimations();
        setPhase('closed');
        panel.classList.add('hidden');
        document.documentElement.style.overflow = previousOverflow;
        if (dialog.open) dialog.close();
        if (browser.updateModalScrollLock) browser.updateModalScrollLock();
        else browser.lenisStart?.();
        if (restoreFocus && trigger.isConnected) trigger.focus({ preventScroll: true });
    }

    function open({ animate = true } = {}) {
        if (!installed || phase === 'open' || phase === 'opening') return;
        refreshAccess();
        const wasClosed = phase === 'closed';
        const from = wasClosed ? 'translateX(104%)' : browser.getComputedStyle(panel).transform;
        const opacity = wasClosed ? '0' : browser.getComputedStyle(scrim).opacity;
        sequence++;
        const current = sequence;
        cancelAnimations();
        if (wasClosed) {
            previousOverflow = document.documentElement.style.overflow;
            panel.classList.remove('hidden');
            dialog.showModal();
            document.documentElement.style.overflow = 'hidden';
            browser.lenisStop?.();
        }
        setPhase('opening');
        closer.focus({ preventScroll: true });
        if (!animate || reduced.matches) { setPhase('open'); return; }
        const entrance = play(panel, [{ transform: from }, { transform: 'translateX(0)' }], 280);
        play(scrim, [{ opacity }, { opacity: 1 }], 220);
        panel.querySelectorAll('[data-account-reveal]').forEach((node, index) => {
            play(node, [{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(0)' }], 200, Math.min(index * 18, 72));
        });
        settled(entrance).then(() => {
            if (current !== sequence) return;
            cancelAnimations();
            setPhase('open');
        });
    }

    function close({ animate = true, restoreFocus = true } = {}) {
        if (!installed || phase === 'closed') return Promise.resolve();
        if (phase === 'closing' && animate && !reduced.matches) return closing;
        const from = browser.getComputedStyle(panel).transform;
        const opacity = browser.getComputedStyle(scrim).opacity;
        sequence++;
        const current = sequence;
        cancelAnimations();
        setPhase('closing');
        if (!animate || reduced.matches) {
            finishClose(restoreFocus);
            return Promise.resolve();
        }
        const exit = play(panel, [{ transform: from }, { transform: 'translateX(104%)' }], 200);
        play(scrim, [{ opacity }, { opacity: 0 }], 180);
        closing = settled(exit).then(() => {
            if (current === sequence) finishClose(restoreFocus);
        });
        return closing;
    }

    function renderReviewers(friends, selectedId, onSelect, badges = () => '') {
        const container = document.getElementById('friends-dropdown-list');
        if (!container) return;
        const fragment = document.createDocumentFragment();
        friends.forEach((friend) => {
            const selected = friend.id === selectedId;
            const avatar = imageUrl(friend.avatar);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'av-account-reviewer';
            button.setAttribute('aria-pressed', String(selected));
            const portrait = avatar ? `<img src="${e(avatar)}" width="34" height="34" alt="">` : svg(icons.profile);
            button.innerHTML = `<span class="av-account-avatar">${portrait}</span><span class="av-account-reviewer-copy"><span>${e(friend.name)}</span><small>${friend.isMe ? 'Seu perfil' : 'Membro do grupo'}${badges(friend)}</small></span><span class="av-account-check">${selected ? svg('M5 12l4 4L19 6') : ''}</span>`;
            button.addEventListener('click', (event) => onSelect(friend, event));
            fragment.append(button);
        });
        if (!friends.length) {
            const empty = document.createElement('div');
            empty.className = 'av-account-empty-state';
            empty.innerHTML = `<p class="av-account-empty">Você não está conectado.</p><button type="button" id="drawer-login-action" class="av-account-login-cta"><span>Entrar na sua conta</span>${arrow}</button>`;
            const loginBtn = empty.querySelector ? empty.querySelector('#drawer-login-action') : null;
            if (loginBtn && loginBtn.addEventListener) {
                loginBtn.addEventListener('click', () => {
                    close({ animate: false });
                    const gate = document.getElementById('registration-gate');
                    if (gate) {
                        gate.classList.remove('hidden');
                        gate.classList.add('flex');
                        document.body.classList.add('overflow-hidden');
                        document.body.classList.add('auth-gate-active');
                        document.getElementById('tab-login')?.click();
                    }
                });
            }
            fragment.append(empty);
        }
        const logoutBtn = document.getElementById('logout-btn');
        if (logoutBtn) {
            logoutBtn.style.display = friends.length ? '' : 'none';
        }
        container.replaceChildren(fragment);
    }

    function mount() {
        if (installed) return;
        panel = document.getElementById('friends-dropdown');
        trigger = document.getElementById('profile-indicator');
        if (!panel || !trigger) return;
        installed = true;
        panel.className = 'av-account-panel hidden';
        panel.innerHTML = `<div class="av-account-topline" data-account-reveal><span>ANIVØID / Sua conta</span><button type="button" id="av-account-close" class="av-account-close" aria-label="Fechar menu da conta">${svg('M6 6l12 12M18 6 6 18')}</button></div><header class="av-account-heading" data-account-reveal><h2 id="av-account-title">Seu espaço<span>.</span></h2><p>Seu acervo. A sua perspectiva.</p></header><div class="av-account-scroll"><section class="av-account-reviewers" data-account-reveal aria-labelledby="av-account-reviewers-title"><h3 id="av-account-reviewers-title">Trocar avaliador</h3><div id="friends-dropdown-list"></div></section>${groups.map((group) => `<section ${group.ownerOnly ? 'id="av-account-tools" hidden' : ''} class="av-account-group" data-account-reveal aria-label="${group.label}"><h3>${group.label}</h3>${group.actions.map(actionMarkup).join('')}</section>`).join('')}</div><footer class="av-account-footer" data-account-reveal><button type="button" id="logout-btn" class="av-account-logout"><span>Desconectar conta</span>${svg(icons.logout)}</button><span>Anime. Visto de outro jeito.</span></footer>`;
        dialog = document.createElement('dialog');
        dialog.id = 'av-account-drawer';
        dialog.className = 'av-account-dialog';
        dialog.setAttribute('aria-labelledby', 'av-account-title');
        dialog.innerHTML = '<button type="button" class="av-account-scrim" tabindex="-1" aria-label="Fechar área da conta"></button>';
        dialog.append(panel);
        document.body.append(dialog);
        scrim = dialog.querySelector('.av-account-scrim');
        closer = panel.querySelector('#av-account-close');
        trigger.setAttribute('aria-haspopup', 'dialog');
        trigger.setAttribute('aria-controls', dialog.id);
        trigger.setAttribute('aria-label', 'Abrir menu da conta');
        setPhase('closed');
        refreshAccess();

        trigger.addEventListener('click', (event) => {
            event.stopPropagation();
            if (phase === 'closed' || phase === 'closing') open({ animate: event.detail > 0 });
            else close({ animate: event.detail > 0 });
        });
        closer.addEventListener('click', (event) => close({ animate: event.detail > 0 }));
        scrim.addEventListener('click', () => close());
        dialog.addEventListener('cancel', (event) => { event.preventDefault(); close({ animate: false }); });
        dialog.addEventListener('keydown', (event) => {
            if (event.key === 'Tab') {
                const controls = [...panel.querySelectorAll('button:not([disabled])')].filter((node) => node.getClientRects().length);
                const first = controls[0];
                const last = controls[controls.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last?.focus({ preventScroll: true });
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first?.focus({ preventScroll: true });
                }
                return;
            }
            if (event.key !== 'Escape') return;
            event.preventDefault();
            event.stopPropagation();
            close({ animate: false });
        });
        dialog.addEventListener('close', () => {
            if (phase === 'closed') return;
            sequence++;
            finishClose(true);
        });
        dialog.addEventListener('click', (event) => {
            const action = event.target.closest('[data-account-action]');
            if (!action) return;
            if (action.dataset.accountOwnerOnly !== undefined && !canManageSystem()) {
                event.preventDefault(); event.stopImmediatePropagation(); return;
            }
            if (handoff === action) { handoff = null; return; }
            event.preventDefault();
            event.stopImmediatePropagation();
            if (phase === 'closing') return;
            const transition = close({ animate: event.detail > 0, restoreFocus: false });
            const actionSequence = sequence;
            transition.then(() => {
                if (sequence !== actionSequence || phase !== 'closed') return;
                if (action.dataset.accountOwnerOnly !== undefined && !canManageSystem()) return;
                handoff = action;
                action.click();
                browser.requestAnimationFrame(() => {
                    const destination = document.getElementById(action.dataset.accountDestination);
                    if (destination && !destination.classList.contains('hidden')) {
                        destination.querySelector('button:not([disabled]),input:not([disabled]),[tabindex="0"]')?.focus({ preventScroll: true });
                    }
                });
            });
        }, true);
    }

    return { mount, open, close, renderReviewers, get phase() { return phase; } };
}

module.exports = { createAccountDrawer };
