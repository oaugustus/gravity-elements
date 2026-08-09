(function () {
  'use strict';

  /**
   * geProgress — barra de progresso (Element).
   *
   * Paridade com Nuxt UI Progress v4.10.0 (theme/progress.ts + Progress.vue),
   * escopo §7: barra horizontal simples.
   *
   * Decisões de escopo:
   * - Estado visual indeterminate quando `value` é null/undefined (sem
   *   aria-valuenow, indicador sem transform fixo, data-state="indeterminate").
   * - Feedback indeterminate: uma animação simples
   *   `data-[state=indeterminate]:animate-pulse` — as 4 variantes
   *   carousel/carousel-inverse/swing/elastic e a prop `animation` do upstream
   *   ficam fora do binding contract desta etapa.
   * - Fora: steps/step, orientation vertical, inverted, max como array.
   *
   * Uso:
   *   <ge-progress value="value" max="100" status="true"></ge-progress>
   *   <ge-progress color="success" size="lg"></ge-progress>
   *
   * @param {number|null} [vm.value] - valor atual; null/omitido = indeterminate
   * @param {number} [vm.max=100] - máximo
   * @param {string} [vm.color='primary'] - primary|secondary|success|info|warning|error|neutral
   * @param {string} [vm.size='md'] - 2xs|xs|sm|md|lg|xl|2xl
   * @param {boolean} [vm.status] - mostra label de %
   */
  angular.module('gravityElements.element').component('geProgress', {
    template:
      '<div class="{{ vm.classes.root }}">' +
      '  <div ng-if="vm.showStatus" class="{{ vm.classes.status }}"' +
      '    ng-style="vm.statusStyle">{{ vm.percent }}%</div>' +
      '  <div role="progressbar" class="{{ vm.classes.base }}"' +
      '    style="transform: translateZ(0)"' +
      '    aria-valuemin="0"' +
      '    ng-attr-aria-valuemax="{{ vm.ariaValueMax }}"' +
      '    ng-attr-aria-valuenow="{{ vm.ariaValueNow }}">' +
      '    <div class="{{ vm.classes.indicator }}"' +
      '      ng-attr-data-state="{{ vm.dataState }}"' +
      '      ng-style="vm.indicatorStyle"></div>' +
      '  </div>' +
      '</div>',
    controllerAs: 'vm',
    bindings: {
      value: '<',
      max: '<',
      color: '@',
      size: '@',
      status: '<',
    },
    controller: ProgressController,
  });

  ProgressController.$inject = ['geTv', 'geProgressTheme'];

  function ProgressController(geTv, geProgressTheme) {
    var vm = this;
    vm.$onInit = render;
    vm.$onChanges = render;

    function render() {
      var isIndeterminate = vm.value === null || vm.value === undefined;
      var realMax;
      var percent;
      var numericValue;

      if (isIndeterminate) {
        realMax = undefined;
        percent = undefined;
      } else {
        realMax =
          vm.max !== undefined &&
          vm.max !== null &&
          !isNaN(Number(vm.max)) &&
          Number(vm.max) > 0
            ? Number(vm.max)
            : 100;
        numericValue = Number(vm.value);
        if (isNaN(numericValue) || numericValue < 0) {
          percent = 0;
        } else if (numericValue > realMax) {
          percent = 100;
        } else {
          percent = Math.round((numericValue / realMax) * 100);
        }
      }

      vm.isIndeterminate = isIndeterminate;
      vm.percent = percent;
      vm.showStatus = !isIndeterminate && !!vm.status;
      vm.ariaValueMax = isIndeterminate ? undefined : realMax;
      vm.ariaValueNow = isIndeterminate ? undefined : numericValue;
      vm.dataState = isIndeterminate ? 'indeterminate' : undefined;
      vm.indicatorStyle =
        percent === undefined
          ? undefined
          : { transform: 'translateX(-' + (100 - percent) + '%)' };
      vm.statusStyle = {
        width: Math.max(percent === undefined ? 0 : percent, 0) + '%',
      };

      vm.classes = geTv(geProgressTheme)({
        color: vm.color || 'primary',
        size: vm.size || 'md',
      });
    }
  }
})();
