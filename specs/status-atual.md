# Gravity Elements — Status atual

> Resumo de contexto para retomar o projeto em uma nova sessão. Última atualização: 2026-08-20 (Etapa 0 e Etapa 1 concluídas e fechadas no TickTick; Etapa 2 — Form ainda não iniciada, spec de implementação ainda não escrita).

## O que é o projeto

Biblioteca de componentes UI para AngularJS 1.8.3, portando o design system do Nuxt UI (Vue), seguindo o John Papa Style Guide (`a1`). Interatividade (posicionamento, focus trap, atalhos) reaproveita bibliotecas de terceiros (Floating UI, focus-trap, tabbable, Mousetrap, date-fns) em vez de reconstruir do zero.

Faz parte do ecossistema **Orbtal**: Gravity é o framework/infraestrutura interna compartilhada (não vendido isoladamente), Helios é o portal, Kepler é a primeira aplicação de negócio (SFA + roteirização de entregas). Este projeto é a camada de componentes de UI dessa arquitetura.

**Prioridade: baixa.** Não compete por tempo com o desenvolvimento do Kepler (MVP prioritário: autenticação, multi-tenant, APIs core, app de vendas em campo). Concluir a Etapa 0 é desejável quando houver disponibilidade, sem prazo.

## Nome do projeto — histórico

1. Nasceu como **SingularUi**.
2. Renomeado para **GravityUi** ao alinhar com a arquitetura Orbtal.
3. Renomeado de novo para **Gravity Elements** — "GravityUi" colidia com o "Gravity UI" da Yandex (design system open source já estabelecido, mesma categoria de produto: `gravity-ui.com`, `@gravity-ui/uikit` no npm). "Gravity Elements" é nome descritivo, não marca própria, dispensa checagem formal de marca (mesmo tratamento dado ao "Helios" no plano de negócios da Orbtal).

Convenção de código adotada: prefixo `ge-`/`ge` (ex.: `geTv`, `geOverlayStack`, `ge-floating-position`), módulo Angular `gravityElements`/`gravityElements.core`.

## Repositório

- GitHub: `github.com/oaugustus/gravity-elements` (renomeado de `singular-ui`; URL antiga redireciona).
- Pasta local: `~/Projetos/htdocs/gravity-elements` (renomeada de `singular-ui`).
- Remote local (`git remote -v`) confirmado limpo, fetch e push ambos em `gravity-elements.git`, sem token embutido.
- Em 2026-08-20 (fim da Etapa 1), `git status` limpo — todos os componentes, fixes e o expandido `geProgress` commitados (`1e71606` é o commit mais recente na ocasião). Sempre confirmar `git status`/`git log -1` de novo no início de uma sessão nova, já que isso muda a cada tarefa.

## Documentos de planejamento (`specs/`)

- `gravity-elements-especificacao-tecnica.md` — especificação técnica completa (arquitetura, convenções, contrato de componente, `geTv`, camada de interatividade, build/tooling, testes, licenciamento, fora de escopo).
- `gravity-elements-plano-etapas.md` — plano por etapas (0–6 + 9 no escopo da v1; 7–8 só como referência para v2).
- `spec-etapa-0-fundacao.md` — spec de implementação da Etapa 0 para o Cursor, com TODO (seção 9) espelhando as tarefas do TickTick. **Concluída (25/25).**
- `spec-etapa-1-layout-element.md` — spec de implementação da Etapa 1 (Layout + Element, 24 componentes), escrita em 2026-08-06 nos moldes da Etapa 0. TODO (seção 12) espelha as tarefas do TickTick (24 componentes + demo app + critérios de aceite, mais um item pós-etapa: expansão do Progress). **Concluída — 100%, TickTick zerado** (ver seção própria abaixo).
- `processo-implementacao.md` — processo operacional (papéis Claude/Cursor/TickTick), válido para todas as etapas. **Atualizado em 2026-08-20** com uma regra nova a partir da Etapa 2: cada tarefa `Componente: X` passa a incluir a atualização da rota/página de demo e a comparação visual com `ui.nuxt.com` como parte da própria definição de pronto, em vez de uma tarefa "Demo app" em lote no fim da etapa (ver seção própria do arquivo para o racional — vários bugs visuais da Etapa 1 só foram achados tarde por causa desse batching).

Etapas 2–6 e 9 ainda não têm spec de implementação detalhada. **Etapa 2 (Form) é a próxima a ser escrita** — plano/escopo de alto nível já existe em `gravity-elements-plano-etapas.md` (21 componentes, `ngModel` customizado, `ngMessages` para validação — decisão confirmada na seção 13 desse arquivo —, ColorPicker sobre Pickr, FileUpload sobre ng-file-upload, Select/SelectMenu/InputMenu/Listbox com `ge-floating-position` + roving tabindex), mas ainda falta o documento `spec-etapa-2-form.md` no molde detalhado da Etapa 1 (contrato por componente, ARIA, casos de teste mínimos, TODO espelhando o TickTick).

