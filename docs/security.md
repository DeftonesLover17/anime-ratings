# Segurança e operação

## Identidade e autorização

`accountId` é gerado pelo servidor e não é editável pelo cliente. Contas antigas recebem esse identificador durante uma gravação autenticada ou outra gravação de estado já necessária. Leituras públicas não regravam contas, notas ou reviews.

O armazenamento legado identifica várias avaliações pelo nome sem pontuação. Para preservar os dados, a correção não troca essas chaves em massa: impede novos nomes equivalentes e exige um proprietário único antes de operar sobre referências legadas. Uma colisão histórica bloqueia autenticação e alterações por essas identidades até revisão administrativa. Nenhuma conta é removida ou mesclada automaticamente.

Para vincular a administração a IDs estáveis, configurar `ADMIN_ACCOUNT_IDS` com IDs de contas existentes, separados por vírgula. Obter os IDs de registros confiáveis, não de uma requisição de cadastro. Quando essa configuração existe, ela substitui `ADMIN_USERS`. Para compatibilidade com a instalação atual, `ADMIN_USERS` resolve cada nome contra uma única conta armazenada; nomes administrativos são reservados no cadastro. Essa configuração não permite cadastrar um novo administrador pela API pública.

As regras de sincronização verificam a autoria atual de cada ID de publicação no servidor. Alterar o `friendId` ou forjar o snapshot anterior não concede propriedade. E-mail, senha, verificação e identificadores internos não fazem parte do delta de perfil.

## Sessões e credenciais

- Cookies `anivoid_auth_token` são `HttpOnly`, `Secure`, `SameSite=Lax`, com Path `/`.
- O D1 guarda SHA-256 de tokens aleatórios de 256 bits, nunca o token ativo em texto aberto.
- A tabela nova `auth_sessions` tem prazo de inatividade de 24 horas, prazo absoluto de sete dias e vínculo com `accountId` e a versão da credencial.
- Tokens da tabela anterior não autenticam no código novo. É esperado um novo login após a publicação da correção.
- Logout revoga o token atual e expira o cookie. Falha da API não é apresentada como logout concluído.
- Troca de senha exige a senha atual no servidor, aplica a política comum, incrementa a versão da credencial, revoga sessões e emite um novo token para a sessão que concluiu a troca.
- Troca de e-mail exige reautenticação, remove sua verificação e rotaciona as sessões. A confirmação por link não concede login.
- Caches privados de perfis e notificações são removidos na saída. Notas em cache e a preferência visual não são apagadas por esse processo.

O servidor Node mantém sessões e provas pendentes em memória. Reiniciar esse servidor invalida essas sessões e links pendentes. Instalações Node com múltiplos processos precisam de um armazenamento compartilhado de sessão antes de escalar. A produção Cloudflare usa D1 e não tem essa limitação de processo.

Os formatos de hash existentes são preservados. Credenciais em texto legado são convertidas ao validar um login. `passwordSaltEncoding` explicita a interpretação do salt nas novas credenciais; registros antigos são conferidos nas duas interpretações históricas, bytes base64 e texto UTF-8. A suíte valida a compatibilidade entre Node e Cloudflare com o mesmo número de iterações. O Cloudflare usa 100.000 iterações PBKDF2; credenciais legadas acima desse teto precisam do reset administrativo já existente, em vez de produzir erro 500. O Node mantém seu parâmetro próprio (500.000 por padrão); importar esses hashes para Cloudflare continua exigindo recuperação administrativa. Não reduzir o fator de trabalho de um hash existente ou redefinir contas em massa para migrá-las.

## Entrada e restauração no navegador

Senhas são transmitidas exatamente como digitadas, inclusive espaços. O identificador pode ser aparado e não diferencia maiúsculas/minúsculas na resolução do servidor. A API rejeita cadastros e mudanças de e-mail que colidam com o identificador de outra conta.

