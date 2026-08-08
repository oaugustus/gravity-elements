(function () {
  'use strict';

  // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
  // Upstream: theme/avatar.ts — slots root/image/fallback/icon + variants
  // color/size. Tailwind v3: bg-${color}/10 → color-mix (TW 3.4.19 não
  // compila opacidade /N sobre var()); text-${color} → [var(--ui-*)];
  // bg-elevated / text-muted → tokens em gravity-elements.css.
  angular.module('gravityElements.element').constant('geAvatarTheme', {
    slots: {
      root: 'inline-flex items-center justify-center shrink-0 select-none rounded-full align-middle',
      image: 'h-full w-full rounded-[inherit] object-cover',
      fallback: 'font-medium truncate',
      icon: 'shrink-0',
    },
    variants: {
      color: {
        primary: {
          root: 'bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)]',
          fallback: 'text-[var(--ui-primary)]',
          icon: 'text-[var(--ui-primary)]',
        },
        secondary: {
          root: 'bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)]',
          fallback: 'text-[var(--ui-secondary)]',
          icon: 'text-[var(--ui-secondary)]',
        },
        success: {
          root: 'bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)]',
          fallback: 'text-[var(--ui-success)]',
          icon: 'text-[var(--ui-success)]',
        },
        info: {
          root: 'bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)]',
          fallback: 'text-[var(--ui-info)]',
          icon: 'text-[var(--ui-info)]',
        },
        warning: {
          root: 'bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)]',
          fallback: 'text-[var(--ui-warning)]',
          icon: 'text-[var(--ui-warning)]',
        },
        error: {
          root: 'bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)]',
          fallback: 'text-[var(--ui-error)]',
          icon: 'text-[var(--ui-error)]',
        },
        neutral: {
          root: 'bg-[var(--ui-bg-elevated)]',
          fallback: 'text-[var(--ui-text-muted)]',
          icon: 'text-[var(--ui-text-muted)]',
        },
      },
      size: {
        '3xs': {
          root: 'size-4 text-[8px]',
        },
        '2xs': {
          root: 'size-5 text-[10px]',
        },
        xs: {
          root: 'size-6 text-xs',
        },
        sm: {
          root: 'size-7 text-sm',
        },
        md: {
          root: 'size-8 text-base',
        },
        lg: {
          root: 'size-9 text-lg',
        },
        xl: {
          root: 'size-10 text-xl',
        },
        '2xl': {
          root: 'size-11 text-[22px]',
        },
        '3xl': {
          root: 'size-12 text-2xl',
        },
      },
    },
    defaultVariants: {
      size: 'md',
      color: 'neutral',
    },
  });
})();
