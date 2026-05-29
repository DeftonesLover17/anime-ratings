# Cloudflare Pages

Use esta configuracao para tirar imagens, CSS e JavaScript do Render e reduzir o uso da banda gratis dele.

## Configuracao recomendada

- Framework preset: `None`
- Build command: `npm run build:pages`
- Build output directory: `dist`
- Root directory: vazio
- Branch: `main`

O site estatico chama a API em `https://anime-ratings.onrender.com`, entao o banco e login continuam no Render por enquanto.

## O que melhora

- Imagens, logos, CSS e JavaScript passam a sair da Cloudflare Pages.
- O Render fica responsavel quase so pela API e pelo Postgres.
- O risco de estourar banda no Render cai bastante.

## Pontos de atencao

- A primeira acao que chama API ainda pode acordar o Render Free e demorar alguns segundos.
- O Postgres gratis do Render criado manualmente expira em 27 de junho de 2026, se nao for migrado ou atualizado.
- Depois de trocar para Cloudflare Pages, use a URL nova do Pages como site principal.
