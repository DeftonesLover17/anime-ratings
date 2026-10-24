# ANIVØID

Catálogo de animes com avaliações por episódio, críticas e perfis de estúdios.

## Desenvolvimento

O runtime aceita Node.js 18 ou mais recente. Para executar a suíte completa de testes, usar Node.js 24, versão validada nesta atualização (os testes de concorrência usam `node:sqlite`).

```sh
npm ci
npm test
npm run build:pages
npm start
```

`npm start` executa o servidor Node e recompila os assets. A produção usa Cloudflare Pages Functions e D1. As configurações de banco e autenticação devem vir do ambiente; nunca versionar credenciais.

## Mapa do código

| Local | Responsabilidade |
| --- | --- |
| `index.html` | Estrutura das telas e referências aos assets compilados. |
| `app.js` | Integração legada: estado do catálogo, renderização e ligação entre telas e APIs. |
| `frontend/ui/index.js` | Inicialização dos módulos de UI e ponte explícita `window.AnivoidUI` usada pelo legado. |
| `frontend/ui/rating-scale.js` | Regra única de cores das notas; independente de DOM e persistência. |
| `frontend/ui/score-input.js` | Preview, normalização decimal e confirmação dos campos de nota. |
| `frontend/ui/theme.js` | Preferência claro/escuro, armazenamento local e controles acessíveis. |
| `frontend/ui/motion.js` | Animações interrompíveis por canal e respeito à redução de movimento. |
| `frontend/ui/ui.css` | Tokens, componentes, temas, adaptações do legado e comportamento responsivo da UI. |
| `styles.css` | Estilos legados, incluindo o preload preservado. |
| `functions/api/[[path]].js` | API de produção para Cloudflare Pages/D1. |
| `server.js` | API alternativa Node, com armazenamento em arquivo ou Postgres. |
| `shared/sync-state.js` | Merge de alterações e proteção de dados usados nos dois servidores. |
| `scripts/build-pages.js` | Build de CSS/JS, hashes e cópia de mídia. |
| `tests/` | Regressões de dados, concorrência, autenticação e módulos de UI. |
| `covers/`, `logos/` | Mídia do catálogo. Não são dados de conta. |
| `assets/`, `dist/` | Saída gerada. Nunca editar à mão. |

O bundle pequeno de UI é carregado no `<head>` para aplicar a preferência de tema antes da primeira pintura. O build agrupa seus módulos em um arquivo; `app.js` apenas consome a ponte. Os testes importam os módulos diretamente, sem executar a aplicação inteira.

O projeto Pages atual publica a raiz do repositório. Por isso o build mantém os arquivos com hash em `assets/` na raiz, além de gerar `dist/`. Versionar os assets da raiz junto com `index.html`; `dist/` é ignorado.

## Regras de manutenção

Ler e seguir `AGENTS.md` antes de qualquer atualização. Regras de notas ficam em um único lugar: sem nota é neutra; abaixo de 5, vermelha; de 5 até abaixo de 7, âmbar; de 7 até abaixo de 8, verde suave; de 8 a 10, verde. O número e o rótulo continuam visíveis, portanto a informação não depende apenas da cor.

Tema não muda a cor pessoal da conta. Sinopses, preload e logout permanecem preservados. Scroll continua nativo; apenas sua barra visual fica oculta.

Para novos recursos, criar um módulo no domínio correspondente em `frontend/`. Passar dependências explicitamente e manter cálculos independentes do DOM quando viável. Testar contratos relevantes; não criar testes que apenas repetem detalhes da implementação. Fazer build e inspeção visual quando houver UI.

## Dívidas conhecidas

`app.js` ainda concentra mais de 10 mil linhas, incluindo catálogo inicial, autenticação, perfis, comentários e renderizadores. `styles.css` contém regras antigas com especificidade alta. Esta atualização extrai a política de notas, os temas e o controle de movimento; ela não elimina toda a dívida do legado.

A migração deve ser incremental, por funcionalidade: extrair estado/API, depois renderizadores e controladores de cada tela conforme forem alterados. Evitar reescrita geral durante uma correção pontual. Atualizar este mapa e manter os testes de preservação de dados em cada etapa.
