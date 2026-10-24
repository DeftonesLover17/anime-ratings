# Regras do projeto ANIVØID

## Organização obrigatória

- Manter o código organizado em toda atualização. Esta é uma regra expressa de Felipe.
- Antes de editar, ler `README.md` e identificar o módulo responsável pela mudança.
- Cada módulo deve ter uma responsabilidade clara. Reutilizar a regra existente antes de criar outra versão.
- Novos recursos de interface pertencem a `frontend/`, separados por domínio. `app.js` é o integrador legado; não acrescentar nele subsistemas novos ou blocos duplicados.
- Ao tocar uma área legada, extrair duplicações relevantes de forma incremental, preservando os contratos e o comportamento já validado.
- Compartilhar apenas funções realmente comuns aos servidores em `shared/`. Não misturar DOM, persistência e regras de negócio no mesmo módulo.
- Evitar estado global implícito, dependências circulares, funções com várias responsabilidades e abstrações sem uso concreto.
- Preferir nomes claros e comentários que expliquem decisões. Remover código substituído em vez de manter implementações paralelas ou comentários obsoletos.
- CSS novo fica junto do módulo de interface. Organizar tokens, componentes, temas, responsividade e movimento em seções. Evitar camadas sucessivas de sobrescritas; exceções de compatibilidade com CSS legado devem ter escopo e motivo.
- Os shells das telas usam toda a largura disponível com `.av-wrap` e `--av-page-gutter`, mantendo as margens de cabeçalho, conteúdo e rodapé alinhadas. Não reintroduzir contêineres fixos de 1.440/1.530 px nas páginas.
- Manter proporções naturais nos títulos da interface editorial. Usar Syne no peso 600; não alargar letras por transformação horizontal nem voltar ao peso 800 expandido.
- Nunca editar `assets/` ou `dist/` manualmente. São gerados por `npm run build:pages`.
- Testes pertencem a `tests/`; ferramentas de desenvolvimento a `scripts/`. Não versionar fixtures pessoais, capturas de sessão, credenciais ou arquivos temporários.
- Quando alterar a estrutura, atualizar o mapa do `README.md` na mesma mudança.

## Contratos preservados

- O preload atual só pode ser alterado mediante novo pedido explícito de Felipe.
- Manter o logout atual e os textos das sinopses, salvo novo pedido explícito.
- Não reintroduzir exclusão recorrente de usuários. A exclusão anterior foi uma operação única.
- Preservar revisões e merge de alterações concorrentes. Não substituir dados de outros membros por um snapshot antigo.

## Critério de conclusão

- Revisar o diff quanto a duplicação, acoplamento, nomes, código morto e responsabilidades.
- Executar `npm test` e `npm run build:pages` para mudanças de código relevantes.
- Em UI, aplicar as skills de design disponíveis, inspecionar desktop, tablet e celular, e validar estados, teclado, contraste e redução de movimento.
- Animações precisam poder ser interrompidas e liberar recursos; não acumular timers, observers ou eventos a cada render.
- Não afirmar que todo o legado está modularizado quando a mudança resolveu apenas uma parte. Registrar dívidas concretas no README.
