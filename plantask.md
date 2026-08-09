Você vai trabalhar em uma única tarefa do projeto Gravity Elements, definida no arquivo
specs/spec-etapa-1-layout-element.md deste repositório.

Tarefa (copiar exatamente): "Componente: Separator"

Antes de propor qualquer plano:
1. Leia specs/spec-etapa-1-layout-element.md por completo, especialmente:
   - Seção 7 — bindings do `geSeparator`: `orientation` (`@`, `'horizontal'`|
     `'vertical'`), `label` (`@`, opcional), `color` (`@`), `size` (`@`), `type`
     (`@`, `'solid'`|`'dashed'`). "Sem lógica além de `geTv`" — componente simples,
     só resolve classes e o rótulo opcional.
   - Seção 5.5 (ARIA): `role="separator"`, `aria-orientation` espelhando o binding
     `orientation`.
2. Consulte o Nuxt UI real na tag fixada pela seção 5.1 (**v4.10.0**) — busque
   `src/theme/separator.ts` e `src/runtime/components/Separator.vue` em
   raw.githubusercontent.com/nuxt/ui/v4.10.0/... (não use github.com/.../tree/...,
   retorna vazio). Pontos já mapeados:
   - Upstream tem mais props que a lista da seção 7: `icon`, `avatar`, `position`
     (`start`|`center`|`end`, default `center`). **Fora do escopo desta etapa** (não
     estão nos bindings §7 — só `label` é suportado como conteúdo). Recomendação:
     fixar `position: 'center'` internamente no `geTv` (mesma estratégia já usada em
     `geProgress` pra `orientation: horizontal` — não expor como binding, só resolver
     o compound variant fixo). Documentar a omissão de `icon`/`avatar` no comentário.
   - `type` upstream tem 3 opções (`solid`/`dashed`/`dotted`), mas a seção 7 só lista
     `'solid'|'dashed'` — confirme se inclui `dotted` mesmo assim (barato, é só mais
     uma entrada no `variants.type`) ou se corta pra bater exatamente com a tabela;
     na dúvida, incluir as 3 não quebra nada e mantém paridade mais completa com o
     tema upstream.
   - `theme/separator.ts`: `slots.root/border/container/label` (mais `icon`/`avatar`/
     `avatarSize`, que ficam de fora já que `icon`/`avatar` não são bindings desta
     etapa); `variants.color` → `border-${color}` (cor sólida, **sem opacidade `/N`**
     — mapear direto pro token `--ui-*`, ex. `border-[var(--ui-primary)]`, sem
     precisar de `color-mix()`); `neutral` → `border-default` → já tem token
     `--ui-border` (ver `gravity-elements.css`) → `border-[var(--ui-border)]`;
     `variants.orientation` (horizontal/vertical, cada um com root/border/container
     próprios); `variants.size` (vazio, só existe pra virar chave dos
     `compoundVariants` de espessura); `variants.type` (`border-solid`/
     `border-dashed`/`border-dotted` — utilities padrão, sem adaptação).
   - `compoundVariants`: espessura por `orientation` × `size` (`border-t`/
     `border-t-[2px]`/`border-t-[3px]`/`border-t-[4px]`/`border-t-[5px]` horizontal;
     `border-s`/`border-s-[2px]`/.../`border-s-[5px]` vertical — `border-s` é lógico
     start-aware, padrão v3, sem adaptação) + margem do `container` por `position`
     (`me-3`/`mx-3`/`ms-3` horizontal; `mb-2`/`my-2`/`mt-2` vertical) — como
     `position` fica fixo em `center`, só os compounds de `position: center`
     (`mx-3` horizontal, `my-2` vertical) são relevantes; pode simplificar removendo
     os de `start`/`end` já que nunca são atingidos, ou manter todos por completude
     (decisão de quem implementar, documentar).
   - `defaultVariants`: `color: 'neutral'`, `size: 'xs'`, `type: 'solid'`.
3. Checklist obrigatório §5.7/§5.10:
   - Sem opacidade `/N` sobre `var()` neste tema (cores sólidas em `border-`) — N/A,
     mas confirme que não sobrou nenhum caso ao portar.
   - `ring`/`outline` não usados — N/A.
   - `not-*` não usado — N/A.
   - Sem `ng-attr-data-*` esperado — confirme.
   Ainda assim, verificação de CSS compilado (seção 5.6) recomendada pra qualquer
   valor arbitrário (`border-t-[2px]` etc.) — build isolado do Tailwind CLI.
4. `orientation`/`label`/`color`/`size`/`type` são bindings `@` que podem mudar
   pós-montagem → `vm.$onChanges` chamando a mesma lógica do `$onInit`, padrão já
   estabelecido (ver `kbd.component.js`/`progress.component.js` como precedentes).
5. Mínimo 2 casos de teste (seção 12). Sugestão: aplica `role="separator"` +
   `aria-orientation` correto pro binding `orientation`; renderiza `label` quando
   fornecido e aplica classes de cor/tipo/tamanho via `geTv`.
6. Confira a seção 9 (Critérios de aceite) itens 1, 2 e 5.

Proponha um plano do que vai ser criado (arquivos e pastas) para completar essa
tarefa. Não implemente nada ainda — aguarde minha aprovação do plano.

Depois de aprovado: implemente, rode qualquer verificação aplicável, e só então
marque o item como "- [x]" no TODO (seção 12) deste mesmo arquivo de spec, com uma
sub-linha de evidência do que foi feito. Não altere o texto do item. Não toque
em nenhum sistema de gestão de tarefas fora deste arquivo.
