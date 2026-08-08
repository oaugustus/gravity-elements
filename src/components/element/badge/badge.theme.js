(function () {
  'use strict';

  // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
  // Upstream: theme/badge.ts — slots base/label/leadingIcon/leadingAvatar/
  // leadingAvatarSize/trailingIcon + color/variant/size/square + fieldGroup
  // (field-group.ts) + compoundVariants (6 cores × 4 + 4 neutral + 5 square).
  // leadingAvatar* no tema para safelist/API futura; avatar não renderizado
  // nesta tarefa (prop objeto upstream — §5.4.2 / plano Badge).
  // fieldGroup: TW v4 not-* não existe no 3.4.19 (§5.7). Reescrito como
  // seletor arbitrário no host Angular ge-badge (o span interno é always
  // :only-child do host — [&:not(:only-child):first-child] seria inerte).
  // Tailwind v3: bg-/text-/ring-${color} → [var(--ui-*)]; tokens inverted/
  // default/elevated/accented. Opacidades /N sobre var() NÃO compilam no
  // TW 3.4.19 → color-mix (precedente Alert/Header).
  angular.module('gravityElements.element').constant('geBadgeTheme', {
    slots: {
      base: 'font-medium inline-flex items-center',
      label: 'truncate',
      leadingIcon: 'shrink-0',
      leadingAvatar: 'shrink-0',
      leadingAvatarSize: '',
      trailingIcon: 'shrink-0',
    },
    variants: {
      fieldGroup: {
        horizontal:
          '[ge-badge:not(:only-child):first-child_&]:rounded-e-none [ge-badge:not(:only-child):last-child_&]:rounded-s-none [ge-badge:not(:last-child):not(:first-child)_&]:rounded-none focus-visible:z-[1]',
        vertical:
          '[ge-badge:not(:only-child):first-child_&]:rounded-b-none [ge-badge:not(:only-child):last-child_&]:rounded-t-none [ge-badge:not(:last-child):not(:first-child)_&]:rounded-none focus-visible:z-[1]',
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
      variant: {
        solid: '',
        outline: '',
        soft: '',
        subtle: '',
      },
      size: {
        xs: {
          base: 'text-[8px]/3 px-1 py-0.5 gap-1 rounded-sm',
          leadingIcon: 'size-3',
          leadingAvatarSize: '3xs',
          trailingIcon: 'size-3',
        },
        sm: {
          base: 'text-[10px]/3 px-1.5 py-1 gap-1 rounded-sm',
          leadingIcon: 'size-3',
          leadingAvatarSize: '3xs',
          trailingIcon: 'size-3',
        },
        md: {
          base: 'text-xs px-2 py-1 gap-1 rounded-md',
          leadingIcon: 'size-4',
          leadingAvatarSize: '3xs',
          trailingIcon: 'size-4',
        },
        lg: {
          base: 'text-sm px-2 py-1 gap-1.5 rounded-md',
          leadingIcon: 'size-5',
          leadingAvatarSize: '2xs',
          trailingIcon: 'size-5',
        },
        xl: {
          base: 'text-base px-2.5 py-1 gap-1.5 rounded-md',
          leadingIcon: 'size-6',
          leadingAvatarSize: '2xs',
          trailingIcon: 'size-6',
        },
      },
      square: {
        true: '',
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
      {
        size: 'xs',
        square: true,
        class: 'p-0.5',
      },
      {
        size: 'sm',
        square: true,
        class: 'p-1',
      },
      {
        size: 'md',
        square: true,
        class: 'p-1',
      },
      {
        size: 'lg',
        square: true,
        class: 'p-1',
      },
      {
        size: 'xl',
        square: true,
        class: 'p-1',
      },
    ],
    defaultVariants: {
      color: 'primary',
      variant: 'solid',
      size: 'md',
    },
  });
})();
