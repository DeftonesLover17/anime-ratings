const { discoverAnimeLogo } = require('./logo-discovery');
const { resolveAnimeLogo, sanitizeAnimeLogoUrl } = require('../site/anime-logo-presentation');

const fieldsByDocument = new WeakMap();

function createCatalogLogoField(document, options = {}) {
    const title = document.getElementById('form-anime-title');
    const japaneseTitle = document.getElementById('form-anime-jp-title');
    const logo = document.getElementById('form-anime-logo');
    const textOnly = document.getElementById('form-anime-logo-disabled');
    const form = document.getElementById('add-anime-form');
    let sequence = 0, pending = null, timer = null, edited = false, autoKey = '';
    let selected = null;
    const placeholder = logo?.placeholder || '';
    const config = { discover: discoverAnimeLogo, updatePreview() {}, setTimer: setTimeout, clearTimer: clearTimeout, ...options };
    const identity = () => JSON.stringify([title?.value.trim() || '', japaneseTitle?.value.trim() || '']);

    function validate() {
        const invalid = !textOnly?.checked && logo?.value.trim() && !sanitizeAnimeLogoUrl(logo.value);
        logo?.setCustomValidity?.(invalid ? 'Use uma URL https:// válida ou um arquivo em logos/.' : '');
        return !invalid;
    }

    function cancel() {
        sequence++;
        pending?.abort();
        pending = null;
        if (timer !== null) config.clearTimer(timer);
        timer = null;
        if (logo) { logo.placeholder = placeholder; logo.removeAttribute?.('aria-busy'); }
    }

    function clearAutomatic() {
        if (logo && autoKey) logo.value = '';
        autoKey = '';
    }

    async function fill(anime) {
        if (!logo || !title || logo.disabled || form?.getAttribute?.('aria-busy') === 'true' ||
            textOnly?.checked || edited || logo.value.trim() || title.value.trim().length < 2) return '';
        cancel();
        const key = identity(), current = sequence;
        const controller = new AbortController();
        pending = controller;
        logo.placeholder = 'Buscando logo em inglês...';
        logo.setAttribute?.('aria-busy', 'true');
        try {
            const url = sanitizeAnimeLogoUrl(await config.discover(anime || {
                title: title.value.trim(), japaneseTitle: japaneseTitle?.value.trim() || ''
            }, { signal: controller.signal }));
            if (current !== sequence || identity() !== key || controller.signal.aborted || edited || textOnly?.checked) return '';
            if (url) { logo.value = url; autoKey = key; config.updatePreview(); }
            return url;
        } catch { return ''; }
        finally {
            if (current === sequence) {
                pending = null;
                logo.placeholder = placeholder;
                logo.removeAttribute?.('aria-busy');
            }
        }
    }

    function schedule() {
        if (timer !== null) config.clearTimer(timer);
        timer = config.setTimer(() => { timer = null; fill(selected); }, 180);
    }

    function onTitleInput() {
        cancel();
        selected = null;
        if (autoKey && autoKey !== identity()) clearAutomatic();
    }

    function reset(anime = null) {
        cancel();
        edited = false;
        autoKey = '';
        selected = null;
        if (!logo) return;
        delete logo.dataset.autoFilled;
        delete logo.dataset.autoForTitle;
        if (textOnly) textOnly.checked = anime?.logoDisabled === true;
        logo.disabled = textOnly?.checked || false;
        logo.value = anime?.logoDisabled ? '' : sanitizeAnimeLogoUrl(anime?.logoUrl) || resolveAnimeLogo(anime)?.url || '';
        if (logo.value) autoKey = identity();
        validate();
    }

    function select(anime) {
        cancel();
        if (!edited) clearAutomatic();
        edited = false;
        selected = { ...anime };
        return fill(selected);
    }

    if (title && logo) {
        for (const input of [title, japaneseTitle].filter(Boolean)) {
            input.addEventListener('input', onTitleInput);
            input.addEventListener('change', schedule);
            input.addEventListener('blur', schedule);
        }
        logo.addEventListener('input', () => { cancel(); edited = true; autoKey = ''; validate(); });
        textOnly?.addEventListener('change', () => {
            cancel();
            logo.disabled = textOnly.checked;
            if (textOnly.checked) { logo.value = ''; edited = true; autoKey = ''; }
            else { edited = false; schedule(); }
            validate();
            config.updatePreview();
        });
        form?.addEventListener('reset', () => reset());
    }

    return {
        reset, select, cancel,
        configure: next => Object.assign(config, next),
        capture() {
            cancel();
            if (autoKey && autoKey !== identity()) clearAutomatic();
            if (!validate()) { logo?.reportValidity?.(); return null; }
            return { logoUrl: textOnly?.checked ? '' : sanitizeAnimeLogoUrl(logo?.value), logoDisabled: textOnly?.checked || false };
        }
    };
}

function getCatalogLogoField(document, options = {}) {
    let controller = fieldsByDocument.get(document);
    if (!controller) {
        controller = createCatalogLogoField(document, options);
        fieldsByDocument.set(document, controller);
    } else controller.configure(options);
    return controller;
}

module.exports = { getCatalogLogoField, createCatalogLogoField };
