const { BACKGROUND_KEY, BACKGROUNDS, backgroundPalette } = require('./backgrounds');

function createThemeController(browser) {
    const document = browser.document;
    const html = document.documentElement;
    const boundControls = new WeakSet();
    let themeFrame;
    let background = '';
    function applyBackground(value) {
        const palette = backgroundPalette(value);
        background = palette ? value : '';
        for (const [token, field] of [['--av-bg', 'bg'], ['--av-surface', 'surface'], ['--av-line', 'line'], ['--av-ink', 'ink'], ['--av-muted', 'muted']]) {
            if (palette?.[field]) html.style.setProperty(token, palette[field]);
            else html.style.removeProperty(token);
        }
        if (palette?.accent) {
            html.style.setProperty('--av-accent', palette.accent);
            if (palette?.onAccent) html.style.setProperty('--av-on-accent', palette.onAccent);
        } else if (typeof browser.applyUserThemeColor === 'function') {
            browser.applyUserThemeColor();
        }
        const picker = document.querySelector('[data-background-picker]');
        const hex = document.querySelector('[data-background-hex]');
        if (picker) picker.value = palette?.bg || '#121510';
        if (hex && document.activeElement !== hex) hex.value = palette?.bg || '#121510';
        document.querySelectorAll('[data-background]').forEach(button => {
            button.setAttribute('aria-pressed', String(button.dataset.background === background));
        });
    }
    function setBackground(value, persist = true) {
        const palette = backgroundPalette(value);
        setTheme(palette?.scheme || 'dark');
        applyBackground(value);
        if (persist) {
            try {
                browser.localStorage.setItem(BACKGROUND_KEY, background);
                const currentUser = (typeof browser.getSessionUsername === 'function' ? browser.getSessionUsername() : '')
                    || (browser.AnivoidUI?.session?.username ? browser.AnivoidUI.session.username() : '')
                    || browser.localStorage?.getItem('anivoid_logged_in_username')
                    || '';
                if (currentUser) {
                    const cleanUser = currentUser.toLowerCase().replace(/[^a-z0-9]/g, '');
                    browser.localStorage?.setItem(`${BACKGROUND_KEY}_${cleanUser}`, background);
                }
            } catch (_) {}
        }
    }

    function applyUserBackground(username) {
        const cleanUser = String(username || '').toLowerCase().replace(/[^a-z0-9]/g, '');
        try {
            if (cleanUser) {
                const userBg = browser.localStorage?.getItem(`${BACKGROUND_KEY}_${cleanUser}`);
                if (userBg !== null && userBg !== undefined) {
                    setBackground(userBg, false);
                    return;
                }
            }
            const globalBg = browser.localStorage?.getItem(BACKGROUND_KEY);
            if (globalBg && backgroundPalette(globalBg)) {
                setBackground(globalBg, false);
            } else {
                setBackground('', false);
            }
        } catch (_) {}
    }

    function suppressColorTransitions() {
        html.classList.add('theme-changing');
        browser.cancelAnimationFrame(themeFrame);
        themeFrame = browser.requestAnimationFrame(() => {
            themeFrame = browser.requestAnimationFrame(() => html.classList.remove('theme-changing'));
        });
    }

    function setTheme(value) {
        const theme = value === 'light' ? 'light' : 'dark';
        if (html.dataset.colorScheme && html.dataset.colorScheme !== theme) suppressColorTransitions();
        html.dataset.colorScheme = theme;
        html.style.colorScheme = theme;
        applyBackground('');
        return theme;
    }

    function bindControls() {
        const picker = document.querySelector('[data-background-picker]');
        const hex = document.querySelector('[data-background-hex]');
        if (picker && hex && !boundControls.has(picker)) {
            boundControls.add(picker);
            const applyCustom = value => {
                const valid = /^#[0-9a-f]{6}$/i.test(value);
                hex.setCustomValidity(valid ? '' : 'Use uma cor hexadecimal com seis dígitos, como #17243A.');
                hex.setAttribute('aria-invalid', String(!valid));
                const status = document.querySelector('[data-background-status]');
                if (!valid) { if (status) status.textContent = 'Digite # seguido de seis dígitos, como #17243A.'; return; }
                setBackground(value.toLowerCase());
                if (status) status.textContent = `Fundo ${value.toUpperCase()} aplicado e salvo neste navegador.`;
            };
            picker.addEventListener('input', () => { hex.value = picker.value; applyCustom(picker.value); });
            picker.addEventListener('change', () => { hex.value = picker.value; applyCustom(picker.value); });
            hex.addEventListener('input', () => applyCustom(hex.value.trim()));
        }
        const choices = document.querySelector('[data-background-choices]');
        if (choices && !choices.childElementCount) {
            for (const [id, palette] of [['', { label: 'Padrão', bg: '#121510' }], ...Object.entries(BACKGROUNDS)]) {
                const button = document.createElement('button');
                button.type = 'button'; button.dataset.background = id; button.className = 'av-background-choice';
                button.style.setProperty('--swatch', palette.bg);
                button.textContent = palette.label;
                button.addEventListener('click', () => {
                    if (hex) { hex.setCustomValidity(''); hex.setAttribute('aria-invalid', 'false'); }
                    setBackground(id);
                    const status = document.querySelector('[data-background-status]');
                    if (status) status.textContent = `Fundo ${palette.label.toLowerCase()} aplicado e salvo neste navegador.`;
                });
                choices.appendChild(button);
            }
            applyBackground(background);
        }
    }

    function install() {
        let saved = '';
        try { saved = browser.localStorage.getItem(BACKGROUND_KEY) || ''; } catch (_) {}
        setBackground(saved, false);
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindControls, { once: true });
        else bindControls();
        browser.addEventListener('storage', event => {
            if (event.key === BACKGROUND_KEY) {
                if (backgroundPalette(event.newValue)) setBackground(event.newValue, false);
                else setBackground('', false);
            }
        });
    }

    return { setTheme, setBackground, applyUserBackground, install };
}

module.exports = { createThemeController };
