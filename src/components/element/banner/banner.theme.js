(function () {
  'use strict';

  // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
  // Upstream: theme/banner.ts — slots root/container/left/center/right/icon/
  // title/actions/close + variants color/to + compounds hover quando to.
  // Tailwind v3: bg-${color}/bg-inverted/text-inverted → [var(--ui-*)];
  // opacidades /90 e /10 sobre var() NÃO compilam no TW 3.4.19 → color-mix
  // (precedente Alert/Header); outline-(--ui-bg)/25 → color-mix.
  // Escala outline TW3 só 0/1/2/4/8 — outline-3/-outline-offset-3 (TW4) →
  // outline-[3px]/-outline-offset-[3px].
  angular.module('gravityElements.element').constant('geBannerTheme', {
    slots: {
      root: 'relative z-50 w-full transition-colors',
      container: 'flex items-center justify-between gap-3 h-12',
      left: 'hidden lg:flex-1 lg:flex lg:items-center',
      center: 'flex items-center gap-1.5 min-w-0',
      right: 'lg:flex-1 flex items-center justify-end',
      icon: 'size-5 shrink-0 text-[var(--ui-text-inverted)] pointer-events-none',
      title: 'text-sm text-[var(--ui-text-inverted)] font-medium truncate',
      actions: 'flex gap-1.5 shrink-0 isolate',
      close:
        'text-[var(--ui-text-inverted)] hover:bg-[color-mix(in_srgb,var(--ui-bg)_10%,transparent)] focus-visible:bg-[color-mix(in_srgb,var(--ui-bg)_10%,transparent)] -me-1.5 lg:me-0',
    },
    variants: {
      color: {
        primary: {
          root: 'bg-[var(--ui-primary)]',
        },
        secondary: {
          root: 'bg-[var(--ui-secondary)]',
        },
        success: {
          root: 'bg-[var(--ui-success)]',
        },
        info: {
          root: 'bg-[var(--ui-info)]',
        },
        warning: {
          root: 'bg-[var(--ui-warning)]',
        },
        error: {
          root: 'bg-[var(--ui-error)]',
        },
        neutral: {
          root: 'bg-[var(--ui-bg-inverted)]',
        },
      },
      to: {
        true: {
          root:
            'outline-[color-mix(in_srgb,var(--ui-bg)_25%,transparent)] -outline-offset-[3px] has-[>a:focus-visible]:outline-[3px]',
        },
      },
    },
    compoundVariants: [
      {
        color: 'primary',
        to: true,
        class: {
          root: 'hover:bg-[color-mix(in_srgb,var(--ui-primary)_90%,transparent)]',
        },
      },
      {
        color: 'secondary',
        to: true,
        class: {
          root: 'hover:bg-[color-mix(in_srgb,var(--ui-secondary)_90%,transparent)]',
        },
      },
      {
        color: 'success',
        to: true,
        class: {
          root: 'hover:bg-[color-mix(in_srgb,var(--ui-success)_90%,transparent)]',
        },
      },
      {
        color: 'info',
        to: true,
        class: {
          root: 'hover:bg-[color-mix(in_srgb,var(--ui-info)_90%,transparent)]',
        },
      },
      {
        color: 'warning',
        to: true,
        class: {
          root: 'hover:bg-[color-mix(in_srgb,var(--ui-warning)_90%,transparent)]',
        },
      },
      {
        color: 'error',
        to: true,
        class: {
          root: 'hover:bg-[color-mix(in_srgb,var(--ui-error)_90%,transparent)]',
        },
      },
      {
        color: 'neutral',
        to: true,
        class: {
          root: 'hover:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_90%,transparent)]',
        },
      },
    ],
    defaultVariants: {
      color: 'primary',
    },
  });
})();
