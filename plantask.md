Você vai trabalhar em uma única tarefa do projeto Gravity Elements, definida no arquivo
specs/spec-etapa-1-layout-element.md deste repositório.

Tarefa (copiar exatamente): "Componente: Icon"

Antes de propor qualquer plano:
1. Leia specs/spec-etapa-1-layout-element.md por completo, especialmente a seção 5.4
   ("Ícones"): `geIcon` é **deliberadamente fino** — aplica o binding `name` como
   classe CSS no elemento (`<i class="{{ vm.name }} {{ vm.classes.base }}"></i>` ou
   `<span>` equivalente), mais classes de tamanho via `geTv`. O projeto **não
   empacota sistema de ícones** — cabe ao app consumidor registrar uma fonte de
   ícones compatível com classes CSS (Iconify via `@iconify/tailwind`, Font Awesome,
   etc.). Documentar essa decisão no comentário do `*.component.js`.
2. **Sem tema 1:1 no upstream.** Diferente de todos os componentes anteriores,
   `theme/icon.ts` **não existe** no Nuxt UI v4.10.0 — confirmado via
   `raw.githubusercontent.com/nuxt/ui/v4.10.0/src/theme/icon.ts` (404/vazio). O
   `Icon.vue` upstream delega pro módulo `@nuxt/icon` e recebe `size` como valor
   numérico/pixel bruto (não é variant do `tv()`), então não há classes Tailwind de
   tamanho pra portar 1:1. Não perder tempo tentando achar um `theme/icon.ts` que
   não existe.
3. **Precedente de tamanho a seguir** (pra manter consistência com o resto do
   projeto, já que não há upstream): os componentes já implementados que usam ícone
   internamente (`geButton`, `geBadge`) têm seus próprios slots `leadingIcon`/
   `trailingIcon` com uma escala de tamanho já estabelecida — ver
   `src/components/element/button/button.theme.js` (dentro de `variants.size`):
   `xs`/`sm` → `size-4`, `md`/`lg` → `size-5`, `xl` → `size-6`. Usar essa mesma
   escala no `geIcon` próprio (`geIconTheme` com `variants.size` mapeando pra
   `size-4`/`size-5`/`size-6`, ou expandir pra incluir os tamanhos extras que outros
   componentes já usam como `3xs`/`2xs`/`2xl`/`3xl` se fizer sentido, olhando os
   `theme.js` de `geAvatar`/`geChip` como referência adicional de escala completa).
   Documentar no comentário do `*.theme.js` que essa escala é decisão própria do
   projeto (não portada de um `theme/icon.ts` upstream, que não existe).
4. Contrato de arquivos (seção 5.1): como não há tema upstream pra citar com
   `// Portado de github.com/nuxt/ui...`, `geIcon` pode ser um dos casos "3 arquivos
   sem tema upstream" (como `geApp`) **ou** ter um `*.theme.js` próprio documentado
   como decisão interna do projeto — decida com base em como os outros componentes
   com ícone (`geButton`/`geBadge`) já leem esse tamanho e mantenha consistência;
   provavelmente faz mais sentido `geIcon` TER um `*.theme.js` (só sem o cabeçalho
   de "portado de upstream"), já que ele precisa de `geTv` pra resolver `size`.
5. Bindings §7: só `name` (`@`) e `size` (`@`). Sem lógica de estado — não precisa de
   `$onChanges` (nenhum efeito colateral além do template interpolado
   `class="{{ vm.name }} {{ vm.classes.base }}"`, que já reage a mudança de binding
   automaticamente via interpolação, sem precisar de controller recalculando nada).
   Se decidir usar `geTv` pra `size`, aí sim `$onChanges` se aplica pro recálculo de
   `vm.classes` — seguir o padrão já estabelecido nesse caso (ver
   `chip.component.js`/`collapsible.component.js` como precedente mais simples).
6. Checklist §5.7/§5.10 aplicável se o tema usar algum padrão de risco (opacidade
   sobre `var()`, `ring`/`outline` fora da escala, `not-*`, `ng-attr-data-*` colidindo
   com `BOOLEAN_ATTR`) — improvável pra um componente deste tamanho, mas confirme.
7. Mínimo 2 casos de teste (seção 12): aplica `name` como classe, aplica tamanho
   correto via `size`. Confira a seção 9 (Critérios de aceite) itens 1, 2 e 5.

Proponha um plano do que vai ser criado (arquivos e pastas) para completar essa
tarefa. Não implemente nada ainda — aguarde minha aprovação do plano.

Depois de aprovado: implemente, rode qualquer verificação aplicável, e só então
marque o item como "- [x]" no TODO (seção 12) deste mesmo arquivo de spec, com uma
sub-linha de evidência do que foi feito. Não altere o texto do item. Não toque
em nenhum sistema de gestão de tarefas fora deste arquivo.
