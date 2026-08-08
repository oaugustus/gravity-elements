# Gravity Elements — Spec de Implementação: Etapa 1 (Layout + Element)

> Documento autocontido para implementação por agente de codificação (Cursor AI), nos moldes de `spec-etapa-0-fundacao.md`. Referências completas de arquitetura estão em `gravity-elements-especificacao-tecnica.md`; o processo operacional completo (papéis, fluxo Plan→Build→TODO, sincronização com TickTick) está em `processo-implementacao.md` — este documento extrai e detalha apenas o necessário técnico para a Etapa 1.

## Fluxo de trabalho desta etapa (importante)

Mesmo fluxo da Etapa 0, documentado em detalhe em `processo-implementacao.md`. Resumo:

- Este agente **não tem e não deve buscar acesso** ao TickTick. Progresso é reportado exclusivamente marcando os itens do **TODO da seção 12** deste arquivo.
- **Um chat de Plan mode por item do TODO**, não um chat por componente-e-meio nem por categoria inteira. Cada chat começa sem memória do que veio antes — o prompt de abertura (template `plantask.md`) deve sempre incluir o texto exato da tarefa, a referência de seção deste documento, e instrução para inspecionar o repositório atual antes de planejar.
- Marcar `- [x]` só quando implementado **e verificado** (teste rodou e passou, não só "código escrito"). Sub-linha de evidência obrigatória. Não alterar o texto dos itens — espelham string-a-string as tarefas do TickTick.
- Checkpoint manual adicional já vale a partir desta etapa para os componentes com lógica de verdade: **Calendar** (navegação por teclado), **Collapsible** (abrir/fechar) e **AvatarGroup** (colapso em "+N") — o Otávio confere manualmente no demo app antes de considerar a tarefa concluída, mesmo com a evidência do Cursor já registrada.

## 1. Objetivo

Implementar os 24 componentes das categorias **Layout** e **Element** do Nuxt UI, com paridade visual e de API, usando a fundação da Etapa 0 (`geTv`, `geId`, `geColorMode`, `geOverlayStack`, diretivas de interatividade). Esta é a primeira etapa que produz componentes `ge*` de produção — valida o padrão `component + theme + geTv` em volume antes dos casos complexos de formulário/overlay das etapas seguintes.

Por que Layout+Element primeiro (já decidido em `gravity-elements-plano-etapas.md`): a maioria é estática ou tem estado local simples. Só **Collapsible**, **Calendar** e **AvatarGroup** têm lógica não trivial — os demais 21 são majoritariamente `geTv` + template + bindings.

## 2. Stack e dependências desta etapa

Nenhuma dependência nova de comportamento é necessária — `geTv`, `geId`, `geColorMode` (Etapa 0) e os módulos oficiais `ngAria`/`ngAnimate` já cobrem o que esta etapa precisa. `date-fns` (já instalado na Etapa 0, previsto para uso a partir daqui) entra em uso agora, no **Calendar**.

Uma dependência nova, **só para o demo app** (não é dependência do pacote publicado, não entra no bundle UMD):

- `angular-route` — módulo oficial `ngRoute`, mesma versão `1.8.3` das demais libs `angular-*`, fixada exata (`--save-exact`), como **devDependency** (o demo não é publicado; a biblioteca em si não força roteador nenhum ao app consumidor — ver seção 8).

## 3. Estrutura de pastas a criar

```
gravity-elements/
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── app/
│   │   │   │   ├── app.component.js
│   │   │   │   ├── app.html
│   │   │   │   ├── app.theme.js
│   │   │   │   └── app.component.spec.js
│   │   │   ├── container/        (mesmos 4 arquivos, padrão <feature>.<tipo>.js)
│   │   │   ├── error/
│   │   │   ├── footer/
│   │   │   ├── header/
│   │   │   ├── main/
│   │   │   ├── sidebar/
│   │   │   ├── theme/
│   │   │   └── layout.module.js
│   │   ├── element/
│   │   │   ├── alert/
│   │   │   ├── avatar/
│   │   │   ├── avatar-group/
│   │   │   ├── badge/            (substitui o smoke throwaway de test/smoke/badge/ — ver §7)
│   │   │   ├── banner/
│   │   │   ├── button/
│   │   │   ├── calendar/
│   │   │   ├── card/
│   │   │   ├── chip/
│   │   │   ├── collapsible/
│   │   │   ├── field-group/
│   │   │   ├── icon/
│   │   │   ├── kbd/
│   │   │   ├── progress/
│   │   │   ├── separator/
│   │   │   ├── skeleton/
│   │   │   └── element.module.js
│   │   └── components.module.js   # agrega layout.module + element.module
│   └── gravity-elements.module.js # passa a incluir 'gravityElements.components'
├── demo/
│   ├── routes.js                  # ngRoute config, 1 entrada por componente
│   └── pages/
│       ├── layout/<nome>.html     # 1 página por componente Layout
│       └── element/<nome>.html    # 1 página por componente Element
```

Nome de pasta = kebab-case do componente (`avatar-group/`, `field-group/`), nome de arquivo = `<feature>.<tipo>.js` (Y070), elemento HTML = `ge-avatar-group` etc.

`src/index.js` (bundle UMD, criado na Etapa 0) passa a importar `components.module.js` e cada `*.component.js`/`*.theme.js` desta etapa — ver critério de aceite 2 na seção 9.

## 4. Convenções obrigatórias (recap da Etapa 0, seção 4 da especificação técnica)

Aplicar em todo arquivo criado nesta etapa, sem exceção:

