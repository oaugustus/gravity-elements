(function () {
  'use strict';

  // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
  // Upstream: theme/skeleton.ts — base top-level normalizado para slots.base (geTv).
  // Adaptação TW3: bg-elevated → bg-[var(--ui-bg-elevated)] (token já em gravity-elements.css).
  // Sem variants / compoundVariants / defaultVariants.
  //
  // Correção pós-revisão (2026-08-09, aplicada diretamente, sem passar pelo Cursor):
  // upstream (Vue) aplica a `class` do consumidor (ex. `h-4 w-[250px]`) direto no
  // MESMO elemento raiz que tem `animate-pulse`/`bg-elevated` (fallthrough attrs de
  // componente de raiz única). Aqui `geSkeleton` é `<ge-skeleton>` (host) envolvendo
  // um `<div>` interno (`skeleton.html`) — width/height/classes aplicados no host
  // (via `style=` ou classe Tailwind) NÃO chegam ao `<div>` interno automaticamente,
  // que ficava com `height: 0` (div vazio, sem conteúdo, sem tamanho próprio) mesmo
  // com o host corretamente dimensionado. Resultado: skeleton invisível sempre que
  // dimensionado no host (uso natural do componente, replicado em `demo/pages/element/skeleton.html`).
  // Corrigido adicionando `w-full h-full` pro `<div>` interno herdar 100% da caixa
  // do host — preserva a decisão de "sem tamanho próprio" (nenhum `size-*` fixo
  // no tema, igual upstream) só resolvendo o preenchimento do host.
  angular.module('gravityElements.element').constant('geSkeletonTheme', {
    slots: {
      base: 'w-full h-full animate-pulse rounded-md bg-[var(--ui-bg-elevated)]',
    },
  });
})();
