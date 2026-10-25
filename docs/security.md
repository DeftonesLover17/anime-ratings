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

Os formatos de hash existentes são preservados. Credenciais em texto legado são convertidas ao validar um login. Não elevar cegamente a contagem PBKDF2 da produção Cloudflare: o runtime tem restrições próprias e os fluxos legados já possuem uma política de recuperação administrativa. O backend Node usa seu parâmetro próprio; migração de credenciais entre runtimes precisa ser validada.

## Fronteira HTTP

Requisições que alteram dados precisam usar `application/json`. Browsers devem informar um Origin presente em `ALLOWED_ORIGINS`; `Sec-Fetch-Site: cross-site` é recusado. Sem Origin, somente clientes que apresentam um Bearer explícito passam pela fronteira; o Bearer ainda é autenticado normalmente na rota. CORS não substitui essas verificações.

O endereço público padrão é `https://anime-ratings.pages.dev`. Adicionar uma origem exige configuração explícita. O Node aceita as origens locais configuradas para desenvolvimento. `TRUST_PROXY=true` só deve ser usado quando o servidor Node está realmente atrás de um proxy confiável; o padrão usa o endereço do socket para impedir falsificação de IP por cabeçalhos.

O limite JSON é 12 MiB. Login aceita identificadores de até 254 caracteres e senhas de até 256. Cadastro, login, troca de credenciais, envio de e-mail e mutações têm limites por operação/IP. O contador D1 usa um único UPSERT com RETURNING para não permitir corrida entre tentativas concorrentes.

## Verificação real de e-mail

O envio não está configurado nesta instalação. Enquanto as variáveis abaixo estiverem ausentes, o endpoint informa `EMAIL_DELIVERY_UNAVAILABLE` e não marca nenhum endereço como verificado.

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
