(function () {
  'use strict';

  // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
  // Upstream: theme/alert.ts — slots + color/variant/orientation/title +
  // compoundVariants (6 cores × 4 variants + 4 neutral). Slots avatar/avatarSize/
  // actions no tema para safelist/API futura; avatar/actions não renderizados
  // nesta tarefa (dependem de geAvatar/geButton — §5.4.2 / plano Alert).
  // Tailwind v3: bg-/text-/ring-${color} → [var(--ui-*)]; text-inverted /
  // bg-inverted / bg-default / bg-elevated / text-highlighted / ring-default /
  // ring-accented → tokens em gravity-elements.css. Opacidades /N sobre var()
  // NÃO compilam no TW 3.4.19 → color-mix (precedente Header bg-default/75).
  angular.module('gravityElements.element').constant('geAlertTheme', {
    slots: {
      root: 'relative overflow-hidden w-full rounded-lg p-4 flex gap-2.5',
      wrapper: 'min-w-0 flex-1 flex flex-col',
      title: 'text-sm font-medium',
      description: 'text-sm opacity-90',
      icon: 'shrink-0 size-5',
      avatar: 'shrink-0',
      avatarSize: '2xl',
      actions: 'flex flex-wrap gap-1.5 shrink-0',
      close: 'p-0',
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
      orientation: {
        horizontal: {
          root: 'items-center',
          actions: 'items-center',
        },
        vertical: {
          root: 'items-start',
          actions: 'items-start mt-2.5',
        },
      },
      title: {
        true: {
          description: 'mt-1',
        },
      },
    },
    compoundVariants: [
      {
        color: 'primary',
        variant: 'solid',
        class: {
          root: 'bg-[var(--ui-primary)] text-[var(--ui-text-inverted)]',
        },
      },
      {
        color: 'secondary',
        variant: 'solid',
        class: {
          root: 'bg-[var(--ui-secondary)] text-[var(--ui-text-inverted)]',
        },
      },
      {
        color: 'success',
        variant: 'solid',
        class: {
          root: 'bg-[var(--ui-success)] text-[var(--ui-text-inverted)]',
        },
      },
      {
        color: 'info',
        variant: 'solid',
        class: {
          root: 'bg-[var(--ui-info)] text-[var(--ui-text-inverted)]',
        },
      },
      {
        color: 'warning',
        variant: 'solid',
        class: {
          root: 'bg-[var(--ui-warning)] text-[var(--ui-text-inverted)]',
        },
      },
      {
        color: 'error',
        variant: 'solid',
        class: {
          root: 'bg-[var(--ui-error)] text-[var(--ui-text-inverted)]',
        },
      },
      {
        color: 'primary',
        variant: 'outline',
        class: {
          root: 'text-[var(--ui-primary)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)]',
        },
      },
      {
        color: 'secondary',
        variant: 'outline',
        class: {
          root: 'text-[var(--ui-secondary)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)]',
        },
      },
      {
        color: 'success',
        variant: 'outline',
        class: {
          root: 'text-[var(--ui-success)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-success)_25%,transparent)]',
        },
      },
      {
        color: 'info',
        variant: 'outline',
        class: {
          root: 'text-[var(--ui-info)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-info)_25%,transparent)]',
        },
      },
      {
        color: 'warning',
        variant: 'outline',
        class: {
          root: 'text-[var(--ui-warning)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)]',
        },
      },
      {
        color: 'error',
        variant: 'outline',
        class: {
          root: 'text-[var(--ui-error)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-error)_25%,transparent)]',
        },
      },
      {
        color: 'primary',
        variant: 'soft',
        class: {
          root: 'bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] text-[var(--ui-primary)]',
        },
      },
      {
        color: 'secondary',
        variant: 'soft',
        class: {
          root: 'bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] text-[var(--ui-secondary)]',
        },
      },
      {
        color: 'success',
        variant: 'soft',
        class: {
          root: 'bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] text-[var(--ui-success)]',
        },
      },
      {
        color: 'info',
        variant: 'soft',
        class: {
          root: 'bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] text-[var(--ui-info)]',
        },
      },
      {
        color: 'warning',
        variant: 'soft',
        class: {
          root: 'bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] text-[var(--ui-warning)]',
        },
      },
      {
        color: 'error',
        variant: 'soft',
        class: {
          root: 'bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] text-[var(--ui-error)]',
        },
      },
      {
        color: 'primary',
        variant: 'subtle',
        class: {
          root: 'bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] text-[var(--ui-primary)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)]',
        },
      },
      {
        color: 'secondary',
        variant: 'subtle',
        class: {
          root: 'bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] text-[var(--ui-secondary)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)]',
        },
      },
      {
        color: 'success',
        variant: 'subtle',
        class: {
          root: 'bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] text-[var(--ui-success)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-success)_25%,transparent)]',
        },
      },
      {
        color: 'info',
        variant: 'subtle',
        class: {
          root: 'bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] text-[var(--ui-info)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-info)_25%,transparent)]',
        },
      },
      {
        color: 'warning',
        variant: 'subtle',
        class: {
          root: 'bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] text-[var(--ui-warning)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)]',
        },
      },
      {
        color: 'error',
        variant: 'subtle',
        class: {
          root: 'bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] text-[var(--ui-error)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-error)_25%,transparent)]',
        },
      },
      {
        color: 'neutral',
        variant: 'solid',
        class: {
          root: 'text-[var(--ui-text-inverted)] bg-[var(--ui-bg-inverted)]',
        },
      },
      {
        color: 'neutral',
        variant: 'outline',
        class: {
          root: 'text-[var(--ui-text-highlighted)] bg-[var(--ui-bg)] ring ring-inset ring-[var(--ui-border)]',
        },
      },
      {
        color: 'neutral',
        variant: 'soft',
        class: {
          root: 'text-[var(--ui-text-highlighted)] bg-[color-mix(in_srgb,var(--ui-bg-elevated)_50%,transparent)]',
        },
      },
      {
        color: 'neutral',
        variant: 'subtle',
        class: {
          root: 'text-[var(--ui-text-highlighted)] bg-[color-mix(in_srgb,var(--ui-bg-elevated)_50%,transparent)] ring ring-inset ring-[var(--ui-border-accented)]',
        },
      },
    ],
    defaultVariants: {
      color: 'primary',
      variant: 'solid',
    },
  });
})();
