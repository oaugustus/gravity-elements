(function () {
  'use strict';

  /**
   * geChip — indicador de notificação/status (Element).
   *
   * Paridade com Nuxt UI Chip v4.10.0 (theme/chip.ts + Chip.vue).
   * Usado sozinho (`standalone`) ou envolvendo outro elemento (transclusion)
   * com posicionamento absoluto (`position`).
   *
   * Bindings §7 + extras `inset` / `show` (§5.4.2 — props reais do Chip.vue
   * com efeito no tema/DOM). `label` é alias de `text` (tabela §7).
   *
   * Uso:
   *   <ge-chip text="3" color="error">
   *     <ge-avatar src="..."></ge-avatar>
   *   </ge-chip>
   *   <ge-chip standalone="true" color="success"></ge-chip>
   *
   * @param {string} [vm.text] - texto/contagem dentro do chip
   * @param {string} [vm.label] - alias de `text` (§7)
   * @param {string} [vm.color='primary'] - primary|secondary|success|info|warning|error|neutral
   * @param {string} [vm.size='md'] - 3xs|2xs|xs|sm|md|lg|xl|2xl|3xl
   * @param {string} [vm.position='top-right'] - top-right|bottom-right|top-left|bottom-left
   * @param {boolean} [vm.standalone=false] - sem absolute (relativo ao pai)
   * @param {boolean} [vm.inset=false] - mantém o chip dentro (sem translate)
   * @param {boolean} [vm.show=true] - controla visibilidade do indicador
   */
  angular.module('gravityElements.element').component('geChip', {
    template:
      '<div class="{{ vm.classes.root }}">' +
      '  <span ng-transclude></span>' +
      '  <span ng-if="vm.showChip"' +
      '    class="{{ vm.classes.base }}"' +
      '    ng-attr-aria-hidden="{{ vm.displayText ? undefined : \'true\' }}">{{ vm.displayText }}</span>' +
      '</div>',
    controllerAs: 'vm',
    transclude: true,
    bindings: {
      text: '@',
      label: '@',
      color: '@',
      size: '@',
      position: '@',
      standalone: '<',
      inset: '<',
      show: '<',
    },
    controller: ChipController,
  });

  ChipController.$inject = ['geTv', 'geChipTheme'];

  function ChipController(geTv, geChipTheme) {
    var vm = this;
    vm.$onInit = render;
    vm.$onChanges = render;

    function render() {
      var text = vm.text;
      var label = vm.label;
      var displayText = '';

      if (text !== undefined && text !== null && String(text) !== '') {
        displayText = String(text);
      } else if (label !== undefined && label !== null && String(label) !== '') {
        displayText = String(label);
      }

      vm.displayText = displayText;
      // Vue defineModel('show', { default: true })
      vm.showChip = vm.show !== false;

      vm.classes = geTv(geChipTheme)({
        color: vm.color || 'primary',
        size: vm.size || 'md',
        position: vm.position || 'top-right',
        inset: vm.inset === true,
        standalone: vm.standalone === true,
      });
    }
  }
})();
