(function () {
  'use strict';

  // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
  // Upstream: theme/avatar-group.ts — slots root/base + variants size/color.
  // Tailwind v3: ring-bg → ring-[var(--ui-bg)]; ring-3 → ring (DEFAULT TW3 = 3px;
  // ring-3 não existe no tema 3.4.19).
  angular.module('gravityElements.element').constant('geAvatarGroupTheme', {
    slots: {
      root: 'inline-flex flex-row-reverse justify-end',
      base: 'relative rounded-full ring-[var(--ui-bg)] first:me-0',
    },
    variants: {
      size: {
        '3xs': {
          base: 'ring -me-0.5',
        },
        '2xs': {
          base: 'ring -me-0.5',
        },
        xs: {
          base: 'ring -me-0.5',
        },
        sm: {
          base: 'ring-2 -me-1.5',
        },
        md: {
          base: 'ring-2 -me-1.5',
        },
        lg: {
          base: 'ring-2 -me-1.5',
        },
        xl: {
          base: 'ring -me-2',
        },
        '2xl': {
          base: 'ring -me-2',
        },
        '3xl': {
          base: 'ring -me-2',
        },
      },
      color: {
        primary: '',
        secondary: '',
        success: '',
        info: '',
        warning: '',
        error: '',
        neutral: '',
      },
    },
    defaultVariants: {
      size: 'md',
      color: 'neutral',
    },
  });
})();
