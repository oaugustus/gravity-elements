Você vai trabalhar em uma única tarefa do projeto Gravity Elements, definida no arquivo
specs/spec-etapa-1-layout-element.md deste repositório.

Tarefa (copiar exatamente): "Componente: Calendar"

Antes de propor qualquer plano:
1. Leia specs/spec-etapa-1-layout-element.md por completo, especialmente:
   - Seção 7 (bindings do geCalendar: `modelValue` (`<`, Date), `onUpdate` (`&`),
     `minDate` (`<`), `maxDate` (`<`), `locale` (`@`, opcional)).
   - Seção 5.6 — **5 casos de teste mínimos, não 2**: navegação por seta (foco move
     um dia), `Home`/`End` (início/fim da semana), `PageUp`/`PageDown` (troca de mês,
     com o mês exibido atualizado), `Enter`/`Espaço` seleciona o dia focado e dispara
     `onUpdate`, e um caso de limite (`minDate`/`maxDate` desabilita navegação além
     do intervalo).
   - Seção 5.5 (ARIA) — o que já existir de convenção pra grid de dias/roving tabindex.
2. Este é o **primeiro componente "não trivial" da etapa** (rota de grid de dias com
   navegação por teclado). Duas bibliotecas já são dependências do projeto
   especificamente pra isso — não reimplementar na mão:
   - `date-fns` (`startOfMonth`, `endOfMonth`, `addMonths`, `format`, `isSameDay`,
     etc.) pra toda matemática de datas.
   - `tabbable` (já usada na Etapa 0) pra roving tabindex do grid de dias.
3. Consulte o Nuxt UI real na tag fixada pela seção 5.1 (**v4.10.0**) — busque
   `src/theme/calendar.ts` e `src/runtime/components/Calendar.vue` em
   raw.githubusercontent.com/nuxt/ui/v4.10.0/... (não use github.com/.../tree/...,
   retorna vazio). O Calendar do Nuxt UI usa `@internationalized/date` (Reka UI) —
   não é dependência deste projeto; portar só a estrutura visual do tema e a lógica
   de navegação/seleção usando `date-fns` no lugar.
4. Checklist obrigatório da seção 5.7 antes de portar qualquer classe do tema —
   3 padrões Tailwind v4 que não compilam no TW 3.4.19 deste projeto:
   - Opacidade sobre `var()` (`bg-primary/75`, `ring-color/25`) → escrever
     `[color-mix(in_srgb,var(--ui-*)_N%,transparent)]` por extenso.
   - `ring-N`/`outline-N` fora da escala fixa 0/1/2/4/8 → valor arbitrário
     (`outline-[3px]`) ou a utilidade sem sufixo se cair exatamente num desses passos.
   - Variantes `not-*` → sem equivalente no v3; reescrever como seletor arbitrário
     ou aceitar inerte (documentar).
   Depois de portar, seguir a seção 5.6 — **verificação de CSS compilado obrigatória**
   pra qualquer classe que use um desses padrões: build isolado do Tailwind CLI +
   confirmação por busca direta no CSS gerado (não só a safelist).
5. **Lição da revisão do Button/Alert/Badge/Banner (2026-08-08, seção 5.8 revisada)**:
   todo componente com bindings que podem mudar depois do `$onInit` (aqui,
   `modelValue`/`minDate`/`maxDate`/`locale` — todos plausíveis de mudar em uso real,
   ex. o componente pai troca o mês/intervalo permitido programaticamente) precisa de
   `vm.$onChanges` chamando a mesma lógica de recálculo do `$onInit` (não só
   `vm.$onInit`). Ver `alert.component.js`/`banner.component.js`/`badge.component.js`/
   `button.component.js` como precedente do padrão (`render()` compartilhado entre os
   dois hooks). Cuidado extra aqui: mudar `minDate`/`maxDate`/`modelValue` depois do
   mount não deve resetar qual dia está com foco/tabindex se não for necessário.
6. Seção 5.8 (nota `ngAnimate`) não deve afetar o Calendar diretamente (não tem
   `ng-if` no grid), mas se o plano usar `ng-repeat` pros dias do mês, atenção ao
   mesmo tipo de classe transitória em testes.
7. Confira a seção 9 (Critérios de aceite) — o item 7 é específico do Calendar:
   "Calendar navegável por teclado — os 5 casos da seção 5.6 passando, mais
   confirmação manual no demo app". O demo app ainda não existe nesta etapa
   (é uma tarefa separada, mais pra frente); a parte de confirmação manual fica
   pendente até lá, mas os 5 casos automatizados são parte desta tarefa.

Proponha um plano do que vai ser criado (arquivos e pastas) para completar essa
tarefa. Não implemente nada ainda — aguarde minha aprovação do plano.

Depois de aprovado: implemente, rode qualquer verificação aplicável, e só então
marque o item como "- [x]" no TODO (seção 12) deste mesmo arquivo de spec, com uma
sub-linha de evidência do que foi feito. Não altere o texto do item. Não toque
em nenhum sistema de gestão de tarefas fora deste arquivo.
