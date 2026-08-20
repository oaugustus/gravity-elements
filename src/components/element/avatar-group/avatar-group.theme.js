(function () {
  'use strict';

  // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
  // Upstream: theme/avatar-group.ts — slots root/base + variants size/color.
  // Tailwind v3: ring-bg → ring-[var(--ui-bg)]; ring-3 → ring-[3px] (ring-3
  // não existe no TW 3.4.19 — só DEFAULT/0/1/2/4/8). Usa `ring-[3px]`
  // explícito (não `ring` puro) desde 2026-08-13: o DEFAULT de `ring` neste
  // projeto foi trocado de 3px pra 1px em tailwind.config.js pra bater com o
  // comportamento do TW4 (que os outros temas — Alert/Badge/Kbd/etc. — já
  // assumiam ao copiar `ring` puro do upstream); aqui o 3px é intencional
  // (anel de contorno maior nos avatares sobrepostos), então precisa ficar
  // explícito pra não encolher pra 1px junto com o resto.
  angular.module('gravityElements.element').constant('geAvatarGroupTheme', {
    slots: {
      root: 'inline-flex flex-row-reverse justify-end',
      base: 'relative rounded-full ring-[var(--ui-bg)] first:me-0',
    },
    variants: {
      size: {
        '3xs': {
          base: 'ring-[3px] -me-0.5',
        },
        '2xs': {
          base: 'ring-[3px] -me-0.5',
        },
        xs: {
          base: 'ring-[3px] -me-0.5',
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
          base: 'ring-[3px] -me-2',
        },
        '2xl': {
          base: 'ring-[3px] -me-2',
        },
        '3xl': {
          base: 'ring-[3px] -me-2',
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
