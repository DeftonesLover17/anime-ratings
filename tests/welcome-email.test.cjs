const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const esbuild = require('esbuild');
const source = esbuild.buildSync({ entryPoints:[path.join(__dirname,'../frontend/account/welcome-email.js')], bundle:true, write:false, platform:'node', format:'cjs', loader:{'.html':'text'} }).outputFiles[0].text;
const moduleObject = { exports:{} };
new Function('module','exports',source)(moduleObject,moduleObject.exports);
const { createWelcomeEmail, renderWelcomeEmail, welcomeParameters } = moduleObject.exports;
const profile = { name:'Ana',email:'ana@example.invalid',favoriteGenres:['Sci-Fi','Ação'],favoriteStudios:['Sunrise'] };

function fixture(send) {
    const ids = ['welcome-email-toast','welcome-email-status','welcome-email-retry','welcome-email-dialog','welcome-email-preview','welcome-email-open','welcome-email-close','welcome-email-dismiss'];
    const elements = Object.fromEntries(ids.map(id=>[id,{hidden:true,disabled:false,listeners:{},addEventListener(type,fn){(this.listeners[type] ||= []).push(fn);},showModal(){this.open=true;},close(){this.open=false;}}]));
    const browser = { document:{getElementById:id=>elements[id]},setTimeout,clearTimeout, ...(send ? {emailjs:{send}} : {}) };
    return { browser,elements,service:createWelcomeEmail(browser) };
}

test('welcome parameters preserve only the predefined template fields and bound personal data',()=>{
    const params = welcomeParameters({...profile,password:'must-never-leave',favoriteGenres:['A'.repeat(400)],name:'N'.repeat(100)});
    assert.equal(params.name.length,40);
    assert.equal(params.favorite_genres.length,80);
    assert.equal(params.password,undefined);
    assert.equal(params.html,undefined);
    assert.equal(params.reply_to,undefined);
    assert.equal(welcomeParameters({email:'a@example.invalid'}).favorite_studios,'Seu universo ainda está em descoberta.');
});

test('the actual inbox template and local preview escape dynamic text and contain only fixed site links',()=>{
    const html = renderWelcomeEmail({...profile,name:'<img src=x onerror=alert(1)>',favoriteStudios:['<script>bad()</script>']});
    assert.ok(html.includes('&lt;img src=x onerror=alert(1)&gt;'));
    assert.equal(html.includes('<script>bad()'),false);
    assert.equal(html.includes('{{name}}'),false);
    assert.equal(html.includes('Membro Fundador'),false);
    for(const [,href] of html.matchAll(/href="([^"]+)"/g)) assert.ok(href.startsWith('https://anime-ratings.pages.dev/'));
    assert.ok(html.includes('role="presentation"'));
    assert.ok(Number(html.match(/max-width:(\d+)px/)[1]) <= 600);
});

test('provider acceptance is required, pending sends are deduplicated and a sent welcome is not resent in the tab',async()=>{
    let release,calls=0;
    const f=fixture(async(service,template,params,options)=>{
        calls++;
        assert.ok(service.startsWith('service_')); assert.ok(template.startsWith('template_')); assert.ok(options.publicKey);
        assert.equal(params.email,profile.email);
        await new Promise(resolve=>{release=resolve;});
        return {status:200};
    });
    const first=f.service.send(profile),second=f.service.send(profile);
    assert.equal(first,second);
    assert.match(f.elements['welcome-email-status'].textContent,/Enviando/);
    await Promise.resolve(); release();
    assert.equal(await first,true);
    assert.match(f.elements['welcome-email-status'].textContent,/enviadas/);
    await f.service.send(profile);
    assert.equal(calls,1);
    assert.equal(f.elements['welcome-email-open'].listeners.click.length,1);
});

test('missing SDK and rejected delivery do not claim success or leave retry locked',async()=>{
    const missing=fixture();
    assert.equal(await missing.service.send(profile),false);
    missing.browser.emailjs={send:async()=>({status:200})};
    assert.equal(await missing.service.send(profile),true);
    const rejected=fixture(async()=>{throw new Error('Provider unavailable');});
    assert.equal(await rejected.service.send(profile),false);
    assert.match(rejected.elements['welcome-email-status'].textContent,/Não foi possível confirmar/);
    assert.equal(rejected.elements['welcome-email-retry'].hidden,false);
    assert.equal(rejected.elements['welcome-email-retry'].disabled,false);
});

test('the preview opens the same personalized letter in a native dialog and dismisses independently of account state',async()=>{
    const f=fixture(async()=>({status:200}));
    await f.service.send(profile);
    f.elements['welcome-email-open'].listeners.click[0]();
    assert.equal(f.elements['welcome-email-dialog'].open,true);
    assert.equal(f.elements['welcome-email-preview'].srcdoc,renderWelcomeEmail(profile));
    f.elements['welcome-email-close'].listeners.click[0]();
    assert.equal(f.elements['welcome-email-dialog'].open,false);
    f.elements['welcome-email-dismiss'].listeners.click[0]();
    assert.equal(f.elements['welcome-email-toast'].hidden,true);
});

test('Escape inside the script-disabled letter closes the parent dialog',async()=>{
    const f=fixture(async()=>({status:200}));
    await f.service.send(profile);
    const frame=f.elements['welcome-email-preview'],dialog=f.elements['welcome-email-dialog'];
    let handler,prevented=false;
    frame.contentDocument={addEventListener(type,fn){assert.equal(type,'keydown');handler=fn;}};
    frame.listeners.load[0]();
    dialog.open=true;
    handler({key:'Escape',preventDefault(){prevented=true;}});
    assert.equal(dialog.open,false);
    assert.equal(prevented,true);
});