- Um artefato Angular por arquivo, IIFE (Y001, Y010).
- `controllerAs: 'vm'` em todo componente (Y030–Y032) — nenhum componente novo usa `$scope` clássico.
- Funções nomeadas dentro de `.component()` (Y024).
- Getter syntax encadeada em todo arquivo exceto a declaração do módulo (Y021–Y023).
- Prefixo `ge` no nome do componente (`geButton`, não `suButton` — a Etapa 0 já corrigiu esse resíduo de nome antigo).
- `bindings` documentados via JSDoc no topo do controller, espelhando os nomes de prop do Nuxt UI (`color`, `variant`, `size`...) sempre que possível, para consulta cruzada com `ui.nuxt.com/docs/components/<nome>`.

## 5. Contrato de componente (recap da especificação técnica, seção 5)

Todo componente desta etapa tem, no mínimo, os 4 arquivos: `*.component.js`, `*.html`, `*.theme.js`, `*.component.spec.js`. O exemplo de referência (`button.component.js`/`button.theme.js`) já está na especificação técnica, seção 5 — usar como molde de estrutura (não copiar os valores de classe, que são específicos do Button).

**Algoritmo do tema**: todo `*.theme.js` é `.constant()` no módulo de categoria (`gravityElements.element` ou `gravityElements.layout`), consumido via `geTv` (já implementado e testado na Etapa 0) — não reimplementar resolução de variantes componente a componente.

**Exceção — componentes sem tema upstream**: nem todo componente do Nuxt UI tem um `theme/<nome>.ts` correspondente. Alguns (confirmado para `App` na v4.10.0 — ver seção 6) são só provedores de contexto/configuração, sem template visual ou classes próprias. Nesses casos, **pular o `*.theme.js`** (não criar um arquivo vazio ou inventar classes) — os outros 3 arquivos do contrato (`*.component.js`, `*.html`, `*.component.spec.js`) continuam obrigatórios. Antes de aplicar essa exceção a qualquer componente, confirmar contra a versão fixada na seção 5.1 (não assumir por semelhança de nome) e registrar a confirmação na evidência do TODO (seção 12), citando o que foi checado.

### 5.1 Referência de design — versão fixada

**Referência: Nuxt UI `v4.10.0`** (`github.com/nuxt/ui`, tag/release correspondente a essa versão — confirmar tag exata no GitHub antes de começar; era a última versão publicada no npm em 2026-08-06, data desta spec). Portar quase 1:1 os arquivos `theme/<nome>.ts` dessa versão fixa, não da branch `main`/`latest` a esmo — a Etapa 1 pode se estender por várias sessões de Cursor sem prazo definido (prioridade baixa do projeto), e o Nuxt UI pode publicar novas versões nesse meio-tempo; usar sempre a v4.10.0 como base evita inconsistência visual entre componentes portados em momentos diferentes.

Se, ao longo da etapa, uma nova versão do Nuxt UI for lançada e algum componente específico precisar dela por algum motivo pontual, registrar a exceção explicitamente na evidência do TODO (qual componente, qual versão, por quê) — não trocar a referência da etapa inteira sem atualizar esta seção primeiro.

Nuxt UI v4 unificou Nuxt UI + Nuxt UI Pro (release de setembro/2025) sem reescrever a arquitetura de tema da v3 (migração descrita pelo próprio Nuxt como "effortless", ao contrário do salto v2→v3) — a base já assumida na especificação técnica (Vue 3 + Reka UI + `tailwind-variants`) continua válida.

Cada `*.theme.js` portado leva o cabeçalho de atribuição:
```js
// Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
```

### 5.2 Padrão de bindings

Bindings simples (`@`, string/enum) para props visuais (`color`, `variant`, `size`), `<` (one-way) para valores/objetos/booleans, `&` para callbacks (`onClick`, `onClose`). Nenhum componente desta etapa usa `require: 'ngModel'` — isso começa na Etapa 2 (Form).

### 5.3 Transclusion

Componentes com conteúdo livre (`geCard`, `geFooter`, `geHeader`, `geFieldGroup`) usam `transclude: true` (ou `transclude: { slotName: '?elementName' }` para multi-slot, disponível desde Angular 1.5) — não reinventar sistema de slots.

### 5.4 Ícones (`geIcon` e uso interno por outros componentes)

O Nuxt UI usa o módulo `Icon` (Iconify) para resolver qualquer coleção de ícones por nome de string. O AngularJS não tem equivalente pronto e o Gravity Elements **não empacota um sistema de ícones próprio** (fora de escopo — ver seção 10). `geIcon` é deliberadamente fino: aplica o binding `name` como classe CSS no elemento (`<i class="{{ vm.name }} {{ vm.classes.base }}"></i>` ou `<span>` equivalente) mais classes de tamanho via `geTv`. Cabe ao app consumidor registrar uma fonte de ícones compatível com classes CSS (ex.: Iconify via `@iconify/tailwind`, Font Awesome, ou qualquer lib que resolva `name` → ícone visível). Documentar essa decisão no README do componente e no `*.component.js` via comentário.

**Componentes que usam `icon` antes de `geIcon` existir**: pela ordem do TODO (seção 12), vários componentes com binding `icon` (`geError`, `geAlert`, `geBanner`...) são implementados antes da tarefa `Componente: Icon`. Não bloquear nem reordenar o TODO por causa disso — aplicar a mesma classe CSS diretamente no template do componente (o que `geIcon` faria, só inline), com um comentário no `*.component.js` marcando que deve ser trocado por `<ge-icon>` quando a tarefa `Componente: Icon` for concluída.

### 5.4.1 Sub-componentes ainda não implementados (ex.: botões dentro de outro componente)

Alguns componentes do Nuxt UI usam `UButton` internamente (ex.: `Error` tem um botão "voltar"). Pela ordem do TODO, `geButton` só é implementado na tarefa 14 — não vale a pena adiar nem reordenar tarefas anteriores por causa disso (quebraria a sequência Layout→Element já fixada no TickTick). Nesses casos, usar `<button>` nativo com classes Tailwind estáticas aproximando os valores default do `UButton` correspondente (tamanho, cor, variante), documentado com um comentário indicando que deve ser revisitado para usar `<ge-button>` depois que a tarefa `Componente: Button` estiver concluída — mesmo padrão do `geApp` (stub revisitado na Etapa 4).

