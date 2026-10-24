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
| `app.js` | Integração legada: estado, sessão, catálogo, perfis e ligação com APIs e módulos novos. |
| `frontend/site/` | Descoberta editorial, cards, detalhe, estúdios, navegação e transições entre telas. |
| `frontend/site/project-adapter.js` | Ponte explícita entre os módulos visuais e o estado legado; permissões e comandos da aplicação. |
| `frontend/ratings/model.js` | Parsing decimal, seleção e paginação de episódios; funções puras. |
| `frontend/ratings/workbench.js` | Editor real de notas, progresso, rascunhos, salvamento, desfazer e repetição de sincronização. |
| `frontend/community/` | Composição e leitura de reviews/comentários, contexto de episódio, spoilers, respostas, edição e curtidas. |
| `frontend/shared/dom.js` | Escape de texto, URLs de mídia e pequenos elementos realmente compartilhados. |
| `frontend/ui/index.js` | Inicialização dos módulos de UI e ponte explícita `window.AnivoidUI` usada pelo legado. |
| `frontend/ui/rating-scale.js` | Regra única de cores das notas; independente de DOM e persistência. |
| `frontend/ui/theme.js` | Preferência claro/escuro, armazenamento local e controles acessíveis. |
| `frontend/ui/motion.js` | Animações interrompíveis por canal e respeito à redução de movimento. |
| `frontend/ui/ui.css` | Tokens, componentes, temas, adaptações do legado e comportamento responsivo da UI. |
| `styles.css` | Estilos legados, incluindo o preload preservado. |
| `functions/api/[[path]].js` | API de produção para Cloudflare Pages/D1. |
| `server.js` | API alternativa Node, com armazenamento em arquivo ou Postgres. |
| `shared/sync-state.js` | Merge de alterações e proteção de dados usados nos dois servidores. |
| `scripts/build-pages.js` | Build de CSS/JS, hashes e cópia de mídia. |
| `tests/` | Regressões de dados, concorrência, autenticação e módulos de UI. |
| `covers/`, `logos/` | Mídia do catálogo. `sunrise-animation.png` identifica a Sunrise de animação. |
| `fonts/` | Syne e DM Sans variáveis, servidas localmente, com licenças OFL. |
| `assets/`, `dist/` | Saída gerada. Nunca editar à mão. |

O bundle de UI é carregado no `<head>` para aplicar a preferência de tema antes da primeira pintura. O build agrupa os módulos em um arquivo; `app.js` consome a ponte. Os testes importam regras diretamente, sem executar a aplicação inteira. Os renderizadores substituídos foram removidos do legado.

O projeto Pages atual publica a raiz do repositório. Por isso o build mantém os arquivos com hash em `assets/` na raiz, além de gerar `dist/`. Versionar os assets da raiz junto com `index.html`; `dist/` é ignorado.

## Regras de manutenção

Ler e seguir `AGENTS.md` antes de qualquer atualização. Regras de notas ficam em um único lugar: sem nota é neutra; abaixo de 5, vermelha; de 5 até abaixo de 7, âmbar; de 7 até abaixo de 8, verde suave; de 8 a 10, verde. O número e o rótulo continuam visíveis, portanto a informação não depende apenas da cor.

Tema não muda a cor pessoal da conta. Sinopses, preload e logout permanecem preservados. Scroll continua nativo; apenas sua barra visual fica oculta.

Para novos recursos, criar um módulo no domínio correspondente em `frontend/`. Passar dependências explicitamente e manter cálculos independentes do DOM quando viável. Testar contratos relevantes; não criar testes que apenas repetem detalhes da implementação. Fazer build e inspeção visual quando houver UI.

## Interface e compatibilidade

As telas usam toda a largura disponível com o shell compartilhado `.av-wrap` e o token `--av-page-gutter`. Cabeçalho, descoberta, acervo, detalhe, estúdios e rodapé compartilham as mesmas margens laterais. Não reintroduzir um limite fixo de largura nos shells. Limites de leitura de textos e larguras de modais continuam próprios de cada componente.

A descoberta, o catálogo, o detalhe da obra, a avaliação e os estúdios são telas da aplicação real. O estudo visual externo não é um substituto do produto nem uma fonte de dados fictícios para produção.

O editor mantém rascunhos durante a navegação entre episódios e obras na sessão. A confirmação de salvamento acompanha a resposta da API; falhas deixam os dados locais e oferecem nova tentativa. Rascunhos não publicados ficam na memória da aba, com aviso ao sair, e não representam um backup persistente.

Reviews e comentários usam a coleção de publicações existente. Os campos opcionais `kind`, `title`, `episode` e `spoiler` acrescentam contexto sem reclassificar textos antigos. Publicações antigas continuam visíveis em Tudo. A mesma política de ownership e merge protege dados de outros membros. Snapshots copiam respostas e curtidas, evitando que edições locais alterem a referência usada na sincronização.

O scroll permanece nativo, com a barra visual oculta. View Transitions usam detecção de suporte e animação breve como fallback. Transições podem ser interrompidas, botões de seção aguardam a liberação da cena e a redução de movimento mantém as telas completas. A lista de episódios renderiza até 40 opções por página.

As fontes Syne e DM Sans vieram de Google Fonts e dos repositórios oficiais `google/fonts`, sob OFL. Seus nomes internos de CSS são exclusivos do layout novo; as fontes, os recursos, o HTML e a lógica do preload foram preservados.

## Dívidas conhecidas

`app.js` ainda concentra cerca de 8,9 mil linhas, incluindo catálogo inicial, autenticação, perfis, administração e estado. Descoberta, cards, estúdios, editor de notas e comunidade agora têm módulos próprios. `styles.css` contém regras antigas com especificidade alta; exceções de compatibilidade da UI nova são delimitadas em `frontend/`. A atualização não elimina toda a dívida do legado.

A migração deve ser incremental, por funcionalidade: extrair estado/API, depois renderizadores e controladores de cada tela conforme forem alterados. Evitar reescrita geral durante uma correção pontual. Atualizar este mapa e manter os testes de preservação de dados em cada etapa.
