Você vai trabalhar em uma única tarefa do projeto Gravity Elements, definida no arquivo
specs/spec-etapa-2-form.md deste repositório.

Tarefa (copiar exatamente): "Componente: CheckboxGroup"

**Contexto**: `geCheckbox` está concluído e verificado (marcado `[x]` na seção 12 da spec,
incluindo uma correção de ARIA feita numa segunda rodada — leia a sub-linha de evidência
completa antes de começar, e a nova seção 5.15 da spec, escrita por causa desse achado). Antes
de propor qualquer plano:

1. **Inspecione o estado atual do repositório** — não assuma nada de sessões anteriores. Rode
   `git status`/`git log -1`, confirme que `src/components/form/checkbox/` existe e está
   completo, e que `src/components/form/checkbox_group/`(ou nome de pasta equivalente —
   confirme a convenção kebab-case da seção 3 da spec: `checkbox-group/`) ainda não existe.
2. Leia a seção 6 da spec (tabela de componentes Form), linha `geCheckboxGroup` — bindings de
   partida: `options` (`<`, array de `{ value, label, description, disabled }` ou array de
   strings), `orientation` (`@`), `color`/`size`/`variant` (`@`, propagam pros itens). **Não é
   um contrato fechado** (seção 5.1) — confirme contra a tag `v4.10.0` real
   (`raw.githubusercontent.com/nuxt/ui/v4.10.0/src/theme/checkbox-group.ts` e
   `CheckboxGroup.vue`) antes de implementar.
3. `ngModel` = **array** de valores selecionados (diferente do `geCheckbox`, que é boolean) —
   aplique o mesmo padrão de `require: { ngModelCtrl: 'ngModel' }` no host (seção 5.3), mas com
   `$formatters`/`$parsers` que de fato convertam array↔array (identidade é aceitável se não
   houver necessidade de normalização, mas documente a decisão) e `$render` que marca/desmarca
   cada `<input type="checkbox">` de opção conforme o array do modelo contém ou não o `value`
   daquela opção.
4. Reaproveite o que já existe em `geCheckbox` sempre que fizer sentido — mesma estrutura de
   slots do tema (`root`/`base`/`indicator`/`icon`/`label`/`description`), mesmo tratamento de
   `disabled` por opção, mesmos nomes seguros de `data-is-*` (seção 5.11) — mas **não** copie
   `<ge-checkbox>` como sub-componente automaticamente sem checar a v4.10.0 primeiro: confirme
   se o `CheckboxGroup` real do Nuxt UI reusa o `Checkbox` internamente ou tem seu próprio
   markup de item; documente o que foi confirmado.
5. **ARIA (seção 5.8 + a nova seção 5.15, leia com atenção)**: `role="group"` no fieldset
   visual, `aria-label`/`aria-labelledby` apontando pro texto do grupo (se houver um label de
   grupo — confirme se a tabela precisa de um binding `label`/`legend` que a linha da seção 6
   não listou). A seção 5.15 é o ponto principal desta tarefa em termos de ARIA: **a
   invalidez/obrigatoriedade pertence ao grupo, não a cada checkbox individual** — não replique
   a correção de `aria-invalid`/`aria-required` por-input feita no `geCheckbox` (isso não faz
   sentido aqui, um checkbox desmarcado dentro de um grupo válido não é "inválido" sozinho).
   Aplique `aria-invalid`/`aria-required` no elemento com `role="group"` (equivalente ao "host"
   focável certo aqui), refletindo `vm.ngModelCtrl.$invalid`/presença de
   `vm.ngModelCtrl.$validators.required`, com o mesmo gate de `$dirty` já usado no `geCheckbox`
   para não anunciar "inválido" antes do usuário interagir. Verifique isso por execução real
   (jsdom ou Karma), não só por leitura de código — é exatamente o tipo de coisa que passou
   despercebida no `geCheckbox` na primeira rodada.
6. Checklist `ng-attr-data-*`/`BOOLEAN_ATTR` (seção 5.11) e Tailwind v3→v4 (seção 5.10) — mesma
   atenção já aplicada em `geCheckbox`, incluindo conferir o CSS realmente compilado (não só a
   safelist) para qualquer classe arbitrária nova que o tema de `CheckboxGroup` introduzir.
7. Casos de teste mínimos (seção 5.9): os 4 do baseline de `ngModel` (render inicial, interação
   do usuário, mudança externa pós-montagem, estado inválido) **mais** o caso de seleção
   múltipla exigido para `CheckboxGroup`/`RadioGroup`/`Listbox` (marcar/desmarcar múltiplas
   opções e confirmar que o array do modelo reflete exatamente o que está marcado, na ordem
   certa — decida e documente se é ordem de marcação ou ordem de exibição das opções) **mais**
   o caso de `aria-invalid`/`aria-required` no grupo (item 5 acima), com o mesmo par
   pristine/dirty já testado no `geCheckbox`.
8. Demo (seção 7 da spec, regra do processo — parte da própria definição de pronto): criar
   `demo/pages/form/checkbox-group.html` + entrada em `demo/routes.js`, uso básico com
   `ng-model` array + 2-3 variações (`orientation`, `disabled` por opção, `color`/`size`).
   Comparação visual pontual com `ui.nuxt.com/docs/components/checkbox-group` (v4.10.0 fixada).

Verifique que nenhuma mudança quebra o que já existe: `npm run lint` limpo, `npm run build:js`/
`build:css` sem erro, `geCheckboxGroup` registrado em `gravityElements.components` via
injector, CSS compilado realmente contém as classes novas (não só a safelist).

Proponha um plano do que vai ser criado/alterado (arquivos e pastas) para completar essa
tarefa. Não implemente nada ainda — aguarde minha aprovação do plano.

Depois de aprovado: implemente, rode qualquer verificação aplicável, e só então marque o item
como "- [x]" no TODO (seção 12) de `specs/spec-etapa-2-form.md`, com uma sub-linha de evidência
do que foi feito (incluindo a rota de demo tocada e a decisão tomada sobre onde aplicar
`aria-invalid`/`aria-required` de grupo, item 5). Não altere o texto do item. Não toque em
nenhum sistema de gestão de tarefas fora deste arquivo — o TickTick é sincronizado
exclusivamente pela sessão Claude/Cowork, nunca pelo Cursor.
