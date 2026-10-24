// Pure presentation policy. A theme change only replaces the CSS token values.
function scoreTone(value) {
    const number = typeof value === 'number' ? value : Number(String(value ?? '').trim().replace(',', '.'));
    if (!Number.isFinite(number) || number <= 0 || number > 10) return 'neutral';
    if (number >= 8) return 'high';
    if (number >= 7) return 'good';
    return number >= 5 ? 'mid' : 'low';
}

function scoreColor(value) {
    const tone = scoreTone(value);
    return { tone, text: `var(--score-${tone})`, glow: `var(--score-${tone}-glow)` };
}

module.exports = { scoreTone, scoreColor };
