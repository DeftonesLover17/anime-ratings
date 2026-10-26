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
| `frontend/account/` | Gaveta da conta, seleção de avaliador e transições interrompíveis de abertura, fechamento e passagem às ações existentes. |
| `frontend/account/session.js` | Logout confirmado pela API, limpeza de cache privado e confirmação de e-mail por prova do servidor. |
| `frontend/account/login-client.js` | Login com timeout, confirmação do cookie, erros de conexão e troca obrigatória de senha. |
| `frontend/account/request.js` | Transporte de conta com timeout, erros e Retry-After; sem repetir mutações. |
| `frontend/account/profile-client.js` | Salvamento atômico do perfil/senha e confirmação do cookie renovado. |
| `frontend/account/profile-form.js` | Confirmação de senha, bloqueio de envios repetidos e preservação de edições durante atualização de cache. |
| `frontend/account/login-form.js` | Campos de login/redefinição, confirmação de senha, feedback acessível e bloqueio de envios duplicados. |
| `frontend/account/storage.js` | Cache opcional com fallback em memória quando o navegador bloqueia ou esgota o armazenamento. |
| `frontend/account/welcome-email.js` | Envio pelo EmailJS existente, confirmação de aceite, repetição e prévia fiel da mensagem de boas-vindas. |
| `frontend/account/email-config.js` | Identificadores públicos do serviço/template EmailJS; não contém senha Gmail ou chave privada. |
| `emails/welcome.html` | Fonte única do e-mail responsivo, instalada no EmailJS e usada na prévia local. |
| `scripts/preview-welcome.cjs` | Prévia isolada em loopback; não envia e-mails. |
| `frontend/profiles/` | Modelo defensivo de perfis e estatísticas, foco e fechamento interrompível das janelas de perfil/amigos. |
| `frontend/security/api-client.js` | Deduplicação de leituras simultâneas e respeito a Retry-After, sem repetir mutações. |
| `frontend/security/cache.js` | Limpeza de credenciais legadas do cache, preservando notas e bases de sincronização. |
| `frontend/security/dom-actions.js` | Eventos delegados que substituem handlers HTML inline sob CSP restrita. |
| `frontend/shared/dom.js` | Escape de texto, URLs de mídia e pequenos elementos realmente compartilhados. |
| `frontend/shared/catalog-media.js` | Substituições de pôsteres do catálogo por arquivos locais, preservando os dados e as avaliações. |
| `frontend/ui/index.js` | Inicialização dos módulos de UI e ponte explícita `window.AnivoidUI` usada pelo legado. |
| `frontend/ui/rating-scale.js` | Regra única de cores das notas; independente de DOM e persistência. |
| `frontend/ui/theme.js` | Preferência claro/escuro, armazenamento local e controles acessíveis. |
| `frontend/ui/motion.js` | Animações interrompíveis por canal e respeito à redução de movimento. |
| `frontend/ui/ui.css` | Tokens, componentes, temas, adaptações do legado e comportamento responsivo da UI. |
| `styles.css` | Estilos legados, incluindo o preload preservado. |
| `functions/api/[[path]].js` | API de produção para Cloudflare Pages/D1. |
| `server.js` | API alternativa Node, com armazenamento em arquivo ou Postgres. |
| `shared/security/` | Identidade, unicidade, autorização, política de senha, origem, limites JSON e campos editáveis. |
| `shared/security/responses.js` | Projeções explícitas sem credenciais para API, cache e exportações do navegador. |
| `shared/security/public-paths.js` | Allowlist comum de arquivos públicos dos servidores; assets compilados identificados por hash. |
| `shared/security/rate-limits.js` | Orçamentos da API e limitador Node com memória limitada. |
| `backend/cloudflare/rate-limit.js` | Contadores atômicos D1 e cache limitado de bloqueios já confirmados. |
| `backend/cloudflare/` | Persistência D1 das sessões e provas de e-mail; tokens armazenados como hash. |
| `backend/node/` | Adaptadores de sessão, e-mail e operações de conta do servidor Node. |
| `backend/security/email-verification.js` | Emissão, expiração e consumo de provas reais de posse do e-mail. |
| `functions/_middleware.js` | Allowlist dos arquivos públicos e cabeçalhos também nas respostas da API. |
| `config/security-headers.template` | Fonte dos cabeçalhos; o build calcula os hashes CSP sem alterar o preload. |
| `docs/security.md` | Operação, migração de sessões, configuração de administradores e envio de e-mail. |
| `shared/sync-state.js` | Merge de alterações e proteção de dados usados nos dois servidores. |
| `shared/studio-metadata.js` | Estúdios confirmados por título exato e leitura de créditos da importação, compartilhados entre UI e APIs. |
| `scripts/browser-security.js` | Impede dependências privadas e valores secretos nos arquivos compilados do navegador. |
| `scripts/build-pages.js` | Build de CSS/JS, hashes e cópia de mídia. |
| `tests/` | Regressões de dados, concorrência, autenticação e módulos de UI. |
| `covers/`, `logos/` | Mídia do catálogo. `sunrise-animation.png` identifica a Sunrise de animação. |
| `fonts/` | Syne e DM Sans variáveis, servidas localmente, com licenças OFL. |
| `assets/`, `dist/` | Saída gerada. Nunca editar à mão. |

