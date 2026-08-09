(function () {
  'use strict';

  // Tema próprio do Gravity Elements — NÃO portado de upstream.
  // Nuxt UI v4.10.0 não tem theme/icon.ts (Icon.vue delega size em px bruto
  // para @nuxt/icon). A escala abaixo alinha xs–xl aos leadingIcon/trailingIcon
  // do geButton (size-4 / size-5 / size-6) e estende 3xs–3xl com as mesmas
  // chaves de API do geAvatar/geChip.
  // §5.7 N/A (só size-* / shrink-0 / inline-block).
  angular.module('gravityElements.element').constant('geIconTheme', {
    slots: {
      base: 'shrink-0 inline-block',
    },
    variants: {
      size: {
        '3xs': 'size-3',
        '2xs': 'size-3.5',
        xs: 'size-4',
        sm: 'size-4',
        md: 'size-5',
        lg: 'size-5',
        xl: 'size-6',
        '2xl': 'size-7',
        '3xl': 'size-8',
      },
    },
    defaultVariants: {
      size: 'md',
    },
  });
})();
