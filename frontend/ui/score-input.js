const { scoreColor } = require('./rating-scale');

function bindScoreInput(input, onCommit) {
    const preview = () => { input.style.color = scoreColor(input.value).text; };
    input.addEventListener('input', preview);
    input.addEventListener('change', () => {
        const number = Number.parseFloat(input.value);
        const value = Number.isFinite(number) ? Math.min(10, Math.max(0, Math.round(number * 10) / 10)) : '';
        input.value = value;
        preview();
        onCommit(value);
    });
    input.addEventListener('keydown', event => { if (event.key === 'Enter') input.blur(); });
    preview();
}

module.exports = { bindScoreInput };