O formulário bloqueia envios concorrentes e limita cada requisição a 20 segundos, incluindo a leitura do corpo. Erros de rede, servidor, credencial, limite de tentativas e cookie recusado têm mensagens próprias. A senha não é apagada após uma tentativa incorreta. Quando a troca obrigatória é necessária, o formulário apresenta dois campos mascarados e exige confirmação; não usa `prompt()` para a nova senha. Após a troca, uma falha na entrada informa que a nova senha já está em vigor.

O sucesso de `/api/login` é seguido por `/api/users` para confirmar o cookie HttpOnly. O cache não comprova autenticação. Na restauração, somente o `viewerUsername` confirmado pelo servidor ativa a identidade; ausência de identidade e 401 reabrem o login. Falhas de transporte e 403 não apagam uma sessão válida. Uma geração local impede que respostas anteriores ao login/logout restaurem uma identidade antiga. O payload de sincronização informa `viewerUsername` esperado; uma divergência retorna `SESSION_CHANGED` antes de gravar dados.

O armazenamento do navegador tem fallback em memória para bloqueio de acesso e falta de quota. Essa proteção mantém o login funcional, mas não garante persistência offline após fechar a aba. Dados já salvos no servidor são recuperados por uma nova leitura autenticada. A recuperação de senha esquecida usa um fluxo próprio descrito abaixo; a prova de verificação de e-mail existente não redefine senha.

## Fronteira HTTP

Requisições que alteram dados precisam usar `application/json`. Browsers devem informar um Origin presente em `ALLOWED_ORIGINS`; `Sec-Fetch-Site: cross-site` é recusado. Sem Origin, somente clientes que apresentam um Bearer explícito passam pela fronteira; o Bearer ainda é autenticado normalmente na rota. CORS não substitui essas verificações.

O endereço público padrão é `https://anime-ratings.pages.dev`. Adicionar uma origem exige configuração explícita. O Node aceita as origens locais configuradas para desenvolvimento. `TRUST_PROXY=true` só deve ser usado quando o servidor Node está realmente atrás de um proxy confiável; o padrão usa o endereço do socket para impedir falsificação de IP por cabeçalhos.

O limite JSON é 12 MiB. Login aceita identificadores de até 254 caracteres e senhas de até 256. Cadastro, login, troca de credenciais, envio de e-mail e mutações têm limites por operação/IP. O contador D1 usa um único UPSERT com RETURNING para não permitir corrida entre tentativas concorrentes.

## Verificação real de e-mail

O envio de **boas-vindas** usa a integração EmailJS/Gmail existente e é separado da verificação de posse. `frontend/account/email-config.js` guarda somente os identificadores públicos que o EmailJS documenta para uso no navegador. O conteúdo HTML fica predefinido no template remoto; os parâmetros usam somente variáveis escapadas, sem `{{{html}}}`, links dinâmicos ou credenciais. Não transportar provas de verificação ou recuperação de senha por essa integração pública sem uma implementação específica no servidor. O remetente Gmail continua o serviço já conectado no painel; o nome de exibição é ANIVØID.

O envio de links de verificação pelo Resend não está configurado nesta instalação. Enquanto as variáveis abaixo estiverem ausentes, esse endpoint informa `EMAIL_DELIVERY_UNAVAILABLE` e não marca nenhum endereço como verificado. Isso não impede o envio separado das boas-vindas pelo EmailJS.

A implementação está preparada para a API do Resend:

1. Configurar um remetente/domínio autorizado no provedor.
2. Adicionar `EMAIL_VERIFICATION_API_KEY` como segredo no ambiente Cloudflare Pages e `EMAIL_FROM` como remetente autorizado. Não colocar a chave no repositório, no navegador ou em mensagens de chat.
3. Opcionalmente definir `PUBLIC_SITE_ORIGIN` com a origem HTTPS do site. O padrão é a origem atual de produção.
4. Publicar a configuração e testar o fluxo com uma caixa de e-mail controlada pelo operador.

