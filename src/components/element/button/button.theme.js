(function () {
  'use strict';

  // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
  // Upstream: theme/button.ts — slots base/label/leadingIcon/leadingAvatar/
  // leadingAvatarSize/trailingIcon + color/variant/size/block/square/leading/
  // trailing/loading/active + fieldGroup (field-group.ts) + compoundVariants
  // (6 cores × 6 + 6 neutral + 5 square + 2 loading).
  // leadingAvatar* no tema para safelist/API futura; avatar não renderizado
  // nesta tarefa (prop objeto upstream — §5.4.2).
  // fieldGroup: TW v4 not-* não existe no 3.4.19 (§5.7). Reescrito como
  // seletor arbitrário no host Angular ge-button (o <button> interno é
  // always :only-child do host — [&:not(:only-child):first-child] inerte).
  // Tailwind v3: bg-/text-/ring-/outline-${color} → [var(--ui-*)]; tokens
  // inverted/default/elevated/accented/muted. Opacidades /N sobre var() NÃO
  // compilam no TW 3.4.19 → color-mix. focus-visible:outline-3 →
  // focus-visible:outline-[3px] (precedente Banner).
  angular.module('gravityElements.element').constant('geButtonTheme', {
    slots: {
      base:
        'rounded-md font-medium inline-flex items-center disabled:cursor-not-allowed aria-disabled:cursor-not-allowed disabled:opacity-75 aria-disabled:opacity-75 transition-colors',
      label: 'truncate',
      leadingIcon: 'shrink-0',
      leadingAvatar: 'shrink-0',
      leadingAvatarSize: '',
      trailingIcon: 'shrink-0',
    },
    variants: {
      fieldGroup: {
        horizontal:
          '[ge-button:not(:only-child):first-child_&]:rounded-e-none [ge-button:not(:only-child):last-child_&]:rounded-s-none [ge-button:not(:last-child):not(:first-child)_&]:rounded-none focus-visible:z-[1]',
        vertical:
          '[ge-button:not(:only-child):first-child_&]:rounded-b-none [ge-button:not(:only-child):last-child_&]:rounded-t-none [ge-button:not(:last-child):not(:first-child)_&]:rounded-none focus-visible:z-[1]',
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
        ghost: '',
        link: '',
      },
      size: {
        xs: {
          base: 'px-2 py-1 text-xs gap-1',
          leadingIcon: 'size-4',
          leadingAvatarSize: '3xs',
          trailingIcon: 'size-4',
        },
        sm: {
          base: 'px-2.5 py-1.5 text-xs gap-1.5',
          leadingIcon: 'size-4',
          leadingAvatarSize: '3xs',
          trailingIcon: 'size-4',
        },
        md: {
          base: 'px-2.5 py-1.5 text-sm gap-1.5',
          leadingIcon: 'size-5',
          leadingAvatarSize: '2xs',
          trailingIcon: 'size-5',
        },
        lg: {
          base: 'px-3 py-2 text-sm gap-2',
          leadingIcon: 'size-5',
          leadingAvatarSize: '2xs',
          trailingIcon: 'size-5',
        },
        xl: {
          base: 'px-3 py-2 text-base gap-2',
          leadingIcon: 'size-6',
          leadingAvatarSize: 'xs',
          trailingIcon: 'size-6',
        },
      },
      block: {
        true: {
          base: 'w-full justify-center',
          trailingIcon: 'ms-auto',
        },
      },
      square: {
        true: '',
      },
      leading: {
        true: '',
      },
      trailing: {
        true: '',
      },
      loading: {
        true: '',
      },
      active: {
        true: {
          base: '',
        },
        false: {
          base: '',
        },
      },
    },
    compoundVariants: [
      {
        color: 'primary',
        variant: 'solid',
        class:
          'text-[var(--ui-text-inverted)] bg-[var(--ui-primary)] hover:bg-[color-mix(in_srgb,var(--ui-primary)_75%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-primary)_75%,transparent)] disabled:bg-[var(--ui-primary)] aria-disabled:bg-[var(--ui-primary)] outline-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)] focus-visible:outline-[3px]',
      },
      {
        color: 'secondary',
        variant: 'solid',
        class:
          'text-[var(--ui-text-inverted)] bg-[var(--ui-secondary)] hover:bg-[color-mix(in_srgb,var(--ui-secondary)_75%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-secondary)_75%,transparent)] disabled:bg-[var(--ui-secondary)] aria-disabled:bg-[var(--ui-secondary)] outline-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)] focus-visible:outline-[3px]',
      },
      {
        color: 'success',
        variant: 'solid',
        class:
          'text-[var(--ui-text-inverted)] bg-[var(--ui-success)] hover:bg-[color-mix(in_srgb,var(--ui-success)_75%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-success)_75%,transparent)] disabled:bg-[var(--ui-success)] aria-disabled:bg-[var(--ui-success)] outline-[color-mix(in_srgb,var(--ui-success)_25%,transparent)] focus-visible:outline-[3px]',
      },
      {
        color: 'info',
        variant: 'solid',
        class:
          'text-[var(--ui-text-inverted)] bg-[var(--ui-info)] hover:bg-[color-mix(in_srgb,var(--ui-info)_75%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-info)_75%,transparent)] disabled:bg-[var(--ui-info)] aria-disabled:bg-[var(--ui-info)] outline-[color-mix(in_srgb,var(--ui-info)_25%,transparent)] focus-visible:outline-[3px]',
      },
      {
        color: 'warning',
        variant: 'solid',
        class:
          'text-[var(--ui-text-inverted)] bg-[var(--ui-warning)] hover:bg-[color-mix(in_srgb,var(--ui-warning)_75%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-warning)_75%,transparent)] disabled:bg-[var(--ui-warning)] aria-disabled:bg-[var(--ui-warning)] outline-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)] focus-visible:outline-[3px]',
      },
      {
        color: 'error',
        variant: 'solid',
        class:
          'text-[var(--ui-text-inverted)] bg-[var(--ui-error)] hover:bg-[color-mix(in_srgb,var(--ui-error)_75%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-error)_75%,transparent)] disabled:bg-[var(--ui-error)] aria-disabled:bg-[var(--ui-error)] outline-[color-mix(in_srgb,var(--ui-error)_25%,transparent)] focus-visible:outline-[3px]',
      },
      {
        color: 'primary',
        variant: 'outline',
        class:
          'ring ring-inset ring-[color-mix(in_srgb,var(--ui-primary)_50%,transparent)] text-[var(--ui-primary)] hover:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent outline-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-primary)]',
      },
      {
        color: 'secondary',
        variant: 'outline',
        class:
          'ring ring-inset ring-[color-mix(in_srgb,var(--ui-secondary)_50%,transparent)] text-[var(--ui-secondary)] hover:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent outline-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-secondary)]',
      },
      {
        color: 'success',
        variant: 'outline',
        class:
          'ring ring-inset ring-[color-mix(in_srgb,var(--ui-success)_50%,transparent)] text-[var(--ui-success)] hover:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent outline-[color-mix(in_srgb,var(--ui-success)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-success)]',
      },
      {
        color: 'info',
        variant: 'outline',
        class:
          'ring ring-inset ring-[color-mix(in_srgb,var(--ui-info)_50%,transparent)] text-[var(--ui-info)] hover:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent outline-[color-mix(in_srgb,var(--ui-info)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-info)]',
      },
      {
        color: 'warning',
        variant: 'outline',
        class:
          'ring ring-inset ring-[color-mix(in_srgb,var(--ui-warning)_50%,transparent)] text-[var(--ui-warning)] hover:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent outline-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-warning)]',
      },
      {
        color: 'error',
        variant: 'outline',
        class:
          'ring ring-inset ring-[color-mix(in_srgb,var(--ui-error)_50%,transparent)] text-[var(--ui-error)] hover:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent outline-[color-mix(in_srgb,var(--ui-error)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-error)]',
      },
      {
        color: 'primary',
        variant: 'soft',
        class:
          'text-[var(--ui-primary)] bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-primary)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-primary)_15%,transparent)] outline-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)]',
      },
      {
        color: 'secondary',
        variant: 'soft',
        class:
          'text-[var(--ui-secondary)] bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-secondary)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-secondary)_15%,transparent)] outline-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)]',
      },
      {
        color: 'success',
        variant: 'soft',
        class:
          'text-[var(--ui-success)] bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-success)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-success)_15%,transparent)] outline-[color-mix(in_srgb,var(--ui-success)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)]',
      },
      {
        color: 'info',
        variant: 'soft',
        class:
          'text-[var(--ui-info)] bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-info)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-info)_15%,transparent)] outline-[color-mix(in_srgb,var(--ui-info)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)]',
      },
      {
        color: 'warning',
        variant: 'soft',
        class:
          'text-[var(--ui-warning)] bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-warning)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-warning)_15%,transparent)] outline-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)]',
      },
      {
        color: 'error',
        variant: 'soft',
        class:
          'text-[var(--ui-error)] bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-error)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-error)_15%,transparent)] outline-[color-mix(in_srgb,var(--ui-error)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)]',
      },
      {
        color: 'primary',
        variant: 'subtle',
        class:
          'text-[var(--ui-primary)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)] bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-primary)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-primary)_15%,transparent)] disabled:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-primary)]',
      },
      {
        color: 'secondary',
        variant: 'subtle',
        class:
          'text-[var(--ui-secondary)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)] bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-secondary)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-secondary)_15%,transparent)] disabled:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-secondary)]',
      },
      {
        color: 'success',
        variant: 'subtle',
        class:
          'text-[var(--ui-success)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-success)_25%,transparent)] bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-success)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-success)_15%,transparent)] disabled:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-success)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-success)]',
      },
      {
        color: 'info',
        variant: 'subtle',
        class:
          'text-[var(--ui-info)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-info)_25%,transparent)] bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-info)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-info)_15%,transparent)] disabled:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-info)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-info)]',
      },
      {
        color: 'warning',
        variant: 'subtle',
        class:
          'text-[var(--ui-warning)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)] bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-warning)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-warning)_15%,transparent)] disabled:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-warning)]',
      },
      {
        color: 'error',
        variant: 'subtle',
        class:
          'text-[var(--ui-error)] ring ring-inset ring-[color-mix(in_srgb,var(--ui-error)_25%,transparent)] bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] hover:bg-[color-mix(in_srgb,var(--ui-error)_15%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-error)_15%,transparent)] disabled:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] aria-disabled:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-error)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-error)]',
      },
      {
        color: 'primary',
        variant: 'ghost',
        class:
          'text-[var(--ui-primary)] hover:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent',
      },
      {
        color: 'secondary',
        variant: 'ghost',
        class:
          'text-[var(--ui-secondary)] hover:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent',
      },
      {
        color: 'success',
        variant: 'ghost',
        class:
          'text-[var(--ui-success)] hover:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-success)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent',
      },
      {
        color: 'info',
        variant: 'ghost',
        class:
          'text-[var(--ui-info)] hover:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-info)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent',
      },
      {
        color: 'warning',
        variant: 'ghost',
        class:
          'text-[var(--ui-warning)] hover:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent',
      },
      {
        color: 'error',
        variant: 'ghost',
        class:
          'text-[var(--ui-error)] hover:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] outline-[color-mix(in_srgb,var(--ui-error)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-transparent aria-disabled:bg-transparent dark:disabled:bg-transparent dark:aria-disabled:bg-transparent',
      },
      {
        color: 'primary',
        variant: 'link',
        class:
          'text-[var(--ui-primary)] hover:text-[color-mix(in_srgb,var(--ui-primary)_75%,transparent)] active:text-[color-mix(in_srgb,var(--ui-primary)_75%,transparent)] disabled:text-[var(--ui-primary)] aria-disabled:text-[var(--ui-primary)] outline-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)] focus-visible:outline-[3px]',
      },
      {
        color: 'secondary',
        variant: 'link',
        class:
          'text-[var(--ui-secondary)] hover:text-[color-mix(in_srgb,var(--ui-secondary)_75%,transparent)] active:text-[color-mix(in_srgb,var(--ui-secondary)_75%,transparent)] disabled:text-[var(--ui-secondary)] aria-disabled:text-[var(--ui-secondary)] outline-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)] focus-visible:outline-[3px]',
      },
      {
        color: 'success',
        variant: 'link',
        class:
          'text-[var(--ui-success)] hover:text-[color-mix(in_srgb,var(--ui-success)_75%,transparent)] active:text-[color-mix(in_srgb,var(--ui-success)_75%,transparent)] disabled:text-[var(--ui-success)] aria-disabled:text-[var(--ui-success)] outline-[color-mix(in_srgb,var(--ui-success)_25%,transparent)] focus-visible:outline-[3px]',
      },
      {
        color: 'info',
        variant: 'link',
        class:
          'text-[var(--ui-info)] hover:text-[color-mix(in_srgb,var(--ui-info)_75%,transparent)] active:text-[color-mix(in_srgb,var(--ui-info)_75%,transparent)] disabled:text-[var(--ui-info)] aria-disabled:text-[var(--ui-info)] outline-[color-mix(in_srgb,var(--ui-info)_25%,transparent)] focus-visible:outline-[3px]',
      },
      {
        color: 'warning',
        variant: 'link',
        class:
          'text-[var(--ui-warning)] hover:text-[color-mix(in_srgb,var(--ui-warning)_75%,transparent)] active:text-[color-mix(in_srgb,var(--ui-warning)_75%,transparent)] disabled:text-[var(--ui-warning)] aria-disabled:text-[var(--ui-warning)] outline-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)] focus-visible:outline-[3px]',
      },
      {
        color: 'error',
        variant: 'link',
        class:
          'text-[var(--ui-error)] hover:text-[color-mix(in_srgb,var(--ui-error)_75%,transparent)] active:text-[color-mix(in_srgb,var(--ui-error)_75%,transparent)] disabled:text-[var(--ui-error)] aria-disabled:text-[var(--ui-error)] outline-[color-mix(in_srgb,var(--ui-error)_25%,transparent)] focus-visible:outline-[3px]',
      },
      {
        color: 'neutral',
        variant: 'solid',
        class:
          'text-[var(--ui-text-inverted)] bg-[var(--ui-bg-inverted)] hover:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_90%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-bg-inverted)_90%,transparent)] disabled:bg-[var(--ui-bg-inverted)] aria-disabled:bg-[var(--ui-bg-inverted)] outline-[color-mix(in_srgb,var(--ui-bg-inverted)_25%,transparent)] focus-visible:outline-[3px]',
      },
      {
        color: 'neutral',
        variant: 'outline',
        class:
          'ring ring-inset ring-[var(--ui-border-accented)] text-[var(--ui-text)] bg-[var(--ui-bg)] hover:bg-[var(--ui-bg-elevated)] active:bg-[var(--ui-bg-elevated)] disabled:bg-[var(--ui-bg)] aria-disabled:bg-[var(--ui-bg)] outline-[color-mix(in_srgb,var(--ui-bg-inverted)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-bg-inverted)]',
      },
      {
        color: 'neutral',
        variant: 'soft',
        class:
          'text-[var(--ui-text)] bg-[var(--ui-bg-elevated)] hover:bg-[color-mix(in_srgb,var(--ui-bg-accented)_75%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-bg-accented)_75%,transparent)] outline-[color-mix(in_srgb,var(--ui-bg-inverted)_25%,transparent)] focus-visible:outline-[3px] disabled:bg-[var(--ui-bg-elevated)] aria-disabled:bg-[var(--ui-bg-elevated)]',
      },
      {
        color: 'neutral',
        variant: 'subtle',
        class:
          'ring ring-inset ring-[var(--ui-border-accented)] text-[var(--ui-text)] bg-[var(--ui-bg-elevated)] hover:bg-[color-mix(in_srgb,var(--ui-bg-accented)_75%,transparent)] active:bg-[color-mix(in_srgb,var(--ui-bg-accented)_75%,transparent)] disabled:bg-[var(--ui-bg-elevated)] aria-disabled:bg-[var(--ui-bg-elevated)] outline-[color-mix(in_srgb,var(--ui-bg-inverted)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-bg-inverted)]',
      },
      {
        color: 'neutral',
        variant: 'ghost',
        class:
          'text-[var(--ui-text)] hover:bg-[var(--ui-bg-elevated)] active:bg-[var(--ui-bg-elevated)] outline-[color-mix(in_srgb,var(--ui-bg-inverted)_25%,transparent)] focus-visible:outline-[3px] hover:disabled:bg-transparent dark:hover:disabled:bg-transparent hover:aria-disabled:bg-transparent dark:hover:aria-disabled:bg-transparent',
      },
      {
        color: 'neutral',
        variant: 'link',
        class:
          'text-[var(--ui-text-muted)] hover:text-[var(--ui-text)] active:text-[var(--ui-text)] disabled:text-[var(--ui-text-muted)] aria-disabled:text-[var(--ui-text-muted)] outline-[color-mix(in_srgb,var(--ui-bg-inverted)_25%,transparent)] focus-visible:outline-[3px]',
      },
      {
        size: 'xs',
        square: true,
        class: 'p-1',
      },
      {
        size: 'sm',
        square: true,
        class: 'p-1.5',
      },
      {
        size: 'md',
        square: true,
        class: 'p-1.5',
      },
      {
        size: 'lg',
        square: true,
        class: 'p-2',
      },
      {
        size: 'xl',
        square: true,
        class: 'p-2',
      },
      {
        loading: true,
        leading: true,
        class: {
          leadingIcon: 'animate-spin',
        },
      },
      {
        loading: true,
        leading: false,
        trailing: true,
        class: {
          trailingIcon: 'animate-spin',
        },
      },
    ],
    defaultVariants: {
      color: 'primary',
      variant: 'solid',
      size: 'md',
    },
  });
})();
