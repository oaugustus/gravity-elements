(function () {
  'use strict';

  // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
  // Upstream: theme/card.ts — slots root/header/title/description/body/footer
  // + variants.variant (solid|outline|soft|subtle).
  // Tailwind v3: text-highlighted/muted/dimmed/inverted → [var(--ui-*)];
  // bg-default/inverted → [var(--ui-bg*)]/; ring/divide-default → [var(--ui-border)];
  // bg-elevated/50 → color-mix (TW 3.4.19 não gera CSS para /N sobre var()).
  angular.module('gravityElements.element').constant('geCardTheme', {
    slots: {
      root: 'rounded-lg overflow-hidden',
      header: 'p-4 sm:px-6',
      title: 'text-[var(--ui-text-highlighted)] font-semibold',
      description: 'mt-1 text-[var(--ui-text-muted)] text-sm',
      body: 'p-4 sm:p-6',
      footer: 'p-4 sm:px-6',
    },
    variants: {
      variant: {
        solid: {
          root: 'bg-[var(--ui-bg-inverted)] text-[var(--ui-text-inverted)]',
          title: 'text-[var(--ui-text-inverted)]',
          description: 'text-[var(--ui-text-dimmed)]',
        },
        outline: {
          root: 'bg-[var(--ui-bg)] ring ring-[var(--ui-border)] divide-y divide-[var(--ui-border)]',
        },
        soft: {
          root: 'bg-[color-mix(in_srgb,var(--ui-bg-elevated)_50%,transparent)] divide-y divide-[var(--ui-border)]',
        },
        subtle: {
          root: 'bg-[color-mix(in_srgb,var(--ui-bg-elevated)_50%,transparent)] ring ring-[var(--ui-border)] divide-y divide-[var(--ui-border)]',
        },
      },
    },
    defaultVariants: {
      variant: 'outline',
    },
  });
})();
