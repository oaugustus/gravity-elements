(function () {
  'use strict';

  // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
  // Upstream: theme/kbd.ts — base + variants color/variant/size + compoundVariants
  // (6 cores × 4 + 4 neutral). Tailwind v3: bg-/text-/ring-${color} →
  // [var(--ui-*)]; opacidades /N sobre var() NÃO compilam no TW 3.4.19 →
  // color-mix (precedente geBadge/geAlert — §5.7).
  angular.module('gravityElements.element').constant('geKbdTheme', {
    slots: {
      base:
        'inline-flex items-center justify-center px-1 rounded-sm font-medium font-sans uppercase',
    },
    variants: {
      color: {
        primary: '',
        secondary: '',
        success: '',
        info: '',
        warning: '',
        error: '',
        neutral: '',
      },
      variant: {
        solid: '',
        outline: '',
        soft: '',
        subtle: '',
      },
      size: {
        sm: 'h-4 min-w-[16px] text-[10px]',
        md: 'h-5 min-w-[20px] text-[11px]',
        lg: 'h-6 min-w-[24px] text-[12px]',
      },
    },
    compoundVariants: [
      {
        color: 'primary',
        variant: 'solid',
        class: 'bg-[var(--ui-primary)] text-[var(--ui-text-inverted)]',
      },
      {
        color: 'secondary',
        variant: 'solid',
        class: 'bg-[var(--ui-secondary)] text-[var(--ui-text-inverted)]',
      },
      {
        color: 'success',
        variant: 'solid',
        class: 'bg-[var(--ui-success)] text-[var(--ui-text-inverted)]',
      },
      {
        color: 'info',
        variant: 'solid',
        class: 'bg-[var(--ui-info)] text-[var(--ui-text-inverted)]',
      },
      {
        color: 'warning',
        variant: 'solid',
        class: 'bg-[var(--ui-warning)] text-[var(--ui-text-inverted)]',
      },
      {
        color: 'error',
        variant: 'solid',
        class: 'bg-[var(--ui-error)] text-[var(--ui-text-inverted)]',
      },
      {
        color: 'primary',
        variant: 'outline',
        class:
          'text-[var(--ui-primary)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-primary)_50%,transparent)]',
      },
      {
        color: 'secondary',
        variant: 'outline',
        class:
          'text-[var(--ui-secondary)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-secondary)_50%,transparent)]',
      },
      {
        color: 'success',
        variant: 'outline',
        class:
          'text-[var(--ui-success)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-success)_50%,transparent)]',
      },
      {
        color: 'info',
        variant: 'outline',
        class:
          'text-[var(--ui-info)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-info)_50%,transparent)]',
      },
      {
        color: 'warning',
        variant: 'outline',
        class:
          'text-[var(--ui-warning)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-warning)_50%,transparent)]',
      },
      {
        color: 'error',
        variant: 'outline',
        class:
          'text-[var(--ui-error)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-error)_50%,transparent)]',
      },
      {
        color: 'primary',
        variant: 'soft',
        class:
          'bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] text-[var(--ui-primary)]',
      },
      {
        color: 'secondary',
        variant: 'soft',
        class:
          'bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] text-[var(--ui-secondary)]',
      },
      {
        color: 'success',
        variant: 'soft',
        class:
          'bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] text-[var(--ui-success)]',
      },
      {
        color: 'info',
        variant: 'soft',
        class:
          'bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] text-[var(--ui-info)]',
      },
      {
        color: 'warning',
        variant: 'soft',
        class:
          'bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] text-[var(--ui-warning)]',
      },
      {
        color: 'error',
        variant: 'soft',
        class:
          'bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] text-[var(--ui-error)]',
      },
      {
        color: 'primary',
        variant: 'subtle',
        class:
          'bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] text-[var(--ui-primary)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)]',
      },
      {
        color: 'secondary',
        variant: 'subtle',
        class:
          'bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] text-[var(--ui-secondary)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)]',
      },
      {
        color: 'success',
        variant: 'subtle',
        class:
          'bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] text-[var(--ui-success)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-success)_25%,transparent)]',
      },
      {
        color: 'info',
        variant: 'subtle',
        class:
          'bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] text-[var(--ui-info)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-info)_25%,transparent)]',
      },
      {
        color: 'warning',
        variant: 'subtle',
        class:
          'bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] text-[var(--ui-warning)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)]',
      },
      {
        color: 'error',
        variant: 'subtle',
        class:
          'bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] text-[var(--ui-error)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-error)_25%,transparent)]',
      },
      {
        color: 'neutral',
        variant: 'solid',
        class: 'text-[var(--ui-text-inverted)] bg-[var(--ui-bg-inverted)]',
      },
      {
        color: 'neutral',
        variant: 'outline',
        class:
          'ring ring-inset ring-[var(--ui-border-accented)] text-[var(--ui-text)] bg-[var(--ui-bg)]',
      },
      {
        color: 'neutral',
        variant: 'soft',
        class: 'text-[var(--ui-text)] bg-[var(--ui-bg-elevated)]',
      },
      {
        color: 'neutral',
        variant: 'subtle',
        class:
          'ring ring-inset ring-[var(--ui-border-accented)] text-[var(--ui-text)] bg-[var(--ui-bg-elevated)]',
      },
    ],
    defaultVariants: {
      variant: 'outline',
      color: 'neutral',
      size: 'md',
    },
  });
})();
