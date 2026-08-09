(function () {
  'use strict';

  /**
   * geSeparator — divisor visual (Element).
   *
   * Paridade com Nuxt UI Separator v4.10.0 (theme/separator.ts + Separator.vue),
   * escopo §7: só geTv + rótulo opcional.
   *
   * Decisões de escopo:
   * - Bindings icon/avatar/position do upstream ficam fora desta etapa (não
   *   estão na tabela §7). Só `label` é suportado como conteúdo.
   * - `position: 'center'` é fixo internamente no geTv (não exposto como
   *   binding) — mesma estratégia do geProgress com orientation horizontal.
   * - `type` aceita também `dotted` (paridade tema upstream; §7 lista
   *   solid|dashed).
   *
   * Uso:
   *   <ge-separator></ge-separator>
   *   <ge-separator label="Ou" color="primary" type="dashed"></ge-separator>
   *   <ge-separator orientation="vertical" size="md"></ge-separator>
   *
   * @param {string} [vm.orientation='horizontal'] - horizontal|vertical
   * @param {string} [vm.label] - rótulo opcional no centro
   * @param {string} [vm.color='neutral'] - primary|secondary|success|info|warning|error|neutral
   * @param {string} [vm.size='xs'] - xs|sm|md|lg|xl
   * @param {string} [vm.type='solid'] - solid|dashed|dotted
   */
  angular.module('gravityElements.element').component('geSeparator', {
    template:
      '<div role="separator"' +
      '  ng-attr-aria-orientation="{{ vm.resolvedOrientation }}"' +
      '  class="{{ vm.classes.root }}">' +
      '  <div class="{{ vm.classes.border }}"></div>' +
      '  <div ng-if="vm.hasLabel" class="{{ vm.classes.container }}">' +
      '    <span class="{{ vm.classes.label }}">{{ vm.label }}</span>' +
      '  </div>' +
      '  <div ng-if="vm.hasLabel" class="{{ vm.classes.border }}"></div>' +
      '</div>',
    controllerAs: 'vm',
    bindings: {
      orientation: '@',
      label: '@',
      color: '@',
      size: '@',
      type: '@',
    },
    controller: SeparatorController,
  });

  SeparatorController.$inject = ['geTv', 'geSeparatorTheme'];

  function SeparatorController(geTv, geSeparatorTheme) {
    var vm = this;
    vm.$onInit = render;
    vm.$onChanges = render;

    function render() {
      var orientation = vm.orientation || 'horizontal';
      var hasLabel =
        vm.label !== undefined && vm.label !== null && vm.label !== '';

      vm.resolvedOrientation = orientation;
      vm.hasLabel = hasLabel;
      vm.classes = geTv(geSeparatorTheme)({
        color: vm.color || 'neutral',
        orientation: orientation,
        size: vm.size || 'xs',
        type: vm.type || 'solid',
        position: 'center',
      });
    }
  }
})();
