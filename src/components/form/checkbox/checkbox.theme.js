(function () {
  'use strict';

  // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
  // Upstream: theme/checkbox.ts — slots root/container/base/indicator/icon/
  // wrapper/label/description + color/variant/indicator/size/required/disabled/
  // highlight/checked + compoundVariants (card padding × size, card × color
  // has-data-[state=checked], card × disabled, highlight × color).
  // Tailwind v3: ring-accented/text-default/text-muted/text-inverted/
  // border-muted/bg-inverted/outline-inverted/text-error → tokens --ui-*;
  // outline-${color}/25 → color-mix (TW 3.4.19 não gera /N sobre var());
  // focus-visible:outline-3 → focus-visible:outline-[3px] (precedente Banner);
  // has-data-[state=checked] → data-[is-checked] no próprio root (§5.11 —
  // BOOLEAN_ATTR engole data-checked em <input>/<label>).
  // size-4.5 / p-4.5 (TW4) → size-[1.125rem] / p-[1.125rem]: a escala de
  // spacing do 3.4.19 tem 3.5 mas NÃO 4.5 (confirmado: safelist inclui as
  // classes crus e o CSS compilado as descarta em silêncio).
  // appearance-none cursor-pointer no slots.base: adaptação Gravity — o
  // upstream usa Reka CheckboxRoot (button), aqui o visual pousa num
  // <input type="checkbox"> nativo. Indicator absolute inset-0 + pointer-events-
  // none: o input não tem filhos, o ícone é irmão sobreposto.
  // rounded-sm (TW4 = 0.25rem) → `rounded` (TW3 = 0.25rem). O rounded-sm
  // do 3.4.19 é 2px; rounded-[0.25rem] entra na safelist e o CLI descarta.
  // overflow-hidden+radius também no wrapper do overlay — overflow-hidden
  // no <input> não recorta o indicador irmão, e o fill sem radius virava
  // quadrado.
  // Ícone: <i> direto (não <ge-icon>) — o host ge-icon é inline, default
  // size-5, e o CSS do demo (.i-lucide-* { width:1em; display:inline-block })
  // alinha na baseline; overflow-hidden recortava o check no canto inferior
  // direito (xs sumia). icon slot usa !block !size-full para vencer o 1em.
  angular.module('gravityElements.form').constant('geCheckboxTheme', {
    slots: {
      root: 'relative flex items-start',
      container: 'flex items-center',
      base:
        'appearance-none cursor-pointer rounded ring ring-inset ring-[var(--ui-border-accented)] overflow-hidden focus-visible:outline-[3px]',
      indicator:
        'flex items-center justify-center size-full rounded text-[var(--ui-text-inverted)] pointer-events-none absolute inset-0 leading-none',
      icon: '!block !size-full min-w-0 min-h-0',
      wrapper: 'w-full',
      label: 'block font-medium text-[var(--ui-text)]',
      description: 'text-[var(--ui-text-muted)]',
    },
    variants: {
      color: {
        primary: {
          base:
            'outline-[color-mix(in_srgb,var(--ui-primary)_25%,transparent)] focus-visible:ring-[var(--ui-primary)]',
          indicator: 'bg-[var(--ui-primary)]',
        },
        secondary: {
          base:
            'outline-[color-mix(in_srgb,var(--ui-secondary)_25%,transparent)] focus-visible:ring-[var(--ui-secondary)]',
          indicator: 'bg-[var(--ui-secondary)]',
        },
        success: {
          base:
            'outline-[color-mix(in_srgb,var(--ui-success)_25%,transparent)] focus-visible:ring-[var(--ui-success)]',
          indicator: 'bg-[var(--ui-success)]',
        },
        info: {
          base:
            'outline-[color-mix(in_srgb,var(--ui-info)_25%,transparent)] focus-visible:ring-[var(--ui-info)]',
          indicator: 'bg-[var(--ui-info)]',
        },
        warning: {
          base:
            'outline-[color-mix(in_srgb,var(--ui-warning)_25%,transparent)] focus-visible:ring-[var(--ui-warning)]',
          indicator: 'bg-[var(--ui-warning)]',
        },
        error: {
          base:
            'outline-[color-mix(in_srgb,var(--ui-error)_25%,transparent)] focus-visible:ring-[var(--ui-error)]',
          indicator: 'bg-[var(--ui-error)]',
        },
        neutral: {
          base:
            'outline-[color-mix(in_srgb,var(--ui-bg-inverted)_25%,transparent)] focus-visible:ring-[var(--ui-bg-inverted)]',
          indicator: 'bg-[var(--ui-bg-inverted)]',
        },
      },
      variant: {
        list: {
          root: '',
        },
        card: {
          root: 'border border-[var(--ui-border)] rounded-lg',
        },
      },
      indicator: {
        start: {
          root: 'flex-row',
          wrapper: 'ms-2',
        },
        end: {
          root: 'flex-row-reverse',
          wrapper: 'me-2',
        },
        hidden: {
          base: 'sr-only',
          wrapper: 'text-center',
        },
      },
      size: {
        xs: {
          base: 'size-3',
          container: 'h-4',
          wrapper: 'text-xs',
        },
        sm: {
          base: 'size-3.5',
          container: 'h-4',
          wrapper: 'text-xs',
        },
        md: {
          base: 'size-4',
          container: 'h-5',
          wrapper: 'text-sm',
        },
        lg: {
          base: 'size-[1.125rem]',
          container: 'h-5',
          wrapper: 'text-sm',
        },
        xl: {
          base: 'size-5',
          container: 'h-6',
          wrapper: 'text-base',
        },
      },
      required: {
        true: {
          label: "after:content-['*'] after:ms-0.5 after:text-[var(--ui-error)]",
        },
      },
      disabled: {
        true: {
          root: 'opacity-75',
          base: 'cursor-not-allowed',
          label: 'cursor-not-allowed',
          description: 'cursor-not-allowed',
        },
      },
      highlight: {
        true: '',
      },
      checked: {
        true: '',
      },
    },
    compoundVariants: [
      { size: 'xs', variant: 'card', class: { root: 'p-2.5' } },
      { size: 'sm', variant: 'card', class: { root: 'p-3' } },
      { size: 'md', variant: 'card', class: { root: 'p-3.5' } },
      { size: 'lg', variant: 'card', class: { root: 'p-4' } },
      { size: 'xl', variant: 'card', class: { root: 'p-[1.125rem]' } },
      {
        color: 'primary',
        variant: 'card',
        class: {
          root: 'data-[is-checked]:border-[var(--ui-primary)]',
        },
      },
      {
        color: 'secondary',
        variant: 'card',
        class: {
          root: 'data-[is-checked]:border-[var(--ui-secondary)]',
        },
      },
      {
        color: 'success',
        variant: 'card',
        class: {
          root: 'data-[is-checked]:border-[var(--ui-success)]',
        },
      },
      {
        color: 'info',
        variant: 'card',
        class: {
          root: 'data-[is-checked]:border-[var(--ui-info)]',
        },
      },
      {
        color: 'warning',
        variant: 'card',
        class: {
          root: 'data-[is-checked]:border-[var(--ui-warning)]',
        },
      },
      {
        color: 'error',
        variant: 'card',
        class: {
          root: 'data-[is-checked]:border-[var(--ui-error)]',
        },
      },
      {
        color: 'neutral',
        variant: 'card',
        class: {
          root: 'data-[is-checked]:border-[var(--ui-bg-inverted)]',
        },
      },
      {
        variant: 'card',
        disabled: true,
        class: {
          root: 'cursor-not-allowed',
        },
      },
      {
        color: 'primary',
        highlight: true,
        class: {
          base: 'ring-[var(--ui-primary)]',
        },
      },
      {
        color: 'secondary',
        highlight: true,
        class: {
          base: 'ring-[var(--ui-secondary)]',
        },
      },
      {
        color: 'success',
        highlight: true,
        class: {
          base: 'ring-[var(--ui-success)]',
        },
      },
      {
        color: 'info',
        highlight: true,
        class: {
          base: 'ring-[var(--ui-info)]',
        },
      },
      {
        color: 'warning',
        highlight: true,
        class: {
          base: 'ring-[var(--ui-warning)]',
        },
      },
      {
        color: 'error',
        highlight: true,
        class: {
          base: 'ring-[var(--ui-error)]',
        },
      },
      {
        color: 'neutral',
        highlight: true,
        class: {
          base: 'ring-[var(--ui-bg-inverted)]',
        },
      },
    ],
    defaultVariants: {
      size: 'md',
      color: 'primary',
      variant: 'list',
      indicator: 'start',
    },
  });
})();
