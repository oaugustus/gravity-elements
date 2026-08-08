Você vai trabalhar em uma única tarefa do projeto Gravity Elements, definida no arquivo
specs/spec-etapa-1-layout-element.md deste repositório.

Tarefa (copiar exatamente): "Componente: Card"

Antes de propor qualquer plano:
1. Leia specs/spec-etapa-1-layout-element.md por completo, especialmente a seção 6/7
   — hoje o texto do `geCard` está assim: "Multi-slot via `transclude: { header:
   '?geCardHeader', body: '?geCardBody', footer: '?geCardFooter' }` (ou slot único se
   o Nuxt UI v4.10.0 original for mais simples — conferir `ui.nuxt.com/docs/components/
   card` antes de decidir)". Ou seja: **a decisão entre multi-slot e slot único ainda
   não está tomada** — é parte desta tarefa decidir, com base no upstream real, e
   documentar a decisão na evidência (mesmo padrão já usado pra `geFooter`, registrado
   como decisão explícita na spec em 2026-08-07).
2. Sem bindings próprios documentados hoje (`geCard | —`) — confirme isso contra o
   Nuxt UI real antes de assumir; pode ter `variant` ou props de espaçamento que a
   tabela da seção 7 ainda não capturou.
3. Consulte o Nuxt UI real na tag fixada pela seção 5.1 (**v4.10.0**) — busque
   `src/theme/card.ts` e `src/runtime/components/Card.vue` em
   raw.githubusercontent.com/nuxt/ui/v4.10.0/... (não use github.com/.../tree/...,
   retorna vazio).
4. Se o plano usar `transclude` multi-slot, `geFooter` (`src/components/layout/footer/`)
   e `geSidebar` (`src/components/layout/sidebar/`) já são precedentes funcionando desse
   padrão neste projeto — seguir a mesma estrutura (`transclude: { slot: '?geCardSlot' }`
   + conteúdo default via transclusion simples).
5. Checklist obrigatório da seção 5.7 antes de portar qualquer classe do tema —
   4 padrões que já causaram bugs reais nesta etapa (cada um exige adaptação manual,
   não só troca de token semântico por `var()`):
   - Opacidade sobre `var()` (`bg-primary/75`, `ring-color/25`) → escrever
     `[color-mix(in_srgb,var(--ui-*)_N%,transparent)]` por extenso.
   - `ring-N`/`outline-N` fora da escala fixa 0/1/2/4/8 do Tailwind v3 → valor
     arbitrário (`outline-[3px]`) ou a utilidade sem sufixo se cair exatamente num
     desses passos.
   - Variantes `not-*` (`not-only:`, `not-first:` etc.) → sem equivalente no v3;
     reescrever como seletor arbitrário (`[&:not(...)]:`) ou aceitar inerte
     (documentar) se a variante nunca for ativada pelo controller.
   - **Novo (seção 5.10, achado na revisão do Calendar em 2026-08-08)**: se o tema
     usar algum atributo `data-*` condicional (`data-selected`, `data-disabled`,
     `data-checked`, `data-required`, `data-open`, `data-multiple` — qualquer um desses
     nomes exatos) aplicado via `ng-attr-data-<palavra>` num elemento
     `input`/`select`/`option`/`textarea`/`button`/`form`/`details`, o atributo NUNCA
     é escrito no DOM (colisão silenciosa com o `BOOLEAN_ATTR` do AngularJS 1.8.3 —
     sem erro, sem aviso, `npm test` passa normalmente). Se aparecer esse padrão,
     renomear pra uma palavra que não colida (ex. `data-is-selected`) tanto no
     template quanto no tema (`data-[selected]:` → `data-[is-selected]:`). Ver
     `calendar.theme.js`/`calendar.component.js` como precedente do fix.
   Depois de portar, seguir a seção 5.6 — **verificação de CSS compilado obrigatória**
   pra qualquer classe que use um dos três primeiros padrões: build isolado do
   Tailwind CLI + confirmação por busca direta no CSS gerado (não só a safelist).
6. **Se o componente ganhar algum binding `<`/`@` que pode mudar depois do
   `$onInit`** (pouco provável pra um Card simples sem lógica, mas confirme): seguir
   o padrão já estabelecido em `alert.component.js`/`banner.component.js`/
   `badge.component.js`/`button.component.js`/`calendar.component.js` — lógica de
   render numa função compartilhada, chamada por `vm.$onInit` **e** `vm.$onChanges`.
7. Confira a seção 9 (Critérios de aceite) itens 1, 2 e 5 (contrato completo + teste +
   build UMD/Rollup sem regressão) se aplicam a esta tarefa.

Proponha um plano do que vai ser criado (arquivos e pastas) para completar essa
tarefa. Não implemente nada ainda — aguarde minha aprovação do plano.

Depois de aprovado: implemente, rode qualquer verificação aplicável, e só então
marque o item como "- [x]" no TODO (seção 12) deste mesmo arquivo de spec, com uma
sub-linha de evidência do que foi feito. Não altere o texto do item. Não toque
em nenhum sistema de gestão de tarefas fora deste arquivo.
