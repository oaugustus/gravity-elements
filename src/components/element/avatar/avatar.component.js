(function () {
  'use strict';

  /**
   * geAvatar — imagem de perfil com fallback texto/ícone (Element).
   *
   * Paridade com Nuxt UI Avatar v4.10.0 (theme/avatar.ts + Avatar.vue).
   * Bindings da §7 + `color` (§5.4.2 — variant do tema upstream).
   * Fallback §7: src → text (ou iniciais de alt) → icon, no controller
   * (upstream Vue prioriza icon sobre text; seguimos a spec Gravity).
   *
   * icon: classe CSS inline até existir geIcon (§5.4) — trocar por
   * <ge-icon> quando a tarefa "Componente: Icon" for concluída.
   *
   * chipColor/chipPosition: indicador inline aproximando UChip inset
   * (§5.4.1) até existir geChip — trocar por <ge-chip> quando a tarefa
   * "Componente: Chip" for concluída.
   *
   * @param {string} [vm.src]
   * @param {string} [vm.alt]
   * @param {string} [vm.text] - fallback de iniciais/texto
   * @param {string} [vm.icon] - nome/classe CSS do ícone (passthrough)
   * @param {string} [vm.size='md'] - 3xs|2xs|xs|sm|md|lg|xl|2xl|3xl
   * @param {string} [vm.color='neutral'] - primary|secondary|success|info|warning|error|neutral
   * @param {string} [vm.chipColor] - cor do chip de status (ativa o chip)
   * @param {string} [vm.chipPosition] - top-right|bottom-right|top-left|bottom-left
   */
  angular.module('gravityElements.element').component('geAvatar', {
    template:
      '<span class="{{ vm.rootClass }}"' +
      '  ng-attr-aria-label="{{ vm.rootAriaLabel || undefined }}">' +
      '  <img ng-if="vm.showImage"' +
      '    ng-src="{{ vm.src }}"' +
      '    alt="{{ vm.alt }}"' +
      '    class="{{ vm.classes.image }}"' +
      '    onerror="var $s=angular.element(this).scope();$s.$applyAsync(function(){$s.vm.onImageError();})">' +
      '  <span ng-if="vm.showText"' +
      '    class="{{ vm.classes.fallback }}"' +
      '    aria-hidden="true">{{ vm.fallbackText }}</span>' +
      // Ícone CSS passthrough (§5.4) até existir geIcon — trocar por <ge-icon>
      '  <i ng-if="vm.showIcon"' +
      '    class="{{ vm.icon }} {{ vm.classes.icon }}"' +
      '    aria-hidden="true"></i>' +
      '  <span ng-if="vm.showEmpty"' +
      '    class="{{ vm.classes.fallback }}"' +
      '    aria-hidden="true">&nbsp;</span>' +
      // Placeholder §5.4.1 — substituir por <ge-chip> após Componente: Chip
      '  <span ng-if="vm.showChip"' +
      '    class="{{ vm.chipClass }}"' +
      '    aria-hidden="true"></span>' +
      '</span>',
    controllerAs: 'vm',
    bindings: {
      src: '@',
      alt: '@',
      text: '@',
      icon: '@',
      size: '@',
      color: '@',
      chipColor: '@',
      chipPosition: '@',
    },
    controller: AvatarController,
  });

  var CHIP_BG = {
    primary: 'bg-[var(--ui-primary)]',
    secondary: 'bg-[var(--ui-secondary)]',
    success: 'bg-[var(--ui-success)]',
    info: 'bg-[var(--ui-info)]',
    warning: 'bg-[var(--ui-warning)]',
    error: 'bg-[var(--ui-error)]',
    neutral: 'bg-[var(--ui-bg-inverted)]',
  };

  var CHIP_SIZE = {
    '3xs': 'h-[4px] min-w-[4px] text-[4px]',
    '2xs': 'h-[5px] min-w-[5px] text-[5px]',
    xs: 'h-[6px] min-w-[6px] text-[6px]',
    sm: 'h-[7px] min-w-[7px] text-[7px]',
    md: 'h-[8px] min-w-[8px] text-[8px]',
    lg: 'h-[9px] min-w-[9px] text-[9px]',
    xl: 'h-[10px] min-w-[10px] text-[10px]',
    '2xl': 'h-[11px] min-w-[11px] text-[11px]',
    '3xl': 'h-[12px] min-w-[12px] text-[12px]',
  };

  var CHIP_POSITION = {
    'top-right': 'top-0 right-0',
    'bottom-right': 'bottom-0 right-0',
    'top-left': 'top-0 left-0',
    'bottom-left': 'bottom-0 left-0',
  };

  AvatarController.$inject = ['geTv', 'geAvatarTheme'];

  function AvatarController(geTv, geAvatarTheme) {
    var vm = this;
    vm.$onInit = onInit;
    vm.$onChanges = onChanges;
    vm.onImageError = onImageError;

    function onInit() {
      vm.imageError = false;
      refresh();
    }

    function onChanges(changes) {
      if (!vm.classes) {
        return;
      }
      if (changes.src && !changes.src.isFirstChange()) {
        vm.imageError = false;
      }
      var hasLaterChange = Object.keys(changes).some(function (key) {
        return !changes[key].isFirstChange();
      });
      if (hasLaterChange) {
        refresh();
      }
    }

    function onImageError() {
      vm.imageError = true;
      resolveDisplay();
    }

    function refresh() {
      var size = vm.size || 'md';
      var color = vm.color || 'neutral';
      vm.classes = geTv(geAvatarTheme)({
        size: size,
        color: color,
      });
      vm.showChip = !!(vm.chipColor || vm.chipPosition);
      vm.rootClass = vm.classes.root + (vm.showChip ? ' relative' : '');
      if (vm.showChip) {
        var chipColor = vm.chipColor || 'primary';
        var chipPos = vm.chipPosition || 'top-right';
        vm.chipClass = [
          'rounded-full ring ring-[var(--ui-bg)] flex items-center justify-center',
          'text-[var(--ui-text-inverted)] font-medium whitespace-nowrap absolute',
          CHIP_BG[chipColor] || CHIP_BG.primary,
          CHIP_SIZE[size] || CHIP_SIZE.md,
          CHIP_POSITION[chipPos] || CHIP_POSITION['top-right'],
        ].join(' ');
      } else {
        vm.chipClass = '';
      }
      resolveDisplay();
    }

    function resolveDisplay() {
      var hasSrc = !!(vm.src && !vm.imageError);
      var fallbackText = resolveFallbackText();
      var hasText = !!fallbackText;
      var hasIcon = !!vm.icon;

      vm.showImage = hasSrc;
      // Ordem §7: src → text → icon
      vm.showText = !hasSrc && hasText;
      vm.showIcon = !hasSrc && !hasText && hasIcon;
      vm.showEmpty = !hasSrc && !hasText && !hasIcon;
      vm.fallbackText = fallbackText;

      // ARIA §5.5: alt no <img>; fallback visual com aria-hidden; se alt
      // existe no modo fallback, nome acessível no root.
      vm.rootAriaLabel = !vm.showImage && vm.alt ? vm.alt : null;
    }

    function resolveFallbackText() {
      if (vm.text) {
        return vm.text;
      }
      if (!vm.alt) {
        return '';
      }
      return vm.alt
        .split(' ')
        .map(function (word) {
          return word.charAt(0);
        })
        .join('')
        .substring(0, 2);
    }
  }
})();
