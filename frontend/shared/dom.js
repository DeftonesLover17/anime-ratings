const { scoreColor } = require('../ui/rating-scale');
const { catalogImageUrl } = require('./catalog-media');

function escapeHtml(value) {
    let text = String(value ?? '');
    const named = {
        amp: '&',
        lt: '<',
        gt: '>',
        quot: '"',
        apos: "'",
        nbsp: ' ',
    };
    for (let pass = 0; pass < 2; pass++)
        text = text.replace(
            /&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi,
            (entity, key) => {
                if (key[0] !== '#') return named[key.toLowerCase()];
                const number =
                    key[1].toLowerCase() === 'x'
                        ? parseInt(key.slice(2), 16)
                        : parseInt(key.slice(1), 10);
                return number > 0 && number <= 0x10ffff
                    ? String.fromCodePoint(number)
                    : entity;
            },
        );
    return text.replace(
        /[&<>"']/g,
        (character) =>
            ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#39;',
            })[character],
    );
}

function element(markup) {
    const template = document.createElement('template');
    template.innerHTML = markup.trim();
    return template.content.firstElementChild;
}

function imageUrl(value) {
    const url = catalogImageUrl(String(value || ''));
    return /^(?:https?:\/\/|data:image\/(?:png|jpe?g|webp|gif|svg\+xml)[;,]|(?:\.\/)?(?:covers|logos)\/)/i.test(
        url,
    )
        ? url
        : '';
}

function formatScore(value) {
    const score = Number(value);
    return Number.isFinite(score) && score > 0
        ? score.toFixed(1).replace('.', ',')
        : '—';
}

function scoreMarkup(value, className = '') {
    return `<span class="av-score ${className}" style="--av-score:${scoreColor(value).text}">${formatScore(value)}</span>`;
}

function arrow(direction = 'up') {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true" focusable="false"><path d="${direction === 'left' ? 'M19 12H5m7-7-7 7 7 7' : direction === 'right' ? 'M5 12h14m-7-7 7 7-7 7' : 'M5 19 19 5M5 5h14v14'}"/></svg>`;
}

function attachImageFallbacks(root) {
    root.querySelectorAll('img').forEach((image) => {
        image.addEventListener(
            'error',
            () => {
                image.classList.add('av-image-unavailable');
            },
            { once: true },
        );
    });
}

module.exports = {
    escapeHtml,
    element,
    imageUrl,
    formatScore,
    scoreMarkup,
    arrow,
    attachImageFallbacks,
};
