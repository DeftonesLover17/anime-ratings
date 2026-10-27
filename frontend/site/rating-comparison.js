const { escapeHtml, scoreMarkup } = require('../shared/dom');
const { parseScore } = require('../ratings/model');

function ratingComparisonMarkup(ownRating, friendRating, friendName) {
    const own = parseScore(ownRating?.overall), friend = parseScore(friendRating?.overall);
    const score = value => typeof value === 'number' ? scoreMarkup(value) : '<span class="av-compare-empty">Sem nota</span>';
    return `<section class="av-card-comparison" aria-label="Comparação de notas">
        <div class="av-compare-person"><span class="av-compare-name">Você</span><span class="av-compare-score">${score(own)}</span></div>
        <span class="av-compare-versus" aria-hidden="true">×</span>
        <div class="av-compare-person"><span class="av-compare-name">${escapeHtml(friendName)}</span><span class="av-compare-score">${score(friend)}</span></div>
    </section>`;
}

module.exports = { ratingComparisonMarkup };