### 5.4.2 Bindings além do resumo das seções 6/7

As tabelas das seções 6 e 7 listam os bindings principais de cada componente como ponto de partida, não um contrato fechado — a seção 4 já manda espelhar os nomes de prop do Nuxt UI "sempre que possível". Se, ao consultar a versão fixada (seção 5.1), o componente real tiver props adicionais com slot correspondente no `theme/<nome>.ts` (ex.: `message`/`leadingIcon` em `Error`), incluir esses bindings também — não vale criar um tema com slots que o componente nunca usa (mesmo raciocínio, ao contrário, da exceção de tema ausente da seção 5). Registrar na evidência do TODO quais bindings foram adicionados além da tabela e por quê.

### 5.5 Acessibilidade (ARIA) por componente

`ngAria` (incluído em `gravityElements.core` desde a Etapa 0) cobre automaticamente `aria-disabled`/`aria-required`/`aria-checked`/`aria-invalid` quando os bindings correspondentes (`ng-disabled`, `ng-required`, `ngModel`) são usados — mas **não cobre roles nem atributos específicos de widget**, que precisam ser adicionados manualmente no template de cada componente. Mínimo obrigatório nesta etapa:

| Componente | ARIA mínimo |
|---|---|
| `geAlert` | `role="alert"` no elemento raiz. |
| `geBanner` | `role="status"` (ou `role="alert"` se `color` indicar erro/warning — decisão do Cursor, documentar). |
| `geAvatar` | `alt` obrigatório no `<img>` quando `src` é usado; `aria-hidden="true"` no fallback de ícone/iniciais quando não há texto acessível equivalente. |
| `geAvatarGroup` | `aria-label` no avatar `+N` (ex. `"mais 3"`), não só texto visual. |
| `geButton` | `aria-busy="true"` quando `loading` (além do `aria-disabled` automático via `ngAria`/`ng-disabled`). |
| `geCollapsible` | `aria-expanded` no elemento de trigger, `aria-controls` apontando pro id do painel (via `geId`, Etapa 0), painel com `aria-hidden` quando fechado. |
| `geCalendar` | Grid de dias com `role="grid"`/`role="row"`/`role="gridcell"` (ou `role="button"` por dia, se optar por estrutura mais simples — documentar a escolha), `aria-selected` no dia selecionado, `aria-label` por dia com data completa (via `date-fns format`), região do mês/ano com `aria-live="polite"` para anunciar troca de mês. |
| `geProgress` | `role="progressbar"`, `aria-valuenow`/`aria-valuemin`/`aria-valuemax`. |
| `geSeparator` | `role="separator"`, `aria-orientation` espelhando o binding `orientation`. |
| `geSkeleton` | `aria-hidden="true"` (é só placeholder visual, não deve ser anunciado por leitor de tela). |
| `geSidebar` | Botão de toggle com `aria-expanded` refletindo `collapsed`. |
| `geTheme` | Botão de troca de tema com `aria-label` descritivo (ex. `"Alternar tema claro/escuro"`) — não depender só de ícone. |

Demais componentes da tabela das seções 6/7 sem ARIA especificado aqui não têm requisito adicional além do que `ngAria` já cobre automaticamente.

### 5.6 Casos de teste mínimos — componentes com lógica

Os demais componentes (a maioria) seguem o padrão já validado na Etapa 0 para `geBadge`: pelo menos 2 casos por componente (defaultVariants e 1 override de prop relevante) já satisfazem o contrato. Os três com lógica de verdade precisam de mais:

- **`geCalendar`**: mínimo 5 casos — navegação por seta (foco move um dia), `Home`/`End` (início/fim da semana), `PageUp`/`PageDown` (troca de mês, com o mês exibido atualizado), `Enter`/`Espaço` seleciona o dia focado e dispara `onUpdate`, e um caso de limite (`minDate`/`maxDate` desabilita navegação além do intervalo).
- **`geCollapsible`**: mínimo 3 casos — abre e aplica `aria-expanded="true"` + remove `aria-hidden` do painel, fecha e reverte, e um caso com `disabled: true` confirmando que o toggle não muda o estado.
- **`geAvatarGroup`**: mínimo 3 casos — menos que `max` avatares (todos visíveis, sem "+N"), exatamente `max` (todos visíveis, sem "+N"), mais que `max` (excedente escondido, avatar "+N" com o número certo e `aria-label` correspondente).

## 6. Componentes — Layout (8)

