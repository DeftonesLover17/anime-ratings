function classifyPublicPath(pathname) {
    let path;
    try { path = decodeURIComponent(pathname); } catch { return { allowed: false, api: false }; }
    if (path.includes('\\') || path.split('/').some(part => part === '..' || part.startsWith('.')) || /%(?:2f|2e|5c)/i.test(path)) return { allowed: false, api: false };
    const api = path.startsWith('/api/');
    const asset = /^\/assets\/(?:(?:ui|app|sync-state)\.[a-f0-9]{12}\.js|(?:styles|tailwind)\.[a-f0-9]{12}\.css)$/.test(path);
    const allowed = api || asset || ['/', '/index.html', '/favicon.png', '/logo.png', '/robots.txt'].includes(path)
        || /^\/fonts\/[a-zA-Z0-9._-]+\.woff2$/.test(path)
        || /^\/(?:covers|logos)\/[a-zA-Z0-9_./ -]+\.(?:png|jpe?g|webp|gif|svg)$/.test(path);
    return { allowed, api };
}
module.exports = { classifyPublicPath };
