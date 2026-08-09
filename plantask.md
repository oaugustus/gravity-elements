Você vai trabalhar em uma única tarefa do projeto Gravity Elements, definida no arquivo
specs/spec-etapa-1-layout-element.md deste repositório.

Tarefa (copiar exatamente): "Componente: Skeleton"

Antes de propor qualquer plano:
1. Leia specs/spec-etapa-1-layout-element.md por completo, especialmente:
   - Seção 7 — `geSkeleton` não tem bindings (`—`): "Só classes de tema (animação
     `pulse` via CSS/Tailwind, sem JS)."
   - Seção 5.5 (ARIA): `aria-hidden="true"` — é só placeholder visual, não deve ser
     anunciado por leitor de tela.
2. Consulte o Nuxt UI real na tag fixada pela seção 5.1 (**v4.10.0**) — busque
   `src/theme/skeleton.ts` e `src/runtime/components/Skeleton.vue` em
   raw.githubusercontent.com/nuxt/ui/v4.10.0/... (não use github.com/.../tree/...,
   retorna vazio). Já conferido: é o componente mais simples da etapa —
   `theme/skeleton.ts` é só `{ base: 'animate-pulse rounded-md bg-elevated' }`, sem
   `variants`/`compoundVariants`/`defaultVariants`. `Skeleton.vue` renderiza um
   `<slot/>` (transclusion simples) e aplica no upstream `aria-busy="true"
   aria-label="loading" aria-live="polite" role="alert"` — **a seção 7/5.5 deste
   projeto pede só `aria-hidden="true"`, diferente do upstream** (que usa
   `role="alert"` + `aria-live`). Seguir a decisão já registrada na spec deste
   projeto (`aria-hidden="true"`, sem `role="alert"`/`aria-live`/`aria-busy`) — é a
   fonte de verdade aqui, não o upstream nesse ponto específico.
3. `bg-elevated` já tem precedente mapeado em `--ui-bg-elevated` (ver
   `gravity-elements.css` e vários `*.theme.js` já portados) — usar
   `bg-[var(--ui-bg-elevated)]`.
4. `transclude: true` — o `<slot/>` do upstream sugere que o skeleton pode envolver
   conteúdo (placeholder de tamanho fixo definido por CSS externo/classe utilitária
   do próprio elemento, como `<ge-skeleton class="h-4 w-32"></ge-skeleton>` — mas
   como o projeto não expõe binding de tamanho, isso fica a cargo de quem consome o
   componente aplicar dimensões via classe externa ou conteúdo transcluído).
5. Checklist §5.7/§5.10: tema de uma linha só, sem opacidade/`var()`, sem
   `ring`/`outline`, sem `not-*`, sem `data-*` — N/A em tudo, mas confirme mesmo
   assim (nunca pule a checklist só porque parece óbvio).
6. Sem bindings reativos (`—` na seção 7) → não precisa de `$onChanges`; se ainda
   assim usar `geTv` (recomendado, pra manter o padrão do projeto mesmo sem
   variants), `$onInit` chamando `geTv(geSkeletonTheme)()` uma vez já é suficiente
   (sem props que mudam, não há o que recalcular depois — documentar essa decisão
   se pular `$onChanges`).
7. Mínimo 2 casos de teste (seção 12). Sugestão: aplica classes do tema
   (`animate-pulse`/`rounded-md`/`bg-[var(--ui-bg-elevated)]`) corretamente;
   `aria-hidden="true"` presente no elemento; conteúdo transcluído aparece dentro.
8. Confira a seção 9 (Critérios de aceite) itens 1, 2 e 5.

**Nota**: esta é a última tarefa de componente individual da Etapa 1 (seção 12) —
depois dela restam só "Demo app: 1 rota por componente desta etapa" e os 2
critérios de aceite finais (comparação visual com ui.nuxt.com, navegação por
teclado do Calendar). Não pule pra essas tarefas ainda — só Skeleton agora.

Proponha um plano do que vai ser criado (arquivos e pastas) para completar essa
tarefa. Não implemente nada ainda — aguarde minha aprovação do plano.

Depois de aprovado: implemente, rode qualquer verificação aplicável, e só então
marque o item como "- [x]" no TODO (seção 12) deste mesmo arquivo de spec, com uma
sub-linha de evidência do que foi feito. Não altere o texto do item. Não toque
em nenhum sistema de gestão de tarefas fora deste arquivo.
