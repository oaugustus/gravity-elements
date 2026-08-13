Você vai trabalhar em uma única tarefa do projeto Gravity Elements, definida no arquivo
specs/spec-etapa-1-layout-element.md deste repositório.

Tarefa (copiar exatamente): "Componente: Progress — expansão animation/orientation/inverted/max-array (pós-Etapa 1, 2026-08-13)"

**Contexto**: a Etapa 1 inteira já está concluída e verificada (24 componentes + demo app +
os 2 critérios de aceite finais). `geProgress` já existe e funciona
(`src/components/element/progress/progress.component.js`, `progress.html`,
`progress.theme.js`, `progress.component.spec.js`) cobrindo `value`/`max` (numérico)/
`color`/`size`/`status`, com um único `animate-pulse` genérico como feedback indeterminate.
Essa era uma decisão de escopo deliberada da Etapa 1 ("barra simples"). O usuário decidiu
agora expandir para paridade completa com o upstream. Esta tarefa é adicional, fora das 27
originais do TickTick — **não mexer no TickTick por causa dela** (só eu, Claude/Cowork,
sincronizo TickTick, e esta tarefa está deliberadamente fora desse mapeamento).

Antes de propor qualquer plano:

1. Leia a seção 7 da spec (tabela de componentes Element), linha `geProgress` — foi reescrita
   nesta data com o detalhamento completo do que falta: bindings novos (`orientation`,
   `inverted`, `animation`, `max` aceitando array de strings), slots novos (`steps`/`step`),
   variants novos (`orientation`, `inverted`, `animation`) e os compounds de animação.
2. Busque o tema upstream real antes de implementar (não confiar só no resumo da seção 7):
   `ui.nuxt.com/docs/components/progress` (exemplos e API) e o arquivo `theme/progress.ts` na
   tag `v4.10.0` do repositório `nuxt/ui` no GitHub (mesmo processo já usado nos outros 24
   componentes — `raw.githubusercontent.com/nuxt/ui/v4.10.0/src/theme/progress.ts`). Preste
   atenção especial a:
   - Os 8 `compoundVariants` de animação (`orientation` × `animation`: carousel,
     carousel-inverse, swing, elastic — cada um horizontal e vertical) usam classes
     `motion-safe:data-[state=indeterminate]:animate-[<keyframe>_2s_...]`. As variantes
     `motion-safe:`/`motion-reduce:` já existem nativamente no Tailwind 3.4.19 (não é um
     gap de v4→v3 como outros casos já resolvidos neste projeto) — mas as **keyframes em si**
     (`carousel`, `carousel-rtl`, `carousel-inverse`, `carousel-inverse-rtl`,
     `carousel-vertical`, `carousel-inverse-vertical`, `swing`, `swing-vertical`, `elastic`,
     `elastic-vertical`) são customizadas do Nuxt UI (definidas via `@theme`/CSS do Tailwind
     v4 upstream) e precisam ser portadas manualmente para `tailwind.config.js`
     (`theme.extend.keyframes` + `theme.extend.animation`) ou para `gravity-elements.css`
     diretamente — não existem nativamente no Tailwind 3.4.19. Buscar as definições exatas
     dessas keyframes no CSS/tema publicado do Nuxt UI (ou no pacote `@nuxt/ui` npm,
     `dist/runtime/...`) antes de aproximar valores.
   - `orientation` muda o eixo de vários slots (`root`: `w-full flex flex-col` horizontal vs
     `h-full flex flex-row-reverse` vertical; `base`: `w-full` vs `h-full`; `status`: linha vs
     coluna) e os compounds de altura/largura por `size` precisam ser duplicados por
     orientação (hoje só existe a versão horizontal, `h-*` fixo).
   - `inverted` só tem efeito em conjunto com `orientation` (2 compounds `inverted×horizontal`
     e `inverted×vertical`, mudando a direção de `status`/`step`).
   - `max` como array de strings ativa os slots `steps`/`step` (grid de labels sob a barra,
     step ativo com opacidade cheia, primeiro step com cor muted, os do meio com opacidade 0
     exceto o ativo, paridade exata com o exemplo "Waiting.../Cloning.../Migrating.../
     Deploying.../Done!" da doc upstream) — ver a lógica de `active`/`first`/`other`/`last`
     nos compounds do tema.
3. Confira o checklist de padrões Tailwind v4→v3 (seção 5.7 da spec) e o checklist de
   `ng-attr-data-*`/`BOOLEAN_ATTR` (seção 5.10) contra o que for escrito — mesmo processo já
   seguido nos outros 24 componentes.
4. `$onChanges` precisa recomputar `vm.classes`/estado derivado (não só `$onInit`) — todos os
   outros componentes desta etapa passaram por correção retroativa por esquecer disso (ver
   evidências de Alert/Badge/Button/Banner no TODO da seção 12); não repetir o erro aqui.
5. Casos de teste mínimos: pelo menos 2 casos novos por binding/variant novo (orientation,
   inverted, animation, max como array com steps renderizados) — seguir o padrão de
   `progress.component.spec.js` já existente (aria/percent/transform).
6. ARIA (seção 5.5): adicionar `aria-orientation` espelhando o binding `orientation`, mesmo
   padrão já usado em `geSeparator`.
7. Atualize a página demo (`demo/pages/element/progress.html`) com exemplos novos cobrindo
   pelo menos: Max simples (numérico), Max como array de steps, Animation (as 4 variantes ou
   pelo menos 2 lado a lado), Orientation vertical, Inverted — mesmo padrão de "uso básico +
   variações lado a lado" já usado nas outras 24 páginas (facilita comparação visual depois).

Verifique que nenhuma mudança quebra o que já existe: `npm test` (Karma) continua 100%,
`npm run lint` limpo, `npm run build:js`/`build:css` sem erro, CSS compilado realmente contém
as classes/keyframes novas (não só a safelist — checklist da seção 9, item 3, sobre "build
sem erro" não ser o mesmo que "CSS correto").

Proponha um plano do que vai ser criado/alterado (arquivos e pastas) para completar essa
tarefa. Não implemente nada ainda — aguarde minha aprovação do plano.

Depois de aprovado: implemente, rode qualquer verificação aplicável, e só então marque o item
como "- [x]" no TODO (seção 12) deste mesmo arquivo de spec, com uma sub-linha de evidência do
que foi feito. Não altere o texto do item. Não toque em nenhum sistema de gestão de tarefas
fora deste arquivo (e lembre-se: esta tarefa específica não existe no TickTick — não criá-la
lá).