| Componente | Bindings principais | Notas |
|---|---|---|
| `geApp` | — (sem bindings próprios) | **Sem `geApp.theme.js`** — confirmado que `App` não tem `theme/app.ts` na v4.10.0 (ver seção 5, exceção); é um componente provedor de contexto (Toast/Tooltip/overlays programáticos via Reka UI `ConfigProvider` no original), não visual. Nesta etapa, `geApp` é necessariamente um **stub** desse papel: só container raiz + transclusion, aplicando no `$onInit` o modo persistido de `geColorMode` (`get()`) — dogfooding do serviço da Etapa 0. O papel completo de provedor (Toast/overlays programáticos) só faz sentido a partir da Etapa 4 (Overlay), quando `geOverlayStack` e um futuro `geToast` existirem de verdade — revisar `geApp` nessa etapa, não tratar o resultado desta tarefa como versão final. |
| `geContainer` | `size` (`@`, opcional, largura máxima) | Wrapper simples de centralização/padding; transclusion. |
| `geError` | `statusCode` (`@`), `statusMessage` (`@`), `clear` (`<`, boolean — mostra botão), `onClear` (`&`) | Página de erro genérica (404/500), paridade com `Error` do Nuxt UI. |
| `geFooter` | — | **Multi-slot** (decisão registrada em 2026-08-07, §5.4.2): Nuxt UI v4.10.0 `Footer` tem slots `top`/`left`/`default`/`right`/`bottom` e tema com `root`/`top`/`bottom`/`container`/`left`/`center`/`right` — portar 1:1, não o wrapper de slot único descrito originalmente aqui. `transclude: { top: '?geFooterTop', left: '?geFooterLeft', right: '?geFooterRight', bottom: '?geFooterBottom' }` + conteúdo default (`center`) via transclusion simples, seguindo o padrão multi-slot já previsto na seção 5.3. |
| `geHeader` | `title` (`@`, opcional) | Transclusion com slot para ações à direita (`transclude: { title: '?geHeaderTitle', right: '?geHeaderRight' }` ou binding `title` + transclusion simples do restante — decisão livre do Cursor, documentar a escolhida). |
| `geMain` | — | Wrapper semântico (`<main>`), sem lógica. |
| `geSidebar` | `side` (`@`, `'left'`\|`'right'`, default `'left'`), `collapsible` (`@`, `'offcanvas'`\|`'icon'`\|`'none'`, default `'none'`), `variant` (`@`, `'sidebar'`\|`'floating'`\|`'inset'`, default `'sidebar'`), `open` (`<`, two-way via `=`), `onToggle`/`onOpenChange` (`&`) | **Tema desktop quase completo** (decisão registrada em 2026-08-06, §5.4.2): Nuxt UI v4.10.0 `Sidebar` tem tema com slots `root`/`gap`/`container`/`inner`/`header`/`wrapper`/`title`/`description`/`actions`/`close`/`body`/`footer`/`rail` e variantes `side`/`collapsible`/`variant`/`transition` — portar o tema e o comportamento desktop (`side`, `collapsible`, `variant`, transições), seguindo o mesmo precedente do `geHeader`: overlay/drawer mobile fica fora de escopo (Etapa 4, quando `geModal`/`geDrawer` existirem). `rail` (faixa fina sempre visível quando colapsado) também fica fora desta tarefa — é aditivo e não força mudança de API depois. Botão de toggle sem `geIcon`/`geButton`: usar `<button>` nativo com classe do slot `close`/`trigger`, mesmo padrão do placeholder já aceito em `geError` (§5.4.1). **Pré-requisito de infraestrutura**: o `geTv` atual (`core/tv/tv.service.js`) faz match estrito em `compoundVariants` e não resolve condições com array de valores (ex.: `collapsible: ['offcanvas', 'icon']` como OR) — estender `compoundMatches` para aceitar array faz parte do escopo desta tarefa, com cobertura própria em `tv.service.spec.js` (mínimo: 1 caso que ativa o compound via valor do array e 1 caso que não ativa). ARIA: ver seção 5.5. |
| `geTheme` | `mode` (`<`, opcional — controla `geColorMode` de fora) | Único componente desta etapa que integra `geColorMode` (Etapa 0) diretamente; expõe toggle claro/escuro básico. Variantes de outros componentes por tema (`ColorModeButton`/`Select`/`Switch`) ficam fora do escopo da v1 (especificação técnica, seção 12). ARIA: ver seção 5.5. |

## 7. Componentes — Element (16)

