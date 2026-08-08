(function () {
  'use strict';

  /**
   * geButton — botão de ação (Element).
   *
   * Paridade com Nuxt UI Button v4.10.0 (theme/button.ts + Button.vue).
   * Bindings da §7 + `icon` / `leadingIcon` / `trailingIcon` / `leading` /
   * `trailing` / `loadingIcon` / `type` (§5.4.2 — useComponentIcons + HTML).
   * avatar/leadingAvatar omitidos do template (prop objeto; slots no tema
   * para safelist). fieldGroup: herda size/orientation de `?^^geFieldGroup`
   * (paridade useFieldGroup / Button.vue). Limitação: mudança de size/
   * orientation do grupo após mount não re-renderiza este filho (§5.9).
   * Link (`to`/`active*`) e `loadingAuto` omitidos (fora do escopo desta tarefa).
   *
   * icon / leadingIcon / trailingIcon / loadingIcon: classe CSS inline até
   * existir geIcon (§5.4) — trocar por <ge-icon> quando a tarefa
   * "Componente: Icon" for concluída.
   *
   * ARIA (§5.5): aria-busy="true" quando loading; aria-disabled via
   * ngAria/ng-disabled (disabled || loading).
   *
   * @param {string} [vm.label]
   * @param {string} [vm.color='primary'] - primary|secondary|success|info|warning|error|neutral
   * @param {string} [vm.variant='solid'] - solid|outline|soft|subtle|ghost|link
   * @param {string} [vm.size='md'] - xs|sm|md|lg|xl (próprio vence o do grupo)
   * @param {boolean} [vm.block] - largura total
   * @param {boolean} [vm.square] - padding igual em todos os lados
   * @param {boolean} [vm.loading] - estado de carregamento
   * @param {boolean} [vm.disabled]
   * @param {Function} [vm.onClick]
   * @param {string} [vm.icon] - nome/classe CSS do ícone (passthrough)
   * @param {string} [vm.leadingIcon] - ícone à esquerda
   * @param {string} [vm.trailingIcon] - ícone à direita
   * @param {string} [vm.loadingIcon='i-lucide-loader-circle'] - ícone de loading
   * @param {boolean} [vm.leading] - força ícone `icon` à esquerda
   * @param {boolean} [vm.trailing] - força ícone `icon` à direita
   * @param {string} [vm.type='button'] - type HTML do botão
   */
  angular.module('gravityElements.element').component('geButton', {
    template:
      '<button type="{{ vm.buttonType }}"' +
      '  class="{{ vm.classes.base }}"' +
      '  ng-disabled="vm.isDisabled"' +
      '  ng-attr-aria-busy="{{ vm.ariaBusy }}"' +
      '  ng-click="vm.handleClick($event)">' +
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
      '</button>',
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
      block: '<',
      square: '<',
      loading: '<',
      disabled: '<',
      onClick: '&',
      icon: '@',
      leadingIcon: '@',
      trailingIcon: '@',
      loadingIcon: '@',
      leading: '<',
      trailing: '<',
      type: '@',
    },
    controller: ButtonController,
  });

  ButtonController.$inject = ['geTv', 'geButtonTheme', '$transclude'];

  function ButtonController(geTv, geButtonTheme, $transclude) {
    var vm = this;
    vm.$onInit = render;
    vm.$onChanges = render;
    vm.handleClick = handleClick;

    function render() {
      var hasLabel = vm.label !== undefined && vm.label !== null && vm.label !== '';
      var hasTransclude = hasDefaultTransclude();
      var isLoading = vm.loading === true;
      var square = vm.square === true || (!hasLabel && !hasTransclude);
      var showLeading = resolveIsLeading(isLoading);
      var showTrailing = resolveIsTrailing(isLoading);
      var resolvedLoadingIcon = vm.loadingIcon || 'i-lucide-loader-circle';
      var group = vm.fieldGroup;
      var size = vm.size || (group && group.size) || 'md';
      var tvProps = {
        color: vm.color || 'primary',
        variant: vm.variant || 'solid',
        size: size,
        block: vm.block === true,
        square: square,
        loading: isLoading,
        leading: showLeading,
        trailing: showTrailing,
      };

      if (group) {
        tvProps.fieldGroup = group.orientation || 'horizontal';
      }

      vm.hasLabel = hasLabel;
      vm.buttonType = vm.type || 'button';
      vm.isDisabled = vm.disabled === true || isLoading;
      vm.ariaBusy = isLoading ? 'true' : undefined;
      vm.showLeading = showLeading;
      vm.showTrailing = showTrailing;
      vm.leadingIconName = resolveLeadingIconName(isLoading, showLeading, resolvedLoadingIcon);
      vm.trailingIconName = resolveTrailingIconName(
        isLoading,
        showLeading,
        resolvedLoadingIcon
      );

      vm.classes = geTv(geButtonTheme)(tvProps);
    }

    function handleClick($event) {
      if (vm.isDisabled) {
        return;
      }
      if (typeof vm.onClick === 'function') {
        vm.onClick({ $event: $event });
      }
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

    // Paridade useComponentIcons (Button.vue v4.10.0)
    function resolveIsLeading(isLoading) {
      if (vm.leadingIcon) {
        return true;
      }
      if (isLoading && !vm.trailing) {
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

    function resolveIsTrailing(isLoading) {
      if (vm.trailingIcon && vm.trailing !== false) {
        return true;
      }
      if (isLoading && vm.trailing) {
        return true;
      }
      if (vm.icon && vm.trailing) {
        return true;
      }
      return false;
    }

    function resolveLeadingIconName(isLoading, showLeading, resolvedLoadingIcon) {
      if (isLoading && showLeading) {
        return resolvedLoadingIcon;
      }
      return vm.leadingIcon || vm.icon || '';
    }

    function resolveTrailingIconName(isLoading, showLeading, resolvedLoadingIcon) {
      if (isLoading && !showLeading) {
        return resolvedLoadingIcon;
      }
      return vm.trailingIcon || vm.icon || '';
    }
  }
})();
