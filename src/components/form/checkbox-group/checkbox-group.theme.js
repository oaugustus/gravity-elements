(function () {
  'use strict';

  // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
  // Upstream: theme/checkbox-group.ts — slots root/fieldset/legend/item +
  // orientation/color/variant(list|card|table)/size/required/disabled +
  // compoundVariants (table padding × size, table × orientation rounded,
  // table × color has-data-[state=checked], table × disabled).
  // Tailwind v3: text-default/text-error/border-muted/bg-elevated → tokens
  // --ui-*; p-4.5 → p-[1.125rem] (escala 3.4.19 não tem 4.5); bg-${color}/10
  // e border-${color}/50 → color-mix (TW 3.4.19 não gera /N sobre var()).
  // has-data-[state=checked] (Reka data-state no filho) → data-[is-checked]
  // no próprio wrapper do item (§5.11 — BOOLEAN_ATTR engole data-checked).
  // fieldset: border-0 p-0 m-0 min-w-0 — reset de UA; o Reka CheckboxGroupRoot
  // é um div, o <fieldset> nativo traz borda/padding que quebraria a paridade.
  // root + block: o host <ge-checkbox-group> é inline; o inner precisa ser
  // bloco pra fieldset flex-col ocupar a largura (§5.14).
  angular.module('gravityElements.form').constant('geCheckboxGroupTheme', {
    slots: {
      root: 'relative block',
      fieldset: 'flex gap-x-2 border-0 p-0 m-0 min-w-0',
      legend: 'mb-1 block font-medium text-[var(--ui-text)]',
      item: '',
    },
    variants: {
      orientation: {
        horizontal: {
          fieldset: 'flex-row',
        },
        vertical: {
          fieldset: 'flex-col',
        },
      },
      color: {
        primary: {},
        secondary: {},
        success: {},
        info: {},
        warning: {},
        error: {},
        neutral: {},
      },
      variant: {
        list: {},
        card: {},
        table: {
          item: 'border border-[var(--ui-border)]',
        },
      },
      size: {
        xs: {
          fieldset: 'gap-y-0.5',
          legend: 'text-xs',
        },
        sm: {
          fieldset: 'gap-y-0.5',
          legend: 'text-xs',
        },
        md: {
          fieldset: 'gap-y-1',
          legend: 'text-sm',
        },
        lg: {
          fieldset: 'gap-y-1',
          legend: 'text-sm',
        },
        xl: {
          fieldset: 'gap-y-1.5',
          legend: 'text-base',
        },
      },
      required: {
        true: {
          legend: "after:content-['*'] after:ms-0.5 after:text-[var(--ui-error)]",
        },
      },
      disabled: {
        true: {},
      },
    },
    compoundVariants: [
      { size: 'xs', variant: 'table', class: { item: 'p-2.5' } },
      { size: 'sm', variant: 'table', class: { item: 'p-3' } },
      { size: 'md', variant: 'table', class: { item: 'p-3.5' } },
      { size: 'lg', variant: 'table', class: { item: 'p-4' } },
      { size: 'xl', variant: 'table', class: { item: 'p-[1.125rem]' } },
      {
        orientation: 'horizontal',
        variant: 'table',
        class: {
          item: 'first-of-type:rounded-s-lg last-of-type:rounded-e-lg',
          fieldset: 'gap-0 -space-x-px',
        },
      },
      {
        orientation: 'vertical',
        variant: 'table',
        class: {
          item: 'first-of-type:rounded-t-lg last-of-type:rounded-b-lg',
          fieldset: 'gap-0 -space-y-px',
        },
      },
      {
        color: 'primary',
        variant: 'table',
        class: {
          item:
            'data-[is-checked]:bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)] data-[is-checked]:border-[color-mix(in_srgb,var(--ui-primary)_50%,transparent)] data-[is-checked]:z-[1]',
        },
      },
      {
        color: 'secondary',
        variant: 'table',
        class: {
          item:
            'data-[is-checked]:bg-[color-mix(in_srgb,var(--ui-secondary)_10%,transparent)] data-[is-checked]:border-[color-mix(in_srgb,var(--ui-secondary)_50%,transparent)] data-[is-checked]:z-[1]',
        },
      },
      {
        color: 'success',
        variant: 'table',
        class: {
          item:
            'data-[is-checked]:bg-[color-mix(in_srgb,var(--ui-success)_10%,transparent)] data-[is-checked]:border-[color-mix(in_srgb,var(--ui-success)_50%,transparent)] data-[is-checked]:z-[1]',
        },
      },
      {
        color: 'info',
        variant: 'table',
        class: {
          item:
            'data-[is-checked]:bg-[color-mix(in_srgb,var(--ui-info)_10%,transparent)] data-[is-checked]:border-[color-mix(in_srgb,var(--ui-info)_50%,transparent)] data-[is-checked]:z-[1]',
        },
      },
      {
        color: 'warning',
        variant: 'table',
        class: {
          item:
            'data-[is-checked]:bg-[color-mix(in_srgb,var(--ui-warning)_10%,transparent)] data-[is-checked]:border-[color-mix(in_srgb,var(--ui-warning)_50%,transparent)] data-[is-checked]:z-[1]',
        },
      },
      {
        color: 'error',
        variant: 'table',
        class: {
          item:
            'data-[is-checked]:bg-[color-mix(in_srgb,var(--ui-error)_10%,transparent)] data-[is-checked]:border-[color-mix(in_srgb,var(--ui-error)_50%,transparent)] data-[is-checked]:z-[1]',
        },
      },
      {
        color: 'neutral',
        variant: 'table',
        class: {
          item:
            'data-[is-checked]:bg-[var(--ui-bg-elevated)] data-[is-checked]:border-[color-mix(in_srgb,var(--ui-bg-inverted)_50%,transparent)] data-[is-checked]:z-[1]',
        },
      },
      {
        variant: 'table',
        disabled: true,
        class: {
          item: 'cursor-not-allowed',
        },
      },
    ],
    defaultVariants: {
      size: 'md',
      variant: 'list',
      color: 'primary',
    },
  });
})();