| Componente | Bindings principais | Notas |
|---|---|---|
| `geAlert` | `title` (`@`), `description` (`@`), `color` (`@`), `variant` (`@`), `icon` (`@`), `closable` (`<`), `onClose` (`&`) | Usa `geIcon` internamente se `icon` for passado. ARIA: ver seção 5.5. |
| `geAvatar` | `src` (`@`), `alt` (`@`), `text` (`@`, fallback iniciais), `icon` (`@`, fallback ícone), `size` (`@`), `chipColor`/`chipPosition` (`@`, indicador de status) | Fallback: `src` → `text` → `icon`, nessa ordem, resolvido no controller. ARIA: ver seção 5.5. |
| `geAvatarGroup` | `max` (`<`, número), `size` (`@`, propaga para os avatares filhos) | Transclusion de múltiplos `<ge-avatar>`; no `$onInit`/`$postLink`, conta os filhos, aplica overlap (classe de margem negativa via tema) e substitui o excedente (`> max`) por um avatar `+N`. Casos de teste mínimos: seção 5.6. |
| `geBadge` | `label` (`@`), `color` (`@`), `variant` (`@`), `size` (`@`) | **Promove o smoke test da Etapa 0** (`test/smoke/badge/`) à versão de produção em `src/components/element/badge/`. O smoke era deliberadamente mínimo (só `color`); esta versão precisa do contrato completo (`variant`, `size`, paridade total com `ui.nuxt.com/docs/components/badge`). Depois de migrado, apagar `test/smoke/badge/` (era descartável por definição — seção 6.7 da spec da Etapa 0) e remover as 3 linhas de `test/karma.conf.js` que carregavam o smoke module. |
| `geBanner` | `title` (`@`), `icon` (`@`), `color` (`@`), `closable` (`<`), `onClose` (`&`) | Transclusion opcional para ações extras. ARIA: ver seção 5.5. |
| `geButton` | `label` (`@`), `color` (`@`), `variant` (`@`), `size` (`@`), `block` (`<`), `square` (`<`), `loading` (`<`), `disabled` (`<`), `onClick` (`&`) | Exemplo de referência já dado na especificação técnica, seção 5 — implementar literalmente esse contrato (mais leading/trailing icon via `geIcon`, se aplicável). ARIA: ver seção 5.5. |
| `geCalendar` | `modelValue` (`<`, Date), `onUpdate` (`&`), `minDate` (`<`), `maxDate` (`<`), `locale` (`@`, opcional) | **Componente não trivial.** Grid de dias do mês com roving tabindex (`tabbable`, mesma lib da Etapa 0); navegação: setas movem foco dia-a-dia, `Home`/`End` vão para início/fim da semana, `PageUp`/`PageDown` trocam de mês, `Enter`/`Espaço` selecionam. Matemática de datas via `date-fns` (`startOfMonth`, `endOfMonth`, `addMonths`, `format`, `isSameDay`) — não reimplementar cálculo de calendário à mão. ARIA e casos de teste mínimos: seções 5.5/5.6. |
| `geCard` | — | Multi-slot via `transclude: { header: '?geCardHeader', body: '?geCardBody', footer: '?geCardFooter' }` (ou slot único se o Nuxt UI v4.10.0 original for mais simples — conferir `ui.nuxt.com/docs/components/card` antes de decidir). |
| `geChip` | `text`/`label` (`@`), `color` (`@`), `size` (`@`), `position` (`@`), `standalone` (`<`) | Paridade com indicador de notificação do Nuxt UI (usado sozinho ou sobre outro elemento). |
| `geCollapsible` | `modelValue` (`<`, boolean — aberto/fechado), `onUpdate` (`&`), `disabled` (`<`) | **Componente não trivial.** Transição de altura via `ngAnimate` (`ng-if`/`ng-show` com classes `.ge-collapsible-enter`/`.ge-collapsible-leave`, já que `ngAnimate` está incluído em `gravityElements.core` desde a Etapa 0) — não escrever animação JS própria. ARIA e casos de teste mínimos: seções 5.5/5.6. |
| `geFieldGroup` | `size` (`@`, propaga para os filhos) | Agrupamento visual de inputs/botões adjacentes (bordas coladas). Só o wrapper nesta etapa — inputs de verdade nascem na Etapa 2. |
| `geIcon` | `name` (`@`), `size` (`@`) | Ver seção 5.4 — aplica `name` como classe CSS, sem sistema de ícones embutido. |
| `geKbd` | `value` (`@`) ou `keys` (`<`, array) | Tabela estática de símbolos para teclas especiais (`cmd` → `⌘`, `shift` → `⇧` etc.), paridade com `Kbd` do Nuxt UI. |
| `geProgress` | `value` (`<`), `max` (`<`, default 100), `color` (`@`), `size` (`@`), `status` (`<`, boolean — mostra label de %) | Barra simples; sem animação de indeterminate nesta etapa a menos que o Nuxt UI v4.10.0 original tenha (conferir antes de implementar). ARIA: ver seção 5.5. |
| `geSeparator` | `orientation` (`@`, `'horizontal'`\|`'vertical'`), `label` (`@`, opcional), `color` (`@`), `size` (`@`), `type` (`@`, `'solid'`\|`'dashed'`) | Sem lógica além de `geTv`. ARIA: ver seção 5.5. |
| `geSkeleton` | — | Só classes de tema (animação `pulse` via CSS/Tailwind, sem JS). ARIA: ver seção 5.5. |

## 8. Demo app: 1 rota por componente

Adotar `ngRoute` (módulo oficial do AngularJS, mesma escolha "oficial primeiro" já usada para `ngAria`/`ngAnimate`/`ngMessages` na Etapa 0/2) só no `demo/`, como devDependency:

- `npm install angular-route@1.8.3 --save-exact --save-dev`.
- `demo/routes.js`: `$routeProvider.when('/layout/app', { templateUrl: 'demo/pages/layout/app.html' })` etc., uma entrada por componente (24 rotas), `otherwise` redirecionando para a primeira.
- Uma página HTML por componente em `demo/pages/<categoria>/<nome>.html`, com pelo menos: uso básico e 2–3 variações de props relevantes visíveis lado a lado (facilita a comparação visual do critério de aceite).
- `demo/index.html` ganha `ng-view` + navegação lateral simples (lista de links para as 24 rotas; pode usar o próprio `geSidebar` assim que estiver pronto — dogfooding, não obrigatório).
- Isso é aditivo ao demo existente da Etapa 0 (`demo/app.js`, `demo/smoke-tooltip.*`) — não remover o que já está lá, só estender.

## 9. Critérios de aceite (verificar e relatar todos)

1. Cada um dos 24 componentes: os arquivos do contrato completos (seção 5 — 4 arquivos, ou 3 nos casos documentados de exceção sem tema upstream, como `geApp`), teste unitário Karma passando com o mínimo de casos aplicável (seção 5.6 para `geCalendar`/`geCollapsible`/`geAvatarGroup`, 2 casos para os demais), ARIA mínimo aplicado onde exigido (seção 5.5), `eslint .` limpo.
2. `src/index.js` atualizado para importar `components.module.js` e cada `*.component.js`/`*.theme.js` desta etapa; `npm run build:js` (Rollup) continua gerando `dist/gravity-elements.umd.js` sem erro, com os 24 componentes registrados em `gravityElements.components` (verificar via injector, como já feito na Etapa 0 para `geId`/`geColorMode`).
3. `npm run build:css` (Tailwind) gera `dist/gravity-elements.css` sem erro **e** a safelist (`tailwind.safelist.json`) captura de fato as classes de todos os `*.theme.js` novos — esta é a primeira vez que `generate-tailwind-safelist.js` roda contra temas reais (na Etapa 0 só foi validado com 0 temas). Se algum tema do Nuxt UI usar classe montada dinamicamente (ex. `` `bg-${color}-500` ``), confirmar manualmente que a classe final aparece no CSS gerado; se o script não capturar, ajustar o script ou listar a classe explicitamente no `tailwind.config.js` (`safelist` estático) e registrar a exceção na evidência.
4. Demo app com as 24 rotas navegáveis (`npm run demo`), sem erro no console do navegador.
5. `npm test` (Karma) continua passando 100%, incluindo toda a suíte herdada da Etapa 0 (nenhuma regressão) — reportar a contagem final de testes.
6. [Critério de aceite] Comparação visual com `ui.nuxt.com` (versão v4.10.0 fixada na seção 5.1) sem divergência perceptível, componente a componente.
7. [Critério de aceite] Calendar navegável por teclado — os 5 casos da seção 5.6 passando, mais confirmação manual no demo app (checkpoint da seção "Fluxo de trabalho").

