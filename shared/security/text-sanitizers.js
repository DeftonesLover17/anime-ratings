function textValue(value) {
    return typeof value === 'string' || (typeof value === 'number' && Number.isFinite(value))
        ? String(value || '')
        : '';
}

function decodeHtmlEntities(value) {
    return textValue(value)
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&');
}

function escapeHtml(value, maxLength = 5000) {
    const text = decodeHtmlEntities(value)
        .replace(/\u0000/g, '')
        .slice(0, maxLength);
    return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function sanitizeColor(color) {
    const value = textValue(color).trim();
    return /^#[0-9a-fA-F]{6}$/.test(value) ? value : '#FF4500';
}

function sanitizeTextArray(values, maxItems = 20, maxLength = 80) {
    return Array.isArray(values)
        ? values.slice(0, maxItems).map(value => escapeHtml(value, maxLength)).filter(Boolean)
        : [];
}

module.exports = { textValue, escapeHtml, sanitizeColor, sanitizeTextArray };
