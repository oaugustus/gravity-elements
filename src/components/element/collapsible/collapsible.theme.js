(function () {
  'use strict';

  // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
  // Upstream: theme/collapsible.ts — slots root/content.
  // content upstream:
  //   data-[state=open]:animate-[collapsible-down_200ms_ease-out]
  //   data-[state=closed]:animate-[collapsible-up_200ms_ease-out]
  //   data-[state=closed]:overflow-hidden
  // animate-[collapsible-*] depende de --reka-collapsible-content-height (Reka);
  // substituído por classe `ge-collapsible` + transição ngAnimate em
  // gravity-elements.css (§5.8). Mantido overflow-hidden no estado closed.
  // §5.7 N/A nos três padrões (sem opacidade/var()/N, sem ring/outline fora
  // da escala, sem not-*). §5.10: data-state (não data-open) — seguro.
  angular.module('gravityElements.element').constant('geCollapsibleTheme', {
    slots: {
      root: '',
      content: 'ge-collapsible data-[state=closed]:overflow-hidden',
    },
  });
})();