## 10. Fora de escopo desta etapa

Componentes de Form, Data, Navigation, Overlay e Dashboard (Etapas 2–6). Sistema de ícones embutido (só a classe-passthrough da seção 5.4). Variantes de Color Mode por componente (`ColorModeButton`/`Select`/`Switch` — v2, especificação técnica seção 12). Qualquer uso de `ge-floating-position`/`ge-focus-trap`/`ge-hotkey` (isso é Overlay, Etapa 4 — nenhum componente desta etapa precisa deles). Papel completo de `geApp` como provedor de Toast/overlays programáticos (equivalente ao `ConfigProvider`/`ToastProvider` do `UApp` original) — nesta etapa `geApp` é só um stub (seção 6); revisar na Etapa 4.

## 11. Sobre o mapeamento com o TickTick

O TODO da seção 12 é um espelho exato (mesmo texto, **incluindo o typo já existente no TickTick** — "Calendar navagável", não "navegável") das 27 tarefas do projeto "Etapa 1 - Layout + Element" no TickTick, já reordenadas na sequência correta (8 Layout, depois 16 Element, depois Demo app e os 2 critérios de aceite): 24 tarefas `Componente: <Nome>` (uma por componente, cobrindo os 4 artefatos do contrato + teste unitário passando cada uma, conforme critério 1 da seção 9), mais "Demo app: 1 rota por componente desta etapa" e os dois critérios de aceite finais da seção 9 (itens 6 e 7). Cada tarefa `Componente: X` só deve ser marcada `[x]` quando os 4 arquivos existirem, o teste unitário passar com o mínimo de casos exigido e o `eslint .` estiver limpo — não basta o `.component.js` existir.

## 12. TODO (espelho das tarefas do TickTick — marcar aqui, não no TickTick)

- [x] Componente: App
  - Evidência: criados `src/components/` + `layout.module.js` / `element.module.js` (stub) / `components.module.js`; `geApp` com 3 arquivos do contrato (`app.component.js`, `app.html`, `app.component.spec.js`) — **sem** `app.theme.js` (exceção §5/§6); confirmado na tag Nuxt UI `v4.10.0` ausência de `src/theme/app.ts` e `App.vue` só providers (ConfigProvider/Tooltip/Toaster/Overlay). Stub: transclude + `geColorMode.set(get())` no `$onInit`. Wiring em `gravity-elements.module.js`, `src/index.js`, `test/karma.conf.js`. `npm test` → 39 of 39 SUCCESS; `npm run lint` exit 0; `npm run build:js` → UMD com `geApp` em `gravityElements.layout` / `gravityElements.components`.
- [x] Componente: Container
  - Evidência: criados `src/components/layout/container/` com 4 arquivos do contrato (`container.component.js`, `container.html`, `container.theme.js`, `container.component.spec.js`); tema portado de Nuxt UI tag `v4.10.0` `src/theme/container.ts` (confirmado `base: 'w-full max-w-(--ui-container) mx-auto px-4 sm:px-6 lg:px-8'`), normalizado para `slots.base` + adaptação TW3 `max-w-[var(--ui-container)]`; `variants.size` (sm–2xl) como extensão Gravity §6 (upstream sem prop size); `--ui-container: 80rem` em `gravity-elements.css`; wiring em `src/index.js` e `test/karma.conf.js`. `npm test` → 41 of 41 SUCCESS; `npm run lint` exit 0; `npm run build:js` → UMD com `geContainer`/`geContainerTheme` em `gravityElements.layout`; `npm run build:css` → safelist 11 classes (1 theme), CSS inclui `max-w-[var(--ui-container)]` e `max-w-screen-*`.
  - **Correção retroativa descoberta nesta revisão (Claude/Cowork, fora do fluxo Cursor)**: `window.twMerge` nunca era setado no bundle publicado — só no shim de teste do Karma (`test/shims/tw-merge-export.js`), então `geTv` (Etapa 0) degradava silenciosamente para "sem merge" (`identityMerge`) em produção. Passou despercebido na Etapa 0 porque nenhum smoke test tinha classes conflitantes no mesmo slot; `geContainer` com `size="lg"` foi o primeiro caso real (`max-w-[var(--ui-container)]` da base + `max-w-screen-lg` da variante, coincidentemente correto por ordem do CSS gerado, mas sem garantia). Corrigido em `src/index.js` (`import { twMerge } from 'tailwind-merge'; window.twMerge = twMerge;`, fora do Karma) + exceção `angular/window-service` adicionada em `.eslintrc.cjs` para esse arquivo, mesmo padrão já usado em `tv.service.js`. Validado via build isolado + execução real em `jsdom`: `typeof window.twMerge === 'function'` e `geContainer[size=lg].className` passou a ter só `max-w-screen-lg` (sem a classe conflitante da base). `npm run lint` exit 0.
