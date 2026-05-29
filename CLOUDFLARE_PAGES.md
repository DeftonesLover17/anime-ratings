# Cloudflare Pages

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
