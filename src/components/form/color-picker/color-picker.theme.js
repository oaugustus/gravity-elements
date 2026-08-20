(function () {
  'use strict';

  // Portado de github.com/nuxt/ui v4.10.0, MIT License, Copyright (c) Nuxt Labs
  // Upstream: theme/color-picker.ts — slots root/picker/selector/
  // selectorBackground/selectorThumb/track/trackThumb + size xs–xl no
  // quadrado HSV inline. Gravity NÃO porta picker/selector/track: o painel
  // é o tema nano do Pickr (DOM da lib), não o ColorPicker.vue. Superfície
  // acordada = trigger + chip (exemplo “As a color chooser” da doc), então
  // o tema cobre root/trigger/preview; size escala o botão/chip, não o
  // quadrado HSV. root data-[disabled] do Vue → data-[is-disabled] (§5.11 —
  // BOOLEAN_ATTR engole data-disabled em <button>).
  // Tailwind v3: ring-accented/text/bg tokens --ui-*; outline-3 →
  // outline-[3px]; hover/focus com color-mix (TW 3.4.19 não gera /N sobre
  // var()). Trigger espelha geButton neutral/outline (chooser Nuxt).
  angular.module('gravityElements.form').constant('geColorPickerTheme', {
    slots: {
      root: 'relative inline-flex data-[is-disabled]:opacity-75',
      trigger:
        'rounded-md font-medium inline-flex items-center justify-center transition-colors ring ring-inset ring-[var(--ui-border-accented)] text-[var(--ui-text)] bg-[var(--ui-bg)] hover:bg-[var(--ui-bg-elevated)] active:bg-[var(--ui-bg-elevated)] disabled:cursor-not-allowed disabled:bg-[var(--ui-bg)] outline-[color-mix(in_srgb,var(--ui-bg-inverted)_25%,transparent)] focus-visible:outline-[3px] focus-visible:ring-[var(--ui-bg-inverted)]',
      preview:
        'relative block rounded-full overflow-hidden shrink-0 ge-color-picker-preview ring ring-inset ring-[var(--ui-border-accented)]',
    },
    variants: {
      size: {
        xs: {
          trigger: 'p-1',
          preview: 'size-3',
        },
        sm: {
          trigger: 'p-1.5',
          preview: 'size-3.5',
        },
        md: {
          trigger: 'p-1.5',
          preview: 'size-4',
        },
        lg: {
          trigger: 'p-2',
          preview: 'size-5',
        },
        xl: {
          trigger: 'p-2',
          preview: 'size-6',
        },
      },
      disabled: {
        true: {},
      },
    },
    compoundVariants: [],
    defaultVariants: {
      size: 'md',
    },
  });
})();