- [x] Componente: Error
  - Evidência: criados `src/components/layout/error/` com 4 arquivos do contrato (`error.component.js`, `error.html`, `error.theme.js`, `error.component.spec.js`); tema portado de Nuxt UI tag `v4.10.0` `src/theme/error.ts` (slots root/leading/leadingIcon/statusCode/statusMessage/message/links), adaptação TW3 `text-primary`/`text-highlighted`/`text-muted` → `text-[var(--ui-*)]`; bindings §6 + extras `message`/`icon` (§5.4.2); `icon` como classe CSS inline (§5.4) e clear via `<button>` nativo aproximando UButton lg/primary/solid label "Back to home" (§5.4.1); CSS vars `--ui-header-height`/`--ui-primary`/`--ui-text-*` em `gravity-elements.css`; wiring em `src/index.js` e `test/karma.conf.js`. `npm test` → 43 of 43 SUCCESS; `npm run lint` exit 0; `npm run build:js` → UMD com `geError`/`geErrorTheme` em `gravityElements.layout`; `npm run build:css` → safelist 34 classes (2 themes), CSS inclui `min-h-[calc(100vh-var(--ui-header-height))]` e tokens.
- [x] Componente: Footer
  - Evidência: criados `src/components/layout/footer/` com 4 arquivos do contrato (`footer.component.js`, `footer.html`, `footer.theme.js`, `footer.component.spec.js`); tema portado 1:1 de Nuxt UI tag `v4.10.0` `src/theme/footer.ts` (7 slots: root/top/bottom/container/left/center/right, sem variants); multi-slot `transclude: { top: '?geFooterTop', left: '?geFooterLeft', right: '?geFooterRight', bottom: '?geFooterBottom' }` + default → center — justificado §5.3/§5.4.2 (mesma lógica do Error: tabela §6 era simplificação; slots do componente batem com o tema real / `Footer.vue`); DOM right→center→left + `ge-container` interno; top/bottom condicionais via `$transclude.isSlotFilled`. Wiring em `src/index.js` e `test/karma.conf.js`. `npm test` → 45 of 45 SUCCESS; `npm run lint` exit 0; `npm run build:js` → UMD com `geFooter`/`geFooterTheme` em `gravityElements.layout`; `npm run build:css` → safelist 50 classes (3 themes), CSS inclui `lg:order-2` / `lg:justify-between`.
- [x] Componente: Header
  - Evidência: criados `src/components/layout/header/` com 4 arquivos do contrato (`header.component.js`, `header.html`, `header.theme.js`, `header.component.spec.js`); tema portado de Nuxt UI tag `v4.10.0` `src/theme/header.ts` — slots da barra estática (root/container/left/center/right/title), adaptação TW3 `bg-default/75`→`color-mix(--ui-bg)`, `border-default`→`border-[var(--ui-border)]`, `text-highlighted`→`text-[var(--ui-text-highlighted)]`, `h-(--ui-header-height)`→`h-[var(--ui-header-height)]`; **omitidos** slots `toggle`/`content`/`overlay`/`header`/`body` + `variants.toggleSide` (menu mobile Modal/Slideover/Drawer = Overlay Etapa 4; Angular não reutiliza left/right duas vezes — §5.4.2 / §10). Multi-slot §6: `transclude: { title: '?geHeaderTitle', left: '?geHeaderLeft', right: '?geHeaderRight', top: '?geHeaderTop', bottom: '?geHeaderBottom' }` + default → center; bindings `title`/`to` (§5.4.2). Tokens `--ui-bg`/`--ui-border` em `gravity-elements.css`. Wiring em `src/index.js` e `test/karma.conf.js`. `npm test` → 47 of 47 SUCCESS; `npm run lint` exit 0; `npm run build:js` → UMD com `geHeader`/`geHeaderTheme` em `gravityElements.layout`; `npm run build:css` → safelist 66 classes (4 themes), CSS inclui `sticky`/`backdrop-blur`/`h-[var(--ui-header-height)]`/`color-mix`.
- [x] Componente: Main
  - Evidência: criados `src/components/layout/main/` com 4 arquivos do contrato (`main.component.js`, `main.html`, `main.theme.js`, `main.component.spec.js`); tema portado de Nuxt UI tag `v4.10.0` `src/theme/main.ts` (`base: 'min-h-[calc(100vh-var(--ui-header-height))]'`), normalizado para `slots.base` (sem adaptação TW3 — classe já compatível); sem bindings (§6); `<main>` + transclusion; ARIA sem requisito extra (§5.5). Wiring em `src/index.js` e `test/karma.conf.js`. `npm test` → 49 of 49 SUCCESS; `npm run lint` exit 0; `npm run build:js` → UMD com `geMain`/`geMainTheme` em `gravityElements.layout`; `npm run build:css` → safelist 66 classes (5 themes; classe Main já coberta por `geErrorTheme`), CSS inclui `min-h-[calc(100vh-var(--ui-header-height))]`.
- [x] Componente: Sidebar
  - Evidência: criados `src/components/layout/sidebar/` com 4 arquivos do contrato (`sidebar.component.js`, `sidebar.html`, `sidebar.theme.js`, `sidebar.component.spec.js`); tema portado de Nuxt UI tag `v4.10.0` `src/theme/sidebar.ts` (13 slots root/gap/container/inner/header/wrapper/title/description/actions/close/body/footer/rail + variants side/collapsible/variant/transition + compoundVariants com arrays); adaptação TW3 `w-(--*)`→`w-[var(--*)]`, `divide/border/ring-default`→`[var(--ui-border)]`, `text-highlighted/muted`→tokens, `--spacing(N)`→rem; tokens `--sidebar-width`/`--sidebar-width-icon`/`--ui-border-accented` em `gravity-elements.css`. **Omitidos do template** (permanecem no tema): `rail` (aditivo §6) e overlay mobile Modal/Slideover/Drawer (Etapa 4, precedente Header). Bindings §6: `side`/`collapsible`/`variant`/`open` (`=?`)/`onToggle`/`onOpenChange` + extras `title`/`description` (§5.4.2); multi-slot header/title/description/actions/footer; toggle `<button>` nativo com `aria-expanded` (§5.4.1/§5.5). **Infra**: `geTv.compoundMatches` aceita array como OR + 2 testes em `tv.service.spec.js`. Wiring em `src/index.js` e `test/karma.conf.js`. `npm test` → 53 of 53 SUCCESS; `npm run lint` exit 0; `npm run build:js` → UMD com `geSidebar`/`geSidebarTheme`; `npm run build:css` → safelist 141 classes (6 themes).
