(function () {
  'use strict';

  /**
   * geBadge — rótulo compacto de status/categoria (Element).
   *
   * Paridade com Nuxt UI Badge v4.10.0 (theme/badge.ts + Badge.vue).
   * Bindings da §7 + `square` / `icon` / `leadingIcon` / `trailingIcon` /
   * `leading` / `trailing` (§5.4.2 — variants/slots + useComponentIcons).
   * avatar/leadingAvatar omitidos do template (prop objeto; slots no tema
   * para safelist). fieldGroup no tema; não passado até geFieldGroup.
   *
   * icon / leadingIcon / trailingIcon: classe CSS inline até existir geIcon
   * (§5.4) — trocar por <ge-icon> quando a tarefa "Componente: Icon" for
   * concluída.
   *
   * @param {string} [vm.label]
   * @param {string} [vm.color='primary'] - primary|secondary|success|info|warning|error|neutral
   * @param {string} [vm.variant='solid'] - solid|outline|soft|subtle
   * @param {string} [vm.size='md'] - xs|sm|md|lg|xl
   * @param {boolean} [vm.square] - padding igual em todos os lados
   * @param {string} [vm.icon] - nome/classe CSS do ícone (passthrough)
   * @param {string} [vm.leadingIcon] - ícone à esquerda
   * @param {string} [vm.trailingIcon] - ícone à direita
   * @param {boolean} [vm.leading] - força ícone `icon` à esquerda
   * @param {boolean} [vm.trailing] - força ícone `icon` à direita
   */
  angular.module('gravityElements.element').component('geBadge', {
    template:
      '<span class="{{ vm.classes.base }}">' +
      // Ícone CSS passthrough (§5.4) até existir geIcon — trocar por <ge-icon>
      '  <i ng-if="vm.showLeading"' +
      '    class="{{ vm.leadingIconName }} {{ vm.classes.leadingIcon }}"' +
      '    aria-hidden="true"></i>' +
      '  <span ng-if="vm.hasLabel"' +
      '    class="{{ vm.classes.label }}">{{ vm.label }}</span>' +
      '  <span ng-transclude></span>' +
      '  <i ng-if="vm.showTrailing"' +
      '    class="{{ vm.trailingIconName }} {{ vm.classes.trailingIcon }}"' +
      '    aria-hidden="true"></i>' +
      '</span>',
    controllerAs: 'vm',
    transclude: true,
    bindings: {
      label: '@',
      color: '@',
      variant: '@',
      size: '@',
      square: '<',
      icon: '@',
      leadingIcon: '@',
      trailingIcon: '@',
      leading: '<',
      trailing: '<',
    },
    controller: BadgeController,
  });

  BadgeController.$inject = ['geTv', 'geBadgeTheme', '$transclude'];

  function BadgeController(geTv, geBadgeTheme, $transclude) {
    var vm = this;
    vm.$onInit = render;
    vm.$onChanges = render;

    function render() {
      var hasLabel = vm.label !== undefined && vm.label !== null && vm.label !== '';
      var hasTransclude = hasDefaultTransclude();
      var square = vm.square === true || (!hasLabel && !hasTransclude);

      vm.hasLabel = hasLabel;
      vm.showLeading = resolveIsLeading();
      vm.showTrailing = resolveIsTrailing();
      vm.leadingIconName = vm.leadingIcon || vm.icon || '';
      vm.trailingIconName = vm.trailingIcon || vm.icon || '';

      vm.classes = geTv(geBadgeTheme)({
        color: vm.color || 'primary',
        variant: vm.variant || 'solid',
        size: vm.size || 'md',
        square: square,
      });
    }

    function hasDefaultTransclude() {
      var filled = false;
      $transclude(function (clone) {
        var i;
        for (i = 0; i < clone.length; i += 1) {
          if (clone[i].nodeType === 1) {
            filled = true;
            break;
          }
          if (
            clone[i].nodeType === 3 &&
            clone[i].textContent &&
            clone[i].textContent.trim()
          ) {
            filled = true;
            break;
          }
        }
      });
      return filled;
    }

    // Paridade useComponentIcons (sem loading) — Badge.vue v4.10.0
    function resolveIsLeading() {
      if (vm.leadingIcon) {
        return true;
      }
      if (vm.icon && vm.leading) {
        return true;
      }
      if (vm.icon && !vm.trailing) {
        return true;
      }
      return false;
    }

    function resolveIsTrailing() {
      if (vm.trailingIcon && vm.trailing !== false) {
        return true;
      }
      if (vm.icon && vm.trailing) {
        return true;
      }
      return false;
    }
  }
})();