## Progresso da Etapa 0 (Fundação) — **CONCLUÍDA**

**25 de 25 tarefas concluídas e verificadas de forma independente** (não só por relato). TickTick zerado (projeto "Etapa 0 - Fundação" sem tarefas em aberto) em 2026-08-06.

Entregas completas: estrutura de pastas, `package.json` + dependências de terceiros fixadas, ESLint, Karma+Jasmine, `geTv` (+ testes de fixture vs `tailwind-variants`), AngularJS 1.8.3/`angular-aria`/`angular-animate`, `core.module.js`/`gravity-elements.module.js`, `geOverlayStack`, `ge-floating-position`, `ge-focus-trap`, `ge-hotkey`, `generate-tailwind-safelist.js`, demo app com Vite, `THIRD-PARTY-LICENSES.md`, os dois smoke tests de critério de aceite (`geBadge` end-to-end, Tooltip com floating+focus-trap+hotkey), Tailwind CSS (CLI/PostCSS, `dist/gravity-elements.css`), Rollup (build UMD, `dist/gravity-elements.umd.js`), ambiente de desenvolvimento base (`.nvmrc`, `.gitignore` atualizado, README, CI no GitHub Actions), `geId`, `geColorMode`, remote do git corrigido e histórico de commits publicado.

## Qualidade / verificação

- `eslint .` limpo, confirmado em instalação nativa isolada do sandbox (fora do `node_modules` do Mac do usuário, para evitar binários nativos cruzados).
- `npm run build:css` e `npm run build:js` (Rollup) rodados de forma independente nesta sessão — geram `dist/gravity-elements.css` e `dist/gravity-elements.umd.js` sem erro.
- **Karma + Chrome Headless segue sem poder ser confirmado automaticamente no ambiente Cowork**: sandbox Linux ARM64 sem root; o Chrome que o `puppeteer` baixa para "linux_arm" é na verdade um binário x86-64 (não há build oficial de Chrome para Linux ARM64), e `apt install chromium` falha por falta de permissão de root.
- **Mitigação usada nesta revisão** — em vez de só ler o código, o bundle UMD final e os serviços `geId`/`geColorMode` foram **executados de verdade** via `jsdom` + AngularJS real (`angular.js`/`angular-aria`/`angular-animate` carregados num DOM simulado, sem depender de Chrome): confirmado que `window.gravityElements` é o módulo Angular real (`name: 'gravityElements'`, `requires: ['gravityElements.core']`), que `geId.next('aria')` gera `aria-1`, `aria-2`, `aria-3` incrementalmente, e que `geColorMode.set('dark')`/`toggle()` aplicam e removem a classe `dark` em `documentElement` corretamente. Os demais serviços/diretivas (`geTv`, `geOverlayStack`, `ge-floating-position`, `ge-focus-trap`, `ge-hotkey`, `geBadge`, Tooltip) foram confirmados por revisão de código linha a linha contra a spec, sem contradição com os resultados de Karma relatados pelo Cursor (contagem de testes cresceu de forma consistente ao longo das entregas: 11→15→18→21→24→26→29→32→37).
- **Recomenda-se rodar `npm test` localmente (Mac do usuário, que tem Chrome de verdade) ou via CI (já configurado em `.github/workflows/ci.yml`) para confirmar a suíte completa Karma pelo menos uma vez.**

## Progresso da Etapa 1 (Layout + Element) — **CONCLUÍDA**

**24 de 24 componentes + demo app (24 rotas) + os 2 critérios de aceite (comparação visual, Calendar navegável por teclado) concluídos e verificados de forma independente.** TickTick zerado (projeto "Etapa 1 - Layout + Element" sem tarefas em aberto) em 2026-08-20. Um item adicional, fora das 27 tarefas originais do TickTick — expansão do `geProgress` (`animation`/`orientation`/`inverted`/`max` como array, paridade completa com o `Progress.vue` real) — foi adicionado à spec e implementado/verificado à parte (não está no TickTick, por decisão explícita registrada na spec).

Histórico completo, bug a bug, com evidência técnica de cada correção, está em `spec-etapa-1-layout-element.md` (seção 12, sub-linhas dos itens `[x]`). Achados de maior impacto pra ter em mente ao começar a Etapa 2 (podem se repetir em componentes de Form):

