const THEME_KEY = 'anivoid_color_scheme';

function createThemeController(browser) {
    const document = browser.document;
    const html = document.documentElement;
    const boundControls = new WeakSet();
    let themeFrame;

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
        // Appearance remains usable when private mode or storage policies deny persistence.
        if (persist) { try { browser.localStorage.setItem(THEME_KEY, theme); } catch (_) {} }
        updateControls(theme);
        return theme;
    }

    function bindControls() {
        document.querySelectorAll('[data-theme-toggle]').forEach(button => {
            if (boundControls.has(button)) return;
            boundControls.add(button);
            button.addEventListener('click', () => setTheme(html.dataset.colorScheme === 'light' ? 'dark' : 'light'));
        });
        updateControls(html.dataset.colorScheme);
    }

    function install() {
        setTheme(readTheme(), false);
        if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bindControls, { once: true });
        else bindControls();
        browser.addEventListener('storage', event => { if (event.key === THEME_KEY) setTheme(event.newValue, false); });
    }

    return { readTheme, setTheme, install };
}

module.exports = { createThemeController };
