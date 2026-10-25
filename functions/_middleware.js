export async function onRequest(context) {
    let path;
    try { path=decodeURIComponent(new URL(context.request.url).pathname); }
    catch { return new Response('Not found',{status:404}); }
    const privatePath=path.includes('\\') || path.split('/').some(part=>part==='..' || part.startsWith('.')) || /%(?:2f|2e|5c)/i.test(path);
    const isApi=path.startsWith('/api/');
    const publicPath=path==='/' || path==='/index.html' || ['/favicon.png','/logo.png','/robots.txt'].includes(path)
        || /^\/assets\/[a-zA-Z0-9._-]+\.(?:js|css)$/.test(path)
        || /^\/fonts\/[a-zA-Z0-9._-]+\.woff2$/.test(path)
        || /^\/(?:covers|logos)\/[a-zA-Z0-9_./ -]+\.(?:png|jpe?g|webp|gif|svg)$/.test(path);
    const response=!privatePath && (isApi || publicPath) ? await context.next() : new Response('Not found',{status:404});
    const headers=new Headers(response.headers);
    headers.set('Strict-Transport-Security','max-age=31536000; includeSubDomains; preload');
    headers.set('X-Content-Type-Options','nosniff');
    headers.set('X-Frame-Options','DENY');
    headers.set('Referrer-Policy','strict-origin-when-cross-origin');
    if(isApi) headers.set('Cache-Control','no-store');
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
