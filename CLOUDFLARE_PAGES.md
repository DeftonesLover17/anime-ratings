# Cloudflare Pages

## Validacao local

- Instale as dependencias com `npm ci`.
- Rode `npm test` e `npm run build:pages` antes de publicar.
- O build gera Tailwind localmente e publica CSS e JavaScript compactados, com nomes baseados no conteudo.
- Use Node 24 para executar tambem o teste com SQLite real. Em Node 18 esse teste especifico e pulado.

O estado usa uma revisao numerica dentro do JSON existente do D1. Cada gravacao verifica essa revisao de forma atomica; conflitos sao relidos e repetidos ate tres vezes. O navegador envia alteracoes em relacao ao ultimo snapshot, preservando mudancas feitas em outros dispositivos. Abas abertas em versoes anteriores precisam recarregar antes de salvar.

Nao existe limpeza automatica de usuarios ao ler ou salvar o estado.

Use esta configuracao para tirar imagens, CSS e JavaScript do Render e reduzir o uso da banda gratis dele.

## Configuracao recomendada

- Framework preset: `None`
- Build command: `npm run build:pages`
- Build output directory: `dist`
- Root directory: vazio
- Branch: `main`

Depois do binding D1, o site em Cloudflare Pages chama a API no proprio dominio e nao depende do Render para login, notas e amigos.

## API e D1

O projeto inclui uma Pages Function em `functions/api/[[path]].js`.

Para ativar a API no Cloudflare:

- Crie um banco D1 chamado `anivoid-db`.
- Abra o projeto `anime-ratings` no Cloudflare Pages.
- Va em `Settings` > `Functions` > `D1 database bindings`.
- Adicione um binding com:
  - Variable name: `ANIVOID_DB`
  - D1 database: `anivoid-db`
- Salve e rode um novo deploy.

As tabelas sao criadas automaticamente na primeira chamada de `/api/health`. O arquivo `cloudflare/schema.sql` existe como referencia.

## O que melhora

- Imagens, logos, CSS e JavaScript passam a sair da Cloudflare Pages.
- Com D1 configurado, o Render deixa de ser necessario para API e banco.
- O risco de estourar banda no Render cai bastante.

## Pontos de atencao

- Apos ativar D1, entre de novo uma vez para criar uma sessao nova no Cloudflare.
- Depois de trocar para Cloudflare Pages, use a URL nova do Pages como site principal.
