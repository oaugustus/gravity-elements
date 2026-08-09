(function () {
  'use strict';

  // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
  // Upstream: theme/progress.ts — slots root/base/indicator/status (+ steps/step
  // omitidos nesta etapa). Variants color/size; orientation/inverted/animation
  // e compounds de animação fora do escopo (§7 barra simples). Altura da barra
  // via compoundVariants size → slot base (string class no geTv). Tailwind v3:
  // bg-accented → bg-[var(--ui-bg-accented)]; text-dimmed →
  // text-[var(--ui-text-dimmed)]; bg-${color} → [var(--ui-*)]; neutral
  // bg-inverted → bg-[var(--ui-bg-inverted)]. §5.7 N/A (sem /N sobre var(),
  // sem ring/outline fora da escala, sem not-*). Indeterminate: uma animação
  // simples data-[state=indeterminate]:animate-pulse (sem as 4 variantes
  // carousel/swing/elastic do upstream).
  angular.module('gravityElements.element').constant('geProgressTheme', {
    slots: {
      root: 'gap-2 w-full flex flex-col',
      base: 'relative overflow-hidden rounded-full bg-[var(--ui-bg-accented)] w-full',
      indicator:
        'rounded-full size-full transition-transform duration-200 ease-out data-[state=indeterminate]:animate-pulse',
      status:
        'flex text-[var(--ui-text-dimmed)] transition-[width] duration-200 flex-row items-center justify-end min-w-fit',
    },
    variants: {
      color: {
        primary: {
          indicator: 'bg-[var(--ui-primary)]',
        },
        secondary: {
          indicator: 'bg-[var(--ui-secondary)]',
        },
        success: {
          indicator: 'bg-[var(--ui-success)]',
        },
        info: {
          indicator: 'bg-[var(--ui-info)]',
        },
        warning: {
          indicator: 'bg-[var(--ui-warning)]',
        },
        error: {
          indicator: 'bg-[var(--ui-error)]',
        },
        neutral: {
          indicator: 'bg-[var(--ui-bg-inverted)]',
        },
      },
      size: {
        '2xs': {
          status: 'text-xs',
        },
        xs: {
          status: 'text-xs',
        },
        sm: {
          status: 'text-sm',
        },
        md: {
          status: 'text-sm',
        },
        lg: {
          status: 'text-sm',
        },
        xl: {
          status: 'text-base',
        },
        '2xl': {
          status: 'text-base',
        },
      },
    },
    compoundVariants: [
      {
        size: '2xs',
        class: 'h-px',
      },
      {
        size: 'xs',
        class: 'h-0.5',
      },
      {
        size: 'sm',
        class: 'h-1',
      },
      {
        size: 'md',
        class: 'h-2',
      },
      {
        size: 'lg',
        class: 'h-3',
      },
      {
        size: 'xl',
        class: 'h-4',
      },
      {
        size: '2xl',
        class: 'h-5',
      },
    ],
    defaultVariants: {
      color: 'primary',
      size: 'md',
    },
  });
})();
