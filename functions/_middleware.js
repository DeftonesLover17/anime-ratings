import publicPaths from '../shared/security/public-paths.js';

export async function onRequest(context) {
    const { allowed, api: isApi } = publicPaths.classifyPublicPath(new URL(context.request.url).pathname);
    const response=allowed ? await context.next() : new Response('Not found',{status:404});
    const headers=new Headers(response.headers);
    headers.set('Strict-Transport-Security','max-age=31536000; includeSubDomains; preload');
    headers.set('X-Content-Type-Options','nosniff');
    headers.set('X-Frame-Options','DENY');
    headers.set('Referrer-Policy','strict-origin-when-cross-origin');
    if(isApi) headers.set('Cache-Control','no-store');
    return new Response(response.body,{status:response.status,statusText:response.statusText,headers});
}