- **`ring` sem sufixo numérico compila 3px no Tailwind 3.4.19 deste projeto, mas o Nuxt UI v4.10.0/Tailwind v4 original usa 1px** — corrigido globalmente via `theme.extend.ringWidth.DEFAULT` no `tailwind.config.js`. Vale conferir de novo em qualquer tema novo que use `ring ring-inset` copiado do upstream.
- **Token semântico `neutral` do Nuxt UI é `slate` por padrão, não um cinza genérico** — os 9 `--ui-*` tokens que dependem dele já foram corrigidos em `src/styles/gravity-elements.css`; não deveria recorrer, mas vale checar se componentes de Form introduzem novos tokens dependentes de `neutral`.
- **Host custom-element (AngularJS) não herda automaticamente stretch/tamanho do elemento visível interno** — já mordeu `geSkeleton` (host com tamanho, `<div>` interno com `height:0`) e `geButton`/`geBadge` dentro de `geFieldGroup` (host esticado, elemento interno não). Atenção redobrada em qualquer componente de Form usado dentro de `FieldGroup`/grids — mesma classe de bug tende a se repetir.
- **A live `ui.nuxt.com` pode mostrar uma versão de tema mais nova que a tag `v4.10.0` pinada** — sempre confirmar contra o tarball real do npm (`registry.npmjs.org/@nuxt/ui/-/ui-4.10.0.tgz`) e a tag do GitHub, nunca só a doc ao vivo, antes de reportar uma "divergência" como bug.
- **`ng-attr-data-*` nunca resolve se colidir com `BOOLEAN_ATTR` do AngularJS** (achado no Calendar) — checklist §5.10 da spec da Etapa 1; provavelmente relevante de novo em Form (`data-invalid`, `data-checked`, etc. em Checkbox/Switch/RadioGroup).
- **Karma/ChromeHeadless não roda neste sandbox Cowork** (sem Chrome ARM64 instalável) — todo o ciclo desta etapa foi verificado por build isolado (lint/rollup/tailwind) + execução real em navegador de verdade (Chrome do usuário via `claude-in-chrome`) ou jsdom, nunca só leitura de código. Continua valendo pra Etapa 2.

## Próximo passo

**Escrever `spec-etapa-2-form.md`** no molde de `spec-etapa-1-layout-element.md` (contrato completo por componente, ARIA, casos de teste mínimos, checklist Tailwind v4→v3, TODO espelhando o TickTick), cobrindo os 21 componentes de Form listados em `gravity-elements-plano-etapas.md` (seção "Etapa 2"). Decisões já confirmadas a incorporar na spec: `ngMessages` para validação (não schema/zod), ColorPicker sobre Pickr, FileUpload sobre ng-file-upload, roving tabindex via `tabbable` em Select/SelectMenu/InputMenu/Listbox, `<input type=radio|checkbox>` nativo em RadioGroup/CheckboxGroup. A partir desta etapa, cada tarefa `Componente: X` já nasce incluindo a atualização da rota/página de demo e a comparação visual pontual como parte da própria definição de pronto (ver `processo-implementacao.md`, seção "Demo app atualizado a cada tarefa") — não repetir o padrão da Etapa 1 de deixar isso para uma tarefa em lote no fim.

Recomendação registrada em 2026-08-20: abrir uma **nova sessão/chat** (mesmo projeto/pasta) pra conduzir a Etapa 2, em vez de continuar na sessão que fechou a Etapa 1 — o histórico dessa sessão já passou por uma compactação por tamanho, e a Etapa 2 é comparável em volume (21 componentes + lógica nova de `ngModel`/`ngMessages`). Este arquivo, mais `spec-etapa-1-layout-element.md`, `processo-implementacao.md` e `gravity-elements-plano-etapas.md`, devem ser suficientes pra uma sessão nova retomar sem perda de contexto.

Antes de seguir: dar `git push` do que estiver pendente localmente (checar `git status`).

## Gestão de tarefas (TickTick)

- Grupo "Gravity Elements" (antes "GravityUi", antes "SingularUi"), com um projeto por etapa (Etapa 0 a 6 + Etapa 9).
- Sincronizado manualmente, sempre após verificação independente da entrega real no repositório — nunca por relato automático do Cursor ou autoclaim.
- Regra do processo: o Cursor nunca edita o TickTick diretamente; o TODO da seção 9 de cada spec de etapa é o espelho/fonte de verdade, e a sincronização com o TickTick é feita nesta sessão (Claude/Cowork), sempre após inspeção direta do código/testes.

## Processo de execução (Cursor)

Detalhado por completo em `specs/processo-implementacao.md`. Resumo: um chat de "Plan mode" no Cursor por tarefa individual do TODO (não por etapa inteira); fluxo Plan → aprovação do Otávio → Build → atualizar o TODO com evidência só depois de verificar comportamento; TickTick é sincronizado exclusivamente por esta sessão (Claude/Cowork), sempre após verificação independente, nunca por relato. Arquivo `plantask.md` na raiz do repo é o template usado para abrir os chats do Cursor.