O bundle de UI é carregado no `<head>` para aplicar a preferência de tema antes da primeira pintura. O build agrupa os módulos em um arquivo; `app.js` consome a ponte. Os testes importam regras diretamente, sem executar a aplicação inteira. Os renderizadores substituídos foram removidos do legado.

O projeto Pages atual publica a raiz do repositório. Por isso o build mantém os arquivos com hash em `assets/` na raiz, além de gerar `dist/`. Versionar os assets da raiz junto com `index.html`; `dist/` é ignorado.

## Regras de manutenção

Ler e seguir `AGENTS.md` antes de qualquer atualização. Regras de notas ficam em um único lugar: sem nota é neutra; abaixo de 5, vermelha; de 5 até abaixo de 7, âmbar; de 7 até abaixo de 8, verde suave; de 8 a 10, verde. O número e o rótulo continuam visíveis, portanto a informação não depende apenas da cor.

Tema não muda a cor pessoal da conta. Sinopses e preload permanecem preservados. O logout mantém seu ponto de entrada e agora revoga a sessão no servidor, conforme o pedido de correção de segurança. Scroll continua nativo; apenas sua barra visual fica oculta.

Para novos recursos, criar um módulo no domínio correspondente em `frontend/`. Passar dependências explicitamente e manter cálculos independentes do DOM quando viável. Testar contratos relevantes; não criar testes que apenas repetem detalhes da implementação. Fazer build e inspeção visual quando houver UI.

## Interface e compatibilidade

As telas usam toda a largura disponível com o shell compartilhado `.av-wrap` e o token `--av-page-gutter`. Cabeçalho, descoberta, acervo, detalhe, estúdios e rodapé compartilham as mesmas margens laterais. Não reintroduzir um limite fixo de largura nos shells. Limites de leitura de textos e larguras de modais continuam próprios de cada componente.

A área da conta usa um diálogo lateral nativo, com foco contido, Escape, retorno ao botão de origem e rolagem interna. A gaveta fecha antes de abrir a ação escolhida. O movimento é interrompível, fica imediato pelo teclado ou com redução de movimento e reutiliza a curva do site. Os handlers existentes de perfis, amigos, notificações, backup, administração e logout permanecem no integrador legado.

## Segurança

Permissões são conferidas no servidor. Cada conta recebe um `accountId` estável, atribuído a contas antigas na primeira gravação necessária, sem reescrever dados durante leituras. As referências legadas de notas e publicações são preservadas; nomes equivalentes são rejeitados no cadastro e colisões históricas falham de forma fechada. Nunca fundir ou excluir contas automaticamente para resolver uma colisão.

Sessões novas usam tokens aleatórios, hash no D1, limite de inatividade de 24 horas e prazo absoluto de sete dias. A tabela versionada `auth_sessions` não aceita os tokens legados. Após publicar essa correção, os usuários entram novamente uma vez. Trocas de senha e e-mail exigem a senha atual na API e revogam as sessões anteriores. A sincronização não pode mudar credenciais, e-mail, autoridade administrativa ou verificação de e-mail.

O nome em cache não autentica a interface. A entrada confirma o cookie em `/api/users`; cada carregamento restaura a identidade a partir do servidor. Respostas iniciadas antes de um novo login/logout são descartadas. Uma resposta pública sem `viewerUsername` autenticado encerra a identidade local; falhas de conexão ou permissão não são apresentadas como senha incorreta. A sincronização informa o usuário esperado e recusa troca de conta entre abas antes de aplicar o delta. Senhas preservam todos os caracteres digitados. Login não transfere avaliações históricas de um perfil para outro.

O cache local é uma otimização, não um requisito de autenticação. Quando o navegador recusa a persistência, os dados ficam apenas na memória da aba e são recuperados novamente do servidor ao recarregar. Isso não transforma alterações ainda não sincronizadas em backup persistente.

