(function () {
  'use strict';

  // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
  // Upstream: theme/separator.ts — slots root/border/container/label (+ icon/
  // avatar/avatarSize mantidos no tema p/ safelist; sem wiring nesta etapa —
  // bindings icon/avatar/position fora do §7). Tailwind v3: text-default →
  // text-[var(--ui-text)]; border-${color} → border-[var(--ui-*)];
  // border-default (neutral) → border-[var(--ui-border)]. §5.7 N/A (cores
  // sólidas em border-, sem /N sobre var(), sem ring/outline, sem not-*).
  // type inclui dotted (paridade upstream; §7 lista só solid|dashed).
  angular.module('gravityElements.element').constant('geSeparatorTheme', {
    slots: {
      root: 'flex items-center align-center text-center',
      border: '',
      container: 'font-medium text-[var(--ui-text)] flex',
      icon: 'shrink-0 size-5',
      avatar: 'shrink-0',
      avatarSize: '2xs',
      label: 'text-sm',
    },
    variants: {
      color: {
        primary: {
          border: 'border-[var(--ui-primary)]',
        },
        secondary: {
          border: 'border-[var(--ui-secondary)]',
        },
        success: {
          border: 'border-[var(--ui-success)]',
        },
        info: {
          border: 'border-[var(--ui-info)]',
        },
        warning: {
          border: 'border-[var(--ui-warning)]',
        },
        error: {
          border: 'border-[var(--ui-error)]',
        },
        neutral: {
          border: 'border-[var(--ui-border)]',
        },
      },
      orientation: {
        horizontal: {
          root: 'w-full flex-row',
          border: 'w-full',
          container: 'whitespace-nowrap',
        },
        vertical: {
          root: 'h-full flex-col',
          border: 'h-full',
          container: '',
        },
      },
      size: {
        xs: '',
        sm: '',
        md: '',
        lg: '',
        xl: '',
      },
      position: {
        start: '',
        center: '',
        end: '',
      },
      type: {
        solid: {
          border: 'border-solid',
        },
        dashed: {
          border: 'border-dashed',
        },
        dotted: {
          border: 'border-dotted',
        },
      },
    },
    compoundVariants: [
      {
        orientation: 'horizontal',
        position: 'start',
        class: { container: 'me-3' },
      },
      {
        orientation: 'horizontal',
        position: 'center',
        class: { container: 'mx-3' },
      },
      {
        orientation: 'horizontal',
        position: 'end',
        class: { container: 'ms-3' },
      },
      {
        orientation: 'vertical',
        position: 'start',
        class: { container: 'mb-2' },
      },
      {
        orientation: 'vertical',
        position: 'center',
        class: { container: 'my-2' },
      },
      {
        orientation: 'vertical',
        position: 'end',
        class: { container: 'mt-2' },
      },
      {
        orientation: 'horizontal',
        size: 'xs',
        class: { border: 'border-t' },
      },
      {
        orientation: 'horizontal',
        size: 'sm',
        class: { border: 'border-t-[2px]' },
      },
      {
        orientation: 'horizontal',
        size: 'md',
        class: { border: 'border-t-[3px]' },
      },
      {
        orientation: 'horizontal',
        size: 'lg',
        class: { border: 'border-t-[4px]' },
      },
      {
        orientation: 'horizontal',
        size: 'xl',
        class: { border: 'border-t-[5px]' },
      },
      {
        orientation: 'vertical',
        size: 'xs',
        class: { border: 'border-s' },
      },
      {
        orientation: 'vertical',
        size: 'sm',
        class: { border: 'border-s-[2px]' },
      },
      {
        orientation: 'vertical',
        size: 'md',
        class: { border: 'border-s-[3px]' },
      },
      {
        orientation: 'vertical',
        size: 'lg',
        class: { border: 'border-s-[4px]' },
      },
      {
        orientation: 'vertical',
        size: 'xl',
        class: { border: 'border-s-[5px]' },
      },
    ],
    defaultVariants: {
      color: 'neutral',
      size: 'xs',
      type: 'solid',
    },
  });
})();
