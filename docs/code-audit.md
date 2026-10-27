# Revisão do código — 26/10/2026

## Ferramentas exclusivas do proprietário — 27/10/2026

“Backup dos dados”, “Painel admin” e a seção Ferramentas começam ocultos e desativados. O acesso depende de `viewerPermissions.canManageSystem`, calculado pelas APIs a partir da sessão autenticada e da política compartilhada de proprietário único. O nome em cache e o avaliador selecionado não concedem privilégios. Trocar de conta limpa os painéis privados; uma transição pendente da gaveta não executa a ação se a permissão tiver sido revogada. Exportação e importação também conferem o acesso antes e depois das etapas assíncronas.

As APIs de painel, backups, downloads, exportação, remoção de usuário e limpeza de sessões recusam visitantes, membros e outros administradores configurados. Testes de Node e Cloudflare incluem cadastro tentando forjar privilégios, identidade ambígua e resposta de login anterior à confirmação do cookie. Validação: 203 testes aprovados, build concluído e diff sem erros. Em cópias locais com contas sintéticas, a conta comum não mostrou as ferramentas mesmo selecionando Felipe como avaliador; a conta proprietária mostrou as duas ações e permitiu foco por teclado. Esta alteração ainda precisa ser publicada para valer na produção.

## Correção das logos — 27/10/2026

O salvamento também invalida leituras de estado iniciadas antes ou durante a mutação, impedindo que uma resposta antiga reponha metadados anteriores na tela depois do sucesso.

Continuação da revisão: o salvamento do catálogo foi extraído para um controlador que impede envios repetidos e troca de formulário durante a operação, descarta respostas de uma sessão anterior e informa quando o resultado de uma requisição que expirou precisa ser conferido. O rótulo com ícone e os estados desabilitados dos campos são restaurados após falhas. A busca da logo do estúdio também virou um módulo compartilhado: exige nome exato, cancela resultados antigos, limita o tempo de consulta e evita a dependência implícita de uma função global. URLs manuais inválidas bloqueiam o envio com validação nativa; escolher uma sugestão preserva a opção de título em texto e a URL manual. O pôster vindo da busca externa é validado e escapado antes de entrar no HTML. Esta continuação passou com 192 testes, build e verificação do diff.

As seis falhas identificadas nos commits `787f900..4bb8144` foram corrigidas. O catálogo de 95 logos foi movido para um módulo de dados, a descoberta externa ganhou um controlador próprio e o título e o campo de formulário passaram a ter responsabilidades separadas. A rotina legada de adição de animes sem chamadas foi removida; a criação continua passando pela API administrativa.

- A seleção externa exige correspondência exata e rejeita identidades ambíguas; removidos o primeiro resultado arbitrário, a correspondência por prefixo de franquia e o fallback de arquivos Logopedia sem prova de identidade.
- O título verifica a versão da renderização e a imagem atual em callbacks. Navegar cancela a descoberta anterior; a busca não modifica o snapshot do catálogo.
- O formulário compartilha um único controlador entre edição manual e autocomplete. Troca de título, edição da URL, reset, fechamento e envio invalidam pedidos pendentes.
- O salvamento é imediato com os campos disponíveis. A descoberta possui prazo total de oito segundos, cancelamento por consumidor, deduplicação, limite de oito buscas simultâneas e cache de até 128 resultados, incluindo falhas/timeout.
- Node e Cloudflare distinguem campo ausente de URL vazia. A opção acessível “Exibir apenas o título” persiste como um booleano validado e impede a redescoberta indesejada.
- O bloco `/logos/*` voltou a ter cabeçalho válido, com cache diário revalidável. O teste de configuração rejeita linhas órfãs em todo o template.

Validação: 185 testes aprovados; build e verificação de segredos do navegador concluídos; grafo sem ciclos; inspeção local do detalhe em 390, 820 e 1440 px e do novo controle por teclado. As APIs foram exercitadas em fixtures locais, sem alterar o catálogo de produção. Resultados externos sem confirmação ficam em texto e podem receber uma URL escolhida pelo administrador. O legado restante descrito abaixo continua exigindo migrações próprias.

## Cobertura

A revisão percorreu os 132 arquivos de código, configuração, documentação e testes fora de mídia, dependências e saídas geradas. O inventário incluiu a interface, os dois adaptadores de API, os módulos compartilhados, o build, os e-mails e os testes. Os 106 arquivos JS/CSS existentes no início da revisão passaram por parsing; as fontes foram verificadas quanto a caracteres de controle, IDs HTML duplicados, handlers inline e referências de módulos não usadas pelo bundle. A inspeção manual se concentrou nos fluxos de autenticação, persistência, amizade, notificações e inicialização repetida da UI.