Boas-vindas são enviadas depois da criação confirmada da conta pelo serviço Gmail já conectado ao EmailJS. Os três identificadores públicos selecionam um template predefinido e são próprios do SDK de navegador; nenhuma credencial Gmail ou chave privada entra no bundle. O template só recebe texto escapado, com links fixos do site. Nunca usar uma variável de HTML arbitrário no painel. Uma resposta 200 do provedor confirma aceite para envio, não leitura nem chegada garantida à caixa principal. Falhas não desfazem o cadastro e oferecem nova tentativa explícita. O template remoto precisa acompanhar `emails/welcome.html`; alterar somente a prévia não muda o que chega ao destinatário.

Esse e-mail de boas-vindas não verifica o endereço nem troca senhas. A verificação de posse continua exigindo a prova do servidor descrita abaixo. O antigo aviso que simulava uma caixa de entrada e um remetente inexistente foi removido.

Mutações do navegador exigem origem permitida e `application/json`; requisições cross-site são recusadas. Clientes de API sem Origin precisam de um Bearer explícito. Corpos JSON têm limite de 12 MiB para preservar os snapshots com mídia já suportados. Limites de tentativa por IP complementam os limites por operação; o contador D1 é incrementado atomicamente.

`emailVerified` não é aceito do cliente nem inferido por um botão local. Somente uma prova expirável de uso único pode confirmar o endereço atual. Sem serviço de entrega configurado, a solicitação retorna indisponibilidade e a conta continua não verificada. Ver detalhes em `docs/security.md`.

O build agrupa também o merge compartilhado e gera `_headers` a partir do template, com hashes dos scripts inline existentes. Não editar os hashes à mão nem permitir eventos HTML inline; usar os eventos do módulo de segurança. O projeto Pages que publica a raiz tem uma allowlist no middleware para impedir exposição de backend, configurações e testes.

A descoberta, o catálogo, o detalhe da obra, a avaliação e os estúdios são telas da aplicação real. O estudo visual externo não é um substituto do produto nem uma fonte de dados fictícios para produção.

Créditos explícitos de estúdio são preservados. Quando a fonte não traz o crédito, `shared/studio-metadata.js` recupera apenas títulos exatos com confirmação oficial; a API aplica essa regra também ao catálogo existente, sem gravar dados durante a leitura. Créditos ainda desconhecidos aparecem como “Estúdio não informado”. A importação Kitsu aceita relações de estúdio e não usa um produtor ou distribuidor como substituto.

O editor mantém rascunhos durante a navegação entre episódios e obras na sessão. A confirmação de salvamento acompanha a resposta da API; falhas deixam os dados locais e oferecem nova tentativa. Rascunhos não publicados ficam na memória da aba, com aviso ao sair, e não representam um backup persistente.

Reviews e comentários usam a coleção de publicações existente. Os campos opcionais `kind`, `title`, `episode` e `spoiler` acrescentam contexto sem reclassificar textos antigos. Publicações antigas continuam visíveis em Tudo. A mesma política de ownership e merge protege dados de outros membros. Snapshots copiam respostas e curtidas, evitando que edições locais alterem a referência usada na sincronização.

O scroll permanece nativo, com a barra visual oculta. View Transitions usam detecção de suporte e animação breve como fallback. Transições podem ser interrompidas, botões de seção aguardam a liberação da cena e a redução de movimento mantém as telas completas. A lista de episódios renderiza até 40 opções por página.

As fontes Syne e DM Sans vieram de Google Fonts e dos repositórios oficiais `google/fonts`, sob OFL. Seus nomes internos de CSS são exclusivos do layout novo; as fontes, os recursos, o HTML e a lógica do preload foram preservados.

## Dívidas conhecidas

`app.js` ainda concentra cerca de 10,5 mil linhas, incluindo catálogo inicial, integrações de autenticação, perfis, administração e estado. Descoberta, cards, estúdios, editor de notas, comunidade e controles de sessão têm módulos próprios. O servidor Node ainda tem rotas legadas de catálogo e social; as operações de conta foram extraídas e as antigas implementações paralelas de merge foram removidas. A verificação de propriedade compartilhada é a mesma nos dois servidores. `styles.css` contém regras antigas com especificidade alta. A atualização não elimina toda a dívida do legado.

A migração deve ser incremental, por funcionalidade: extrair estado/API, depois renderizadores e controladores de cada tela conforme forem alterados. Evitar reescrita geral durante uma correção pontual. Atualizar este mapa e manter os testes de preservação de dados em cada etapa.
