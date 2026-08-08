(function () {
  'use strict';

  // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
  // Upstream: theme/field-group.ts — base top-level normalizado para slots.base
  // (geTv) + variants size (vazios xs–xl) + orientation (horizontal/vertical).
  // fieldGroupVariant (not-*) vive nos temas dos filhos (Badge/Button), não aqui.
  // §5.7 N/A neste tema (sem opacidade/var()/N, sem ring/outline fora da escala,
  // sem not-*).
  angular.module('gravityElements.element').constant('geFieldGroupTheme', {
    slots: {
      base: 'relative',
    },
    variants: {
      size: {
        xs: '',
        sm: '',
        md: '',
        lg: '',
        xl: '',
      },
      orientation: {
        horizontal: 'inline-flex -space-x-px',
        vertical: 'flex flex-col -space-y-px',
      },
    },
    defaultVariants: {
      size: 'md',
      orientation: 'horizontal',
    },
  });
})();
