(function () {
  'use strict';

  /**
   * geBadge — rótulo compacto de status/categoria (Element).
   *
   * Paridade com Nuxt UI Badge v4.10.0 (theme/badge.ts + Badge.vue).
   * Bindings da §7 + `square` / `icon` / `leadingIcon` / `trailingIcon` /
   * `leading` / `trailing` (§5.4.2 — variants/slots + useComponentIcons).
   * avatar/leadingAvatar omitidos do template (prop objeto; slots no tema
   * para safelist). fieldGroup: herda size/orientation de `?^^geFieldGroup`
   * (paridade useFieldGroup / Button.vue). Limitação: mudança de size/
   * orientation do grupo após mount não re-renderiza este filho (§5.9).
   *
   * icon / leadingIcon / trailingIcon: classe CSS inline até existir geIcon
   * (§5.4) — trocar por <ge-icon> quando a tarefa "Componente: Icon" for
   * concluída.
   *
   * @param {string} [vm.label]
   * @param {string} [vm.color='primary'] - primary|secondary|success|info|warning|error|neutral
   * @param {string} [vm.variant='solid'] - solid|outline|soft|subtle
   * @param {string} [vm.size='md'] - xs|sm|md|lg|xl (próprio vence o do grupo)
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
      '  <span ng-if="vm.hasTransclude" ng-transclude></span>' +
      '  <i ng-if="vm.showTrailing"' +
      '    class="{{ vm.trailingIconName }} {{ vm.classes.trailingIcon }}"' +
      '    aria-hidden="true"></i>' +
      '</span>',
    controllerAs: 'vm',
    transclude: true,
    require: {
      fieldGroup: '?^^geFieldGroup',
    },
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
      var group = vm.fieldGroup;
      var size = vm.size || (group && group.size) || 'md';
      var tvProps = {
        color: vm.color || 'primary',
        variant: vm.variant || 'solid',
        size: size,
        square: square,
      };

      if (group) {
        tvProps.fieldGroup = group.orientation || 'horizontal';
      }

      vm.hasLabel = hasLabel;
      vm.hasTransclude = hasTransclude;
      vm.showLeading = resolveIsLeading();
      vm.showTrailing = resolveIsTrailing();
      vm.leadingIconName = vm.leadingIcon || vm.icon || '';
      vm.trailingIconName = vm.trailingIcon || vm.icon || '';

      vm.classes = geTv(geBadgeTheme)(tvProps);
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
