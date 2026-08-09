Você vai trabalhar em uma única tarefa do projeto Gravity Elements, definida no arquivo
specs/spec-etapa-1-layout-element.md deste repositório.

Tarefa (copiar exatamente): "Componente: Progress"

Antes de propor qualquer plano:
1. Leia specs/spec-etapa-1-layout-element.md por completo, especialmente:
   - Seção 7 — bindings do `geProgress`: `value` (`<`), `max` (`<`, default 100),
     `color` (`@`), `size` (`@`), `status` (`<`, boolean — mostra label de %).
     **Escopo explícito da spec: "Barra simples; sem animação de indeterminate
     nesta etapa a menos que o Nuxt UI v4.10.0 original tenha (conferir antes de
     implementar)."** Já conferi: o upstream **tem** estado indeterminate (quando
     `modelValue`/`value` é `null`/omitido) com animações elaboradas
     (`animate-[carousel/swing/elastic...]`, controladas por uma prop `animation`
     que **não está** na lista de bindings da seção 7 acima). Decisão de escopo
     recomendada: portar o **estado visual indeterminate** (sem `aria-valuenow`
     quando não há `value`, indicador sem `transform` fixo) mas **não portar as 4
     variantes de animação nem a prop `animation`** — ficam fora do binding
     contract desta etapa. Se quiser dar algum feedback visual no indeterminate,
     uma única animação simples (ex. `animate-pulse`) é suficiente; documentar a
     decisão no comentário do `*.component.js`.
   - Seção 5.5 (ARIA): `role="progressbar"`, `aria-valuenow`/`aria-valuemin`/
     `aria-valuemax` no elemento base — **omitir `aria-valuenow` quando
     indeterminate** (padrão ARIA progressbar).
2. Consulte o Nuxt UI real na tag fixada pela seção 5.1 (**v4.10.0**) — busque
   `src/theme/progress.ts` e `src/runtime/components/Progress.vue` em
   raw.githubusercontent.com/nuxt/ui/v4.10.0/... (não use github.com/.../tree/...,
   retorna vazio). Pontos de atenção específicos ao portar (já mapeados, evita
   retrabalho):
   - `theme/progress.ts` tem `steps`/`step`/`orientation`/`inverted` além de
     `animation` — **fora do escopo desta etapa** (não estão nos bindings da seção
     7; a spec já cortou pra "barra simples"). Portar só `slots.root`/`base`/
     `indicator`/`status`, `variants.color` (indicator/steps → usar só a parte
     `indicator`), `variants.size` (mapeado pro binding `size`, incluindo os
     `compoundVariants` de altura `orientation: horizontal` × `size` — como só tem
     orientação horizontal nesta etapa, pode simplificar a chave `orientation` do
     `tv()` fora ou fixar sempre horizontal internamente), `defaultVariants` (`color:
     'primary'`, `size: 'md'`; **default `md` mesmo sem estar na tabela da seção
     7**, que só documenta os bindings, não os defaults).
   - `base: 'relative overflow-hidden rounded-full bg-accented'` — o token
     `bg-accented` já tem precedente mapeado em `--ui-bg-accented` (ver
     `gravity-elements.css` e `button.theme.js`, variant neutral soft/subtle) — usar
     `bg-[var(--ui-bg-accented)]`.
   - `indicator: 'rounded-full size-full transition-transform duration-200
     ease-out'` — o `transform: translateX(-N%)` (ou `translateY` se algum dia
     vertical existir, não nesta etapa) é calculado dinamicamente por cima do
     percentual — igual ao upstream, isso é `style` inline no elemento (via
     `ng-style` ou interpolação), **não** uma classe Tailwind estática.
   - `status: 'flex text-dimmed transition-[width] duration-200'` — token
     `text-dimmed` já tem precedente (`--ui-text-dimmed`, adicionado na tarefa
     Card) — usar `text-[var(--ui-text-dimmed)]`.
   - `color.neutral` → `indicator: 'bg-inverted'` → `bg-[var(--ui-bg-inverted)]`
     (mesmo precedente de Badge/Chip/Kbd).
3. Checklist obrigatório §5.7/§5.10 antes de portar qualquer classe do tema:
   - Confira se sobra alguma opacidade `/N` sobre `var()` nas partes portadas
     (não deveria, já que os slots relevantes aqui não usam `/N` no upstream) —
     se aparecer em algum ajuste seu, seguir o padrão `color-mix()`.
   - `ring`/`outline` não usados neste tema — N/A.
   - `not-*` não usado neste tema — N/A.
   - Se decidir usar algum atributo `data-state` (ex. `data-state="indeterminate"`),
     confirme que não colide com `BOOLEAN_ATTR` se aplicado via `ng-attr-data-*`
     num elemento `input`/`select`/`option`/`textarea`/`button`/`form`/`details`
     (improvável aqui, root/base devem ser `div`, mas confirme).
   Verificação de CSS compilado obrigatória (seção 5.6) pra qualquer classe que
   use um dos padrões acima: build isolado do Tailwind CLI + busca direta no CSS
   gerado.
4. `value`/`max`/`color`/`size`/`status` são bindings que plausivelmente mudam
   depois do `$onInit` (barra de progresso real muda de valor com frequência) —
   `vm.$onChanges` chamando a mesma lógica de recálculo do `$onInit`, padrão já
   estabelecido (ver `kbd.component.js`/`chip.component.js` como precedente).
5. Mínimo 2 casos de teste (seção 12, `geProgress` não está na lista de exceção
   5.6 — `geCalendar`/`geCollapsible`/`geAvatarGroup`). Sugestão de cobertura:
   calcula `aria-valuenow`/largura do indicador corretamente pra um `value`/`max`
   dados; estado indeterminate (sem `value`) omite `aria-valuenow` e aplica
   variant/estado indeterminate.
6. Confira a seção 9 (Critérios de aceite) itens 1, 2 e 5.

Proponha um plano do que vai ser criado (arquivos e pastas) para completar essa
tarefa. Não implemente nada ainda — aguarde minha aprovação do plano.

Depois de aprovado: implemente, rode qualquer verificação aplicável, e só então
marque o item como "- [x]" no TODO (seção 12) deste mesmo arquivo de spec, com uma
sub-linha de evidência do que foi feito. Não altere o texto do item. Não toque
em nenhum sistema de gestão de tarefas fora deste arquivo.