O servidor gera uma prova aleatória, guarda somente o hash e o endereço/conta vinculados a ela. O link expira em 30 minutos, é de uso único e deixa de valer quando o e-mail muda. A API nunca devolve a prova ao solicitante. O navegador envia a prova à API e remove o parâmetro da URL. Flags antigas sem prova do servidor não são apresentadas como verificadas.

Se outro provedor for adotado, substituir somente o adaptador de entrega em `backend/security/email-verification.js`, preservando as regras de emissão e consumo. Referência de integração: [API oficial do Resend](https://resend.com/docs/api-reference/emails/send-email).

## Publicação e CSP

O projeto Cloudflare Pages atual publica a raiz. `functions/_middleware.js` limita a publicação a HTML de entrada, assets compilados, fontes, capas, logos e rotas `/api/`. Backend, `.env`, `.git`, testes e configurações recebem 404. O servidor Node usa sua própria allowlist equivalente.

`config/security-headers.template` é a fonte dos cabeçalhos. `npm run build:pages` calcula os hashes CSP dos scripts inline existentes sem mudar a lógica do preload e gera `_headers` na raiz e em `dist/`. O template permite os CDNs já usados pelo site, inclusive os arquivos de animação no cdnjs. A política não permite `unsafe-inline` ou `unsafe-eval` para scripts e bloqueia handlers HTML inline. Estilos inline permanecem necessários para o layout e as imagens dinâmicas existentes.

Controles de DOM usam eventos em `frontend/security/dom-actions.js`; não adicionar `onclick`, `onerror` ou strings executáveis. Esta política complementa a validação de dados e a autorização, sem substituí-las.

## Validação e manutenção

Executar `npm test` em Node.js 24 e `npm run build:pages`. A suíte cobre o D1 com SQLite real, o módulo Cloudflare compilado, HTTP real do Node em loopback, falhas de logout, colisões, autoria forjada, credenciais, origem, limites de corpo, CSP e provas de e-mail. O teste HTTP local requer permissão de loopback no ambiente de execução.

Após publicar, conferir o commit do build, saúde da API, carregamento dos assets, CSP e 404 dos caminhos privados. Testes de ataque com usuários reais ou download de exportações administrativas não são necessários para essa conferência. Não registrar cookies, senhas, provas de verificação, hashes de credenciais ou respostas completas de exportação em logs.

A mudança acrescenta tabelas de autenticação e verificação; não elimina tabelas ou dados existentes. Backups e o controle de revisão concorrente do estado permanecem. Antes de desfazer uma atualização de segurança, avaliar a compatibilidade da autenticação e das autorizações: voltar a código vulnerável não é uma forma segura de rollback.


## Proteção contra excesso de requisições

A API aplica, por IP, 40 requisições em 10 segundos, 180 leituras por minuto e 120 gravações por minuto. Operações autenticadas de gravação compartilham também um orçamento de 90 por conta por minuto, independente do IP; os limites específicos mais restritos de login, cadastro e credenciais continuam válidos. O Cloudflare aceita somente o IP informado pela borda em `CF-Connecting-IP`. O Node usa o socket, salvo configuração explícita `TRUST_PROXY=true`, que exige um proxy confiável que remova cabeçalhos recebidos do visitante.

No Cloudflare, os contadores atômicos ficam no D1. O cache limitado de bloqueios evita novas gravações para negações já confirmadas no mesmo isolate; ele não substitui o D1. A limpeza de contadores expirados usa o índice existente e acontece no máximo uma vez por minuto por binding/isolate. No Node, os contadores têm capacidade limitada e valem por processo; múltiplas instâncias Node precisam de armazenamento de limites compartilhado antes de serem usadas como uma única implantação.

Respostas de bloqueio usam `429`, `code: RATE_LIMITED` e `Retry-After`. O cliente aguarda esse prazo, compartilha leituras idênticas em andamento e nunca repete automaticamente uma gravação. A deduplicação é invalidada nas mutações para não reaproveitar respostas de uma identidade anterior. Esses limites também afetam pessoas que compartilham um IP; ajustar os orçamentos com tráfego real, sem removê-los. São proteção da aplicação; ataques distribuídos que esgotam a borda exigem proteção de rede/WAF da hospedagem. Não foi criada nem alterada configuração paga de WAF.

O F12 continua disponível. Código e requisições enviados ao navegador são inspecionáveis. O aviso contra colar scripts é educativo; autorização, autoria de notas, perfil editável, cookies HttpOnly e projeções sem credenciais são verificados no servidor. Não usar bloqueio de atalhos, detecção de DevTools ou alegações de proteção contra alterações do DOM como controle de acesso.


## Revisão do login e da troca de senha

O transporte de conta é compartilhado por login e perfil, com timeout de 20 segundos para resposta e corpo, sem repetição automática de mutações. A edição preserva espaços nas senhas, exige confirmação mascarada e valida de 10 a 256 caracteres com letras e números. Os dois servidores recusam nova senha igual à atual; uma senha temporária não pode ser reutilizada para remover a exigência de criar uma senha pessoal. A rota sem sessão de troca obrigatória aceita somente contas marcadas com `passwordResetRequired`; demais contas usam a edição autenticada.

`POST /api/patch-user` aceita `newPassword` opcional junto dos campos do perfil. Quando há alteração de senha ou e-mail, a API valida a senha atual e todas as mudanças antes de gravar um único estado, respeitando o controle de revisão concorrente. Depois revoga sessões anteriores e emite um novo cookie. A interface confirma o cookie em `/api/users` antes de anunciar sucesso. Os endpoints de senha existentes continuam compatíveis, com a mesma política de senha e revogação.

O cache local só recebe os dados confirmados pelo servidor. Enquanto o salvamento está em andamento, os campos e ações de fechamento ficam bloqueados. Respostas de atualização de cache não substituem campos já editados; uma troca de conta no meio da operação impede aplicar a resposta à identidade nova. Falhas de validação mantêm o formulário aberto. Falhas de transporte ou servidor durante mudança de credencial são apresentadas como resultado não confirmado; o usuário recebe orientação para entrar com a senha nova, caso a gravação tenha ocorrido, sem reenvio automático da troca.


## Dados enviados ao navegador e exportações

`shared/security/responses.js` define os campos permitidos para estado público, perfis, amigos, notas, reviews, respostas e atividades. Dados de armazenamento não são espalhados diretamente em uma resposta HTTP. Metadados privados ou futuros não declarados, hashes, salts, credenciais e configuração de ambiente permanecem no servidor. Senhas e tokens não devem ser colocados em textos públicos, URLs de mídia, nomes ou outros campos de conteúdo.

Exportações administrativas e downloads de backup no navegador usam a mesma projeção e indicam `credentialsIncluded: false`. Não são cópias da autenticação. Os backups internos D1 continuam completos e privados; a recuperação operacional das credenciais deve ocorrer no servidor, nunca por um arquivo público ou uma restauração do cache. O proprietário continua recebendo os campos pessoais necessários à própria conta; isso não dá acesso a credenciais de outros membros.

O cache é projetado novamente ao iniciar o site: tokens legados e campos de autenticação antigos são removidos. Notas, comentários e a diferença entre alterações pendentes e sua base de sincronização são preservados. Dados de cache ou do DOM não autorizam operações no servidor. O selo de verificação em cache é somente apresentação; a API valida a prova armazenada antes de retorná-lo.

A allowlist de arquivos é compartilhada por Node e Pages. Somente os nomes conhecidos de bundles com hash são servidos em `/assets/`; arquivos de ambiente, fontes do backend, configurações, mapas de código e arquivos JS arbitrários ficam fora dela. O build recusa importação de módulos privados no bundle do navegador, literais reconhecíveis de credenciais e valores secretos conhecidos do ambiente/arquivos locais. Essa checagem é uma prevenção de regressões e não substitui revisão de código nem um sistema geral de detecção de segredos.

O dono de um navegador pode inspecionar a própria página, as próprias requisições, a senha que ele mesmo digitou e o cookie da própria sessão. HttpOnly impede a leitura do cookie por JavaScript; não o oculta do DevTools do proprietário. Não existe bloqueio de F12 que transforme código do cliente em uma fronteira de autorização. Administradores autorizados podem gerar uma senha temporária no fluxo de reset já existente; isso não revela a senha anterior nem os hashes armazenados. Segredos não devem ser colados no console.


## Recuperação de senha por e-mail

O login oferece “Esqueci minha senha”. `POST /api/account/password-recovery/request` recebe o e-mail e devolve a mesma resposta 202 para contas existentes, desconhecidas ou com o orçamento do destinatário esgotado. Aplica limite de 5 pedidos por IP a cada 15 minutos e 3 por destinatário/hora, independente do IP. O destinatário do contador é um digest; o retorno demora pelo menos 200 ms e a entrega ocorre em segundo plano. Não existe garantia de tempo idêntico entre operações, portanto essa medida não substitui os limites. Falha de configuração é 503 para qualquer conta. Falhas de entrega invalidam a prova e registram somente um nome de evento, sem e-mail, token, chave ou corpo do provedor.

A prova possui 32 bytes aleatórios, validade de 20 minutos e uso único. O armazenamento mantém apenas SHA-256, conta, e-mail, versão da credencial e expiração. Um novo pedido substitui o anterior. Mudanças de e-mail, credencial ou exclusão da conta invalidam provas pendentes. O consumo no D1 é um DELETE com RETURNING atômico. Um conflito de revisão restaura a prova somente se nenhum pedido mais recente existir. No Node, o arquivo privado `DATA_DIR/password-recoveries.json` usa escrita atômica e fila por processo; múltiplas instâncias precisam de armazenamento transacional compartilhado antes de escalar.

`POST /api/account/password-recovery/confirm` tem limite de 10 tentativas por IP a cada 15 minutos, valida a política de senha e recusa reutilização da senha anterior. A atualização respeita a revisão concorrente, incrementa a versão da credencial e revoga sessões. Não realiza login automático. O link usa fragmento `#redefinir-senha=`, removido imediatamente pelo controlador antes de outros scripts; a prova fica somente em memória durante a interação e não entra no cache do navegador. A URL usa origem HTTPS fixa configurada, nunca o Host enviado pelo cliente.

A entrega de recuperação usa o serviço EmailJS/Gmail existente, pelo servidor: `RECOVERY_EMAIL_PROVIDER=emailjs`, `EMAILJS_PUBLIC_KEY`, `EMAILJS_SERVICE_ID` e `EMAILJS_RECOVERY_TEMPLATE_ID`. `EMAILJS_PRIVATE_KEY` deve ser um segredo do Cloudflare; nunca um valor no frontend, repositório ou log. A opção de API para aplicações não navegador exige a chave privada. O template remoto “ANIVØID — Recuperação de senha” corresponde a `emails/password-recovery.html`, usa endereço oficial fixo e parâmetros escapados `to_email` e `reset_token`, com armazenamento de parâmetros privados desativado no histórico do EmailJS. Boas-vindas continua separado. A quota do serviço é compartilhada; acompanhar falhas e consumo no provedor.

O adaptador também aceita Resend por `RECOVERY_EMAIL_API_KEY` e `EMAIL_FROM`, sem mudar as regras da prova. Essa alternativa não ativa a verificação de e-mail, que permanece independente. A suíte usa contas fictícias e cobre expiração, reuso, revogação, concorrência, falha de entrega, restauração por conflito e limites por destinatário. A validação real solicita um link a uma caixa controlada pelo operador; o titular escolhe e confirma a nova senha.