## Correções desta revisão

- O servidor Node agora lê o estado por uma única função validada. Leitura ausente, JSON inválido e objeto de tipo inesperado retornam erro; login, cadastro e mutações deixam de tratar falha de leitura como catálogo ou lista de contas vazios. A inicialização do Postgres também recusa um arquivo de migração inválido e uma linha principal ausente.
- As ações de cancelar convite e marcar/limpar notificações, usadas pela interface e já existentes no Cloudflare, foram adicionadas ao Node com sessão obrigatória e resposta pública sanitizada.
- A busca assistida no catálogo descarta respostas antigas quando o usuário muda de consulta antes de a requisição terminar.
- A inicialização repetida do formulário do catálogo não acumula listeners de prévia. A tela de cadastro mantém os mesmos listeners e seus estados de navegação entre aberturas, atualizando as listas ao reaparecer.
- O CSS editorial foi separado por área sem alterar a ordem da cascata. O arquivo CSS compilado conservou o hash `09c8edc0bc0d`, indicando bytes de saída idênticos.

## Verificações

- `npm test`: 159 testes aprovados após a revisão adicional.
- `npm run build:pages`: concluído; o build verifica a entrada do navegador contra dependências privadas e valores secretos.
- `npm audit` e `npm audit --omit=dev`: nenhuma vulnerabilidade reportada no momento da revisão.
- Grafo dos módulos de produção: sem ciclos ou dependências na direção proibida pelo teste de arquitetura.
- CSS compilado antes e depois da divisão: mesmo hash. A divisão dos arquivos não implica uma nova revisão visual da interface.

## Estrutura que ainda precisa de migração própria

`app.js` continua sendo um integrador legado extenso. As áreas novas têm módulos próprios, mas mover todos os fluxos restantes em uma só alteração acrescentaria risco às sessões, avaliações e sincronização. `styles.css` ainda contém regras legadas com alta especificidade. A sanitização de imagens e de avaliações difere entre os adaptadores Node e Cloudflare; uma unificação exige testes com dados históricos reais. As ferramentas administrativas de visão geral, backup, exportação e redefinição administrativa existem na API Cloudflare de produção, mas o Node alternativo não oferece paridade completa para essas telas. Nenhum desses pontos foi considerado resolvido por esta revisão.

## Revisão adicional

- A aceitação ou rejeição de amizade exige agora um convite recebido pelo membro autenticado nas duas APIs. Antes, um membro podia chamar a rota de aceitação sem convite e criar uma amizade unilateralmente autorizada pelo servidor.
- O servidor Node rejeita corpos JSON `null` ou arrays na sincronização e nomes de tipos inesperados nas operações sociais, sem encerrar o processo.
- Node e Cloudflare usam a mesma validação das coleções essenciais do estado persistido. Um JSON válido mas incompleto falha antes de uma gravação que poderia substituir dados por listas vazias.

## Rodada seguinte: entradas e catálogo

- Identificadores de usuário vindos do JSON agora são validados antes das consultas nas rotas sociais e administrativas. Objetos malformados retornam 400, sem encerrar o Node nem alterar o estado.
- As rotas de conta do Node usam a mesma validação estrutural do estado persistido adotada por login e sincronização. Uma troca de perfil ou senha não grava sobre um estado incompleto.
- Campos de perfil, IDs e metadados do catálogo com tipos inesperados são recusados antes da mutação. Os sanitizadores de texto, imagem e estúdio tratam valores externos sem conversões que possam lançar exceções.
- A sincronização recusa coleções incompletas antes do merge e salva somente os campos previstos de atividades novas; campos adicionais enviados pelo cliente não entram no estado persistido.
- O cadastro administrativo de anime no Node chamava uma função de normalização inexistente. A regra agora é compartilhada com Cloudflare, preserva a detecção de duplicatas com acentos e diferencia títulos escritos só em japonês.
- A função antiga de merge de atividades no adaptador Cloudflare, sem chamadas, foi removida.

Verificação final desta rodada: `npm test` aprovou 169 testes; `npm run build:pages` concluiu; `git diff --check` não encontrou erro. A última passagem pelos fluxos alterados não encontrou outra falha reproduzível. Isso não constitui prova de ausência absoluta de defeitos, especialmente para serviços externos e cenários de produção que não podem ser reproduzidos integralmente nos testes locais.
