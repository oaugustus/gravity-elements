(function () {
  'use strict';

  // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
  // Upstream: theme/skeleton.ts — base top-level normalizado para slots.base (geTv).
  // Adaptação TW3: bg-elevated → bg-[var(--ui-bg-elevated)] (token já em gravity-elements.css).
  // Sem variants / compoundVariants / defaultVariants.
  angular.module('gravityElements.element').constant('geSkeletonTheme', {
    slots: {
      base: 'animate-pulse rounded-md bg-[var(--ui-bg-elevated)]',
    },
  });
})();
