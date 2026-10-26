// Isolated preview: renders the exact EmailJS source and never sends an email.
const http = require('node:http');
const path = require('node:path');
const fs = require('node:fs');
const esbuild = require('esbuild');
const root = path.resolve(__dirname,'..');
const bundle = esbuild.buildSync({entryPoints:[path.join(root,'frontend/account/welcome-email.js')],bundle:true,write:false,platform:'node',format:'cjs',loader:{'.html':'text'}}).outputFiles[0].text;
const mod={exports:{}};
new Function('module','exports',bundle)(mod,mod.exports);
const profile={name:'Felipe',email:'preview@example.invalid',favoriteGenres:['Sci-Fi','Ação','Drama'],favoriteStudios:['Sunrise','Trigger','Kyoto Animation']};
const browserBundle=esbuild.buildSync({entryPoints:[path.join(root,'frontend/account/welcome-email.js')],bundle:true,write:false,platform:'browser',format:'iife',globalName:'WelcomePreview',loader:{'.html':'text'}}).outputFiles[0].text;
const markup=fs.readFileSync(path.join(root,'index.html'),'utf8');
const component=markup.slice(markup.indexOf('    <!-- Welcome delivery status'),markup.indexOf('    <!-- EDIT PROFILE MODAL'));
const csp=fs.readFileSync(path.join(root,'_headers'),'utf8').match(/Content-Security-Policy: (.+)/)[1].trim();
const server=http.createServer((request,response)=>{
    const url=new URL(request.url,'http://127.0.0.1');
    if(url.pathname==='/delivery.js'){
        response.writeHead(200,{'Content-Type':'text/javascript'});
        response.end(browserBundle+`;window.emailjs={send:async()=>({status:200})};const preview=WelcomePreview.createWelcomeEmail(window);document.getElementById('show-delivery').addEventListener('click',()=>preview.send(${JSON.stringify(profile)}));`);
        return;
    }
    if(url.pathname==='/delivery.css'){
        response.writeHead(200,{'Content-Type':'text/css'});
        response.end(fs.readFileSync(path.join(root,'frontend/account/welcome-email.css'),'utf8')+'body{margin:0;padding:32px;background:#10150f;color:#f3f1e8;font-family:Arial,sans-serif;--av-bg:#10150f;--av-ink:#f3f1e8;--av-muted:#aeb8a3;--av-line:#3b4435;--av-accent:#ff7957}button{min-height:44px}');
        return;
    }
    if(url.pathname==='/delivery'){
        response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Content-Security-Policy':csp,'Cache-Control':'no-store'});
        response.end('<!doctype html><html lang="pt-BR"><head><meta name="viewport" content="width=device-width,initial-scale=1"><title>Validação isolada de boas-vindas</title><link rel="stylesheet" href="/delivery.css"><script defer src="/delivery.js"></script></head><body><h1>Validação isolada</h1><p>Este teste não envia e-mails nem cria contas.</p><button id="show-delivery">Simular aceite do provedor</button>'+component+'</body></html>');
        return;
    }
    if(url.pathname !== '/welcome' && url.pathname !== '/welcome-long'){response.writeHead(404);response.end();return;}
    const user=url.pathname.endsWith('long')?{...profile,name:'UmNomeDeUsuarioComQuarentaCaracteresAgoraXX',favoriteStudios:['Kyoto Animation','Tokyo Movie Shinsha','Production I.G','Wit Studio','Sunrise','Trigger']}:profile;
    response.writeHead(200,{'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-store'});
    response.end(mod.exports.renderWelcomeEmail(user));
});
server.listen(8772,'127.0.0.1',()=>console.log('Email preview: http://127.0.0.1:8772/welcome'));
