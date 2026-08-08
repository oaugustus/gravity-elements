Você vai trabalhar em uma única tarefa do projeto Gravity Elements, definida no arquivo
specs/spec-etapa-1-layout-element.md deste repositório.

Tarefa (copiar exatamente): "Componente: Chip"

Antes de propor qualquer plano:
1. Leia specs/spec-etapa-1-layout-element.md por completo, especialmente a seção 7 —
   bindings do `geChip`: `text`/`label` (`@`), `color` (`@`), `size` (`@`), `position`
   (`@`), `standalone` (`<`). Nota da tabela: "paridade com indicador de notificação
   do Nuxt UI (usado sozinho ou sobre outro elemento)" — ou seja, o Chip pode
   envolver/decorar outro elemento (transclusion) OU ser renderizado sozinho
   (`standalone`), com posicionamento absoluto (`position`: provavelmente
   top-right/top-left/bottom-right/bottom-left, conferir upstream).
2. `geAvatar` (`src/components/element/avatar/avatar.component.js` +
   `avatar.theme.js`) já implementa um indicador inline aproximando `UChip`
   (`chipColor`/`chipPosition`) como placeholder — conferir esse código antes de
   começar, pode ter pistas de nomenclatura/posicionamento já usadas no projeto,
   mas o `geChip` real desta tarefa é o componente standalone completo (a versão
   do Avatar deve continuar como está, fora de escopo retrofitá-la agora).
3. Consulte o Nuxt UI real na tag fixada pela seção 5.1 (**v4.10.0**) — busque
   `src/theme/chip.ts` e `src/runtime/components/Chip.vue` em
   raw.githubusercontent.com/nuxt/ui/v4.10.0/... (não use github.com/.../tree/...,
   retorna vazio).
4. Checklist obrigatório da seção 5.7 antes de portar qualquer classe do tema —
   4 padrões que já causaram bugs reais nesta etapa:
   - Opacidade sobre `var()` (`bg-primary/75`, `ring-color/25`) → escrever
     `[color-mix(in_srgb,var(--ui-*)_N%,transparent)]` por extenso.
   - `ring-N`/`outline-N` fora da escala fixa 0/1/2/4/8 do Tailwind v3 → valor
     arbitrário (`outline-[3px]`) ou a utilidade sem sufixo se cair exatamente num
     desses passos.
   - Variantes `not-*` → sem equivalente no v3; reescrever como seletor arbitrário
     ou aceitar inerte (documentar).
   - **Seção 5.10**: se o tema usar algum atributo `data-*` condicional
     (`data-selected`, `data-disabled`, `data-checked`, `data-required`, `data-open`,
     `data-multiple`) aplicado via `ng-attr-data-<palavra>` num elemento
     `input`/`select`/`option`/`textarea`/`button`/`form`/`details`, o atributo NUNCA
     é escrito no DOM (colisão silenciosa com `BOOLEAN_ATTR` do AngularJS — sem erro,
     sem aviso). Renomear pra uma palavra que não colida (ex. `data-is-selected`) se
     esse padrão aparecer. Ver `calendar.theme.js`/`calendar.component.js` como
     precedente do fix. Um `<span>` (como o Chip provavelmente usa) não está na lista
     de elementos afetados (`input`/`select`/`option`/`textarea`/`button`/`form`/
     `details`), mas confira mesmo assim se o Chip usar algum desses elementos.
   Depois de portar, seguir a seção 5.6 — **verificação de CSS compilado obrigatória**
   pra qualquer classe que use um dos três primeiros padrões: build isolado do
   Tailwind CLI + confirmação por busca direta no CSS gerado (não só a safelist).
5. Qualquer binding `<`/`@` que possa mudar depois do `$onInit` (aqui, plausivelmente
   `color`/`size`/`position`/`standalone`/`text` todos mudam em uso real — ex. um
   badge de notificação que atualiza a contagem) precisa de `vm.$onChanges` chamando
   a mesma lógica de recálculo do `$onInit`, não só `vm.$onInit`. Padrão já
   estabelecido em `alert.component.js`/`banner.component.js`/`badge.component.js`/
   `button.component.js`/`calendar.component.js`/`card.component.js` — função de
   render compartilhada entre os dois hooks.
6. Confira a seção 9 (Critérios de aceite) itens 1, 2 e 5 (contrato completo + teste +
   build UMD/Rollup sem regressão) se aplicam a esta tarefa.

Proponha um plano do que vai ser criado (arquivos e pastas) para completar essa
tarefa. Não implemente nada ainda — aguarde minha aprovação do plano.

Depois de aprovado: implemente, rode qualquer verificação aplicável, e só então
marque o item como "- [x]" no TODO (seção 12) deste mesmo arquivo de spec, com uma
sub-linha de evidência do que foi feito. Não altere o texto do item. Não toque
em nenhum sistema de gestão de tarefas fora deste arquivo.
