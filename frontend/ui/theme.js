const THEME_KEY = 'anivoid_color_scheme';
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
        setTheme(palette?.scheme || 'dark', persist);
        applyBackground(value);
        if (persist) { try { browser.localStorage.setItem(BACKGROUND_KEY, background); } catch (_) {} }
    }

    function readTheme() {
        try { return browser.localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'; }
        catch (_) { return 'dark'; }
    }

    function updateControls(theme) {
        document.querySelectorAll('[data-theme-toggle]').forEach(button => {
            const target = theme === 'light' ? 'escuro' : 'claro';
            button.setAttribute('aria-label', `Ativar modo ${target}`);
            button.title = `Ativar modo ${target}`;
            const label = button.querySelector('[data-theme-label]');
            if (label) label.textContent = target === 'claro' ? 'Claro' : 'Escuro';
            const symbol = button.querySelector('[data-theme-symbol]');
            if (symbol) symbol.textContent = theme === 'light' ? '◐' : '☼';
        });
    }

    function suppressColorTransitions() {
        html.classList.add('theme-changing');
        browser.cancelAnimationFrame(themeFrame);
        themeFrame = browser.requestAnimationFrame(() => {
            themeFrame = browser.requestAnimationFrame(() => html.classList.remove('theme-changing'));
        });
    }

    function setTheme(value, persist = true) {
        const theme = value === 'light' ? 'light' : 'dark';
        if (html.dataset.colorScheme && html.dataset.colorScheme !== theme) suppressColorTransitions();
        html.dataset.colorScheme = theme;
        html.style.colorScheme = theme;
        applyBackground('');
        // Appearance remains usable when private mode or storage policies deny persistence.
        if (persist) { try { browser.localStorage.setItem(THEME_KEY, theme); browser.localStorage.removeItem(BACKGROUND_KEY); } catch (_) {} }
        updateControls(theme);
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
        document.querySelectorAll('[data-theme-toggle]').forEach(button => {
            if (boundControls.has(button)) return;
            boundControls.add(button);
            button.addEventListener('click', () => setTheme(html.dataset.colorScheme === 'light' ? 'dark' : 'light'));
        });
        updateControls(html.dataset.colorScheme);
    }

    function install() {
        setTheme(readTheme(), false);
        try { const saved = browser.localStorage.getItem(BACKGROUND_KEY); if (backgroundPalette(saved)) setBackground(saved, false); } catch (_) {}
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindControls, { once: true });
        else bindControls();
        browser.addEventListener('storage', event => {
            if (event.key === THEME_KEY) setTheme(event.newValue, false);
            if (event.key === BACKGROUND_KEY) {
                if (backgroundPalette(event.newValue)) setBackground(event.newValue, false);
                else applyBackground('');
            }
        });
    }

    return { readTheme, setTheme, install };
}

module.exports = { createThemeController };
