const BACKGROUND_KEY = 'anivoid_background';
const BACKGROUNDS = {
    graphite: { label: 'Grafite', scheme: 'dark', bg: '#151515', surface: '#222222', line: '#414141' },
    midnight: { label: 'Azul-noturno', scheme: 'dark', bg: '#111722', surface: '#1b2534', line: '#384960' },
    plum: { label: 'Ameixa', scheme: 'dark', bg: '#1c1420', surface: '#2a2030', line: '#4b3854' },
    coffee: { label: 'Café', scheme: 'dark', bg: '#201813', surface: '#2e241d', line: '#514134' },
    sand: { label: 'Areia', scheme: 'light', bg: '#eee3d0', surface: '#faf3e7', line: '#bfb19b' }
};
function backgroundPalette(value) {
    if (Object.hasOwn(BACKGROUNDS, value)) return BACKGROUNDS[value];
    if (!/^#[0-9a-f]{6}$/i.test(value || '')) return null;
    const rgb = [1, 3, 5].map(offset => parseInt(value.slice(offset, offset + 2), 16));
    const linear = rgb.map(channel => { const c = channel / 255; return c <= .04045 ? c / 12.92 : ((c + .055) / 1.055) ** 2.4; });
    const luminance = linear[0] * .2126 + linear[1] * .7152 + linear[2] * .0722;
    const light = luminance > .179, ink = light ? '#000000' : '#ffffff';
    const mix = amount => '#' + rgb.map(channel => Math.round(channel * (1 - amount) + (light ? 0 : 255) * amount).toString(16).padStart(2, '0')).join('');
    return { scheme: light ? 'light' : 'dark', bg: value, surface: mix(.035), line: mix(.35), ink,
        muted: ink, accent: ink, onAccent: value };
}
module.exports = { BACKGROUND_KEY, BACKGROUNDS, backgroundPalette };