- [x] Componente: Theme
  - Evidência: criados `src/components/layout/theme/` com 3 arquivos do contrato (`theme.component.js`, `theme.html`, `theme.component.spec.js`) — **sem** `theme.theme.js` (exceção §5): confirmado na tag Nuxt UI `v4.10.0` ausência de `src/theme/theme.ts` (Theme.vue é headless provide/inject) e de tema próprio do ColorModeButton (estende Button). Spec §6: toggle claro/escuro via `geColorMode` + binding `mode` (`<`); botão nativo aproximando UButton md/neutral/ghost/square (§5.4.1) com `aria-label="Alternar tema claro/escuro"` (§5.5) e ícones CSS `dark:hidden` / `hidden dark:inline-block` (§5.4). Wiring em `src/index.js` e `test/karma.conf.js`. `npm test` → 55 of 55 SUCCESS; `npm run lint` exit 0; `npm run build:js` → UMD com `geTheme` em `gravityElements.layout`; `npm run build:css` → safelist 141 classes (6 themes, inalterado).
- [x] Componente: Alert
  - Evidência: criados `src/components/element/alert/` com 4 arquivos do contrato (`alert.component.js`, `alert.html`, `alert.theme.js`, `alert.component.spec.js`); tema portado de Nuxt UI tag `v4.10.0` `src/theme/alert.ts` (slots root/wrapper/title/description/icon/avatar/avatarSize/actions/close + variants color/variant/orientation/title + compounds 6 cores×4 + neutral); adaptação TW3 `bg-/text-/ring-${color}` → `[var(--ui-*)]`, neutrals → `--ui-bg*`/`--ui-text-*`/`--ui-border*`; tokens `--ui-secondary|success|info|warning|error` + `--ui-bg-elevated`/`--ui-bg-inverted` em `gravity-elements.css`. Bindings §7 + extras `orientation`/`closeIcon` (§5.4.2); **omitidos do template** avatar/actions (slots no tema p/ safelist; dependem de geAvatar/geButton). `icon`/closeIcon classe CSS (§5.4) e close via `<button>` nativo aproximando UButton md/neutral/link (§5.4.1); `role="alert"` (§5.5); `closable`+`onClose` escondem o root. Wiring em `src/index.js` e `test/karma.conf.js`. `npm test` → 57 of 57 SUCCESS; `npm run lint` exit 0; `npm run build:js` → UMD com `geAlert`/`geAlertTheme` em `gravityElements.element`; `npm run build:css` → safelist 180 classes (7 themes), CSS inclui `bg-[var(--ui-primary)]` / tokens de cor.
  - **Correção pós-revisão**: TW 3.4.19 não gera CSS para `bg-[var(...)]/N` nem `ring-[var(...)]/N` (outline/soft/subtle + neutral soft/subtle visualmente sem fundo/anel). Em `alert.theme.js`, opacidades trocadas pelo padrão `color-mix` do Header (`bg-/ring-[color-mix(in_srgb,var(--ui-*)_N%,transparent)]`). `npm run build:css` → regras reais `background-color:color-mix(... 10%/50%...)` e `--tw-ring-color:color-mix(... 25%...)`; safelist sem `/10`/`/25`/`/50`. `npm test` → 57 of 57 SUCCESS; `npm run lint` exit 0; `npm run build:js` OK.
- [x] Componente: Avatar
  - Evidência: criados `src/components/element/avatar/` com 4 arquivos do contrato (`avatar.component.js`, `avatar.html`, `avatar.theme.js`, `avatar.component.spec.js`); tema portado de Nuxt UI tag `v4.10.0` `src/theme/avatar.ts` (slots root/image/fallback/icon + variants color/size); adaptação TW3 `bg-${color}/10` → `color-mix` (precedente Alert/Header), `bg-elevated`/`text-muted`/`text-${color}` → tokens `--ui-*`. Bindings §7 + extra `color` (§5.4.2); fallback controller `src` → `text`/iniciais de `alt` → `icon` (§7; upstream Vue prioriza icon); `onError` na img; `icon` classe CSS (§5.4); chip inline aproximando UChip inset via `chipColor`/`chipPosition` (§5.4.1 até geChip); ARIA §5.5 (`alt` no `<img>`, `aria-hidden` no fallback, `aria-label` no root quando alt no fallback). Wiring em `src/index.js` e `test/karma.conf.js`. `npm test` → 59 of 59 SUCCESS; `npm run lint` exit 0; `npm run build:js` → UMD com `geAvatar`/`geAvatarTheme` em `gravityElements.element`; `npm run build:css` → safelist 199 classes (8 themes).
- [ ] Componente: AvatarGroup
- [ ] Componente: Badge
- [ ] Componente: Banner
- [ ] Componente: Button
- [ ] Componente: Calendar
- [ ] Componente: Card
- [ ] Componente: Chip
- [ ] Componente: Collapsible
- [ ] Componente: FieldGroup
- [ ] Componente: Icon
- [ ] Componente: Kbd
- [ ] Componente: Progress
- [ ] Componente: Separator
- [ ] Componente: Skeleton
- [ ] Demo app: 1 rota por componente desta etapa
- [ ] [Critério de aceite] Comparação visual com ui.nuxt.com sem divergência perceptível
- [ ] [Critério de aceite] Calendar navagável por teclado
