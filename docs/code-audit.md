# Revisão do código — 26/10/2026

## Cobertura

A revisão percorreu os 132 arquivos de código, configuração, documentação e testes fora de mídia, dependências e saídas geradas. O inventário incluiu a interface, os dois adaptadores de API, os módulos compartilhados, o build, os e-mails e os testes. Os 106 arquivos JS/CSS existentes no início da revisão passaram por parsing; as fontes foram verificadas quanto a caracteres de controle, IDs HTML duplicados, handlers inline e referências de módulos não usadas pelo bundle. A inspeção manual se concentrou nos fluxos de autenticação, persistência, amizade, notificações e inicialização repetida da UI.

## Correções desta revisão

- O servidor Node agora lê o estado por uma única função validada. Leitura ausente, JSON inválido e objeto de tipo inesperado retornam erro; login, cadastro e mutações deixam de tratar falha de leitura como catálogo ou lista de contas vazios. A inicialização do Postgres também recusa um arquivo de migração inválido e uma linha principal ausente.
- As ações de cancelar convite e marcar/limpar notificações, usadas pela interface e já existentes no Cloudflare, foram adicionadas ao Node com sessão obrigatória e resposta pública sanitizada.
- A busca assistida no catálogo descarta respostas antigas quando o usuário muda de consulta antes de a requisição terminar.
- A inicialização repetida do formulário do catálogo não acumula listeners de prévia. A tela de cadastro mantém os mesmos listeners e seus estados de navegação entre aberturas, atualizando as listas ao reaparecer.
- O CSS editorial foi separado por área sem alterar a ordem da cascata. O arquivo CSS compilado conservou o hash `09c8edc0bc0d`, indicando bytes de saída idênticos.

## Verificações

- `npm test`: 154 testes aprovados.
- `npm run build:pages`: concluído; o build verifica a entrada do navegador contra dependências privadas e valores secretos.
- `npm audit` e `npm audit --omit=dev`: nenhuma vulnerabilidade reportada no momento da revisão.
- Grafo dos módulos de produção: sem ciclos ou dependências na direção proibida pelo teste de arquitetura.
- CSS compilado antes e depois da divisão: mesmo hash. A divisão dos arquivos não implica uma nova revisão visual da interface.

## Estrutura que ainda precisa de migração própria

`app.js` continua sendo um integrador legado extenso. As áreas novas têm módulos próprios, mas mover todos os fluxos restantes em uma só alteração acrescentaria risco às sessões, avaliações e sincronização. `styles.css` ainda contém regras legadas com alta especificidade. A sanitização de imagens e de avaliações difere entre os adaptadores Node e Cloudflare; uma unificação exige testes com dados históricos reais. As ferramentas administrativas de visão geral, backup, exportação e redefinição administrativa existem na API Cloudflare de produção, mas o Node alternativo não oferece paridade completa para essas telas. Nenhum desses pontos foi considerado resolvido por esta revisão.
