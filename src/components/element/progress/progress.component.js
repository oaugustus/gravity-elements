(function () {
  'use strict';

  /**
   * geProgress — barra de progresso (Element).
   *
   * Paridade com Nuxt UI Progress v4.10.0 (theme/progress.ts + Progress.vue +
   * keyframes.css). Escopo expandido 2026-08-13: orientation, inverted,
   * animation (carousel/carousel-inverse/swing/elastic), max como array de
   * steps. RTL no transform determinate fica fora (só LTR); classes rtl: e
   * keyframes *-rtl entram no tema/CSS.
   *
   * Uso:
   *   <ge-progress value="value" max="100" status="true"></ge-progress>
   *   <ge-progress max="demo.progressMaxSteps" value="3"></ge-progress>
   *   <ge-progress orientation="vertical" animation="swing"></ge-progress>
   *
   * @param {number|null} [vm.value] - valor atual; null/omitido = indeterminate
   * @param {number|string[]} [vm.max=100] - máximo, ou array de labels de step
   * @param {string} [vm.color='primary'] - primary|secondary|success|info|warning|error|neutral
   * @param {string} [vm.size='md'] - 2xs|xs|sm|md|lg|xl|2xl
   * @param {boolean} [vm.status] - mostra label de %
   * @param {string} [vm.orientation='horizontal'] - horizontal|vertical
   * @param {boolean} [vm.inverted] - inverte direção visual da barra/status
   * @param {string} [vm.animation='carousel'] - carousel|carousel-inverse|swing|elastic
   */
  var progressTemplate =
    '<div class="{{ vm.classes.root }}">' +
    '  <div ng-if="vm.showStatus" class="{{ vm.classes.status }}"' +
    '    ng-style="vm.statusStyle">{{ vm.percent }}%</div>' +
    '  <div role="progressbar" class="{{ vm.classes.base }}"' +
    '    style="transform: translateZ(0)"' +
    '    aria-valuemin="0"' +
    '    ng-attr-aria-orientation="{{ vm.resolvedOrientation }}"' +
    '    ng-attr-aria-valuemax="{{ vm.ariaValueMax }}"' +
    '    ng-attr-aria-valuenow="{{ vm.ariaValueNow }}">' +
    '    <div class="{{ vm.classes.indicator }}"' +
    '      ng-attr-data-state="{{ vm.dataState }}"' +
    '      ng-style="vm.indicatorStyle"></div>' +
    '  </div>' +
    '  <div ng-if="vm.hasSteps" class="{{ vm.classes.steps }}">' +
    '    <div ng-repeat="step in vm.steps track by $index"' +
    '      class="{{ step.classes }}">{{ step.label }}</div>' +
    '  </div>' +
    '</div>';

  angular.module('gravityElements.element').component('geProgress', {
    template: progressTemplate,
    controllerAs: 'vm',
    bindings: {
      value: '<',
      max: '<',
      color: '@',
      size: '@',
      status: '<',
      orientation: '@',
      inverted: '<',
      animation: '@',
    },
    controller: ProgressController,
  });

  ProgressController.$inject = ['geTv', 'geProgressTheme'];

  function ProgressController(geTv, geProgressTheme) {
    var vm = this;
    vm.$onInit = render;
    vm.$onChanges = render;

    function stepVariant(index, numericValue, realMax) {
      var isActive = index === numericValue;
      var isFirst = index === 0;
      var isLast = index === realMax;

      if (isActive && !isFirst) {
        return 'active';
      }
      if (isFirst && isActive) {
        return 'first';
      }
      if (isLast && isActive) {
        return 'last';
      }
      return 'other';
    }

    function render() {
      var isIndeterminate = vm.value === null || vm.value === undefined;
      var hasSteps = Array.isArray(vm.max);
      var orientation = vm.orientation || 'horizontal';
      var inverted = vm.inverted === true;
      var animation = vm.animation || 'carousel';
      var color = vm.color || 'primary';
      var size = vm.size || 'md';
      var realMax;
      var percent;
      var numericValue;
      var tvProps;
      var i;
      var steps;

      if (isIndeterminate) {
        realMax = undefined;
        percent = undefined;
        numericValue = undefined;
      } else {
        numericValue = Number(vm.value);
        if (hasSteps) {
          realMax = vm.max.length - 1;
        } else if (
          vm.max !== undefined &&
          vm.max !== null &&
          !isNaN(Number(vm.max)) &&
          Number(vm.max) > 0
        ) {
          realMax = Number(vm.max);
        } else {
          realMax = 100;
        }
        if (isNaN(numericValue) || numericValue < 0) {
          percent = 0;
        } else if (numericValue > realMax) {
          percent = 100;
        } else {
          percent = Math.round((numericValue / realMax) * 100);
        }
      }

      tvProps = {
        color: color,
        size: size,
        orientation: orientation,
        inverted: inverted,
        animation: animation,
      };

      vm.isIndeterminate = isIndeterminate;
      vm.hasSteps = hasSteps && vm.max.length > 0;
      vm.percent = percent;
      vm.showStatus = !isIndeterminate && !!vm.status;
      vm.resolvedOrientation = orientation;
      vm.ariaValueMax = isIndeterminate ? undefined : realMax;
      vm.ariaValueNow = isIndeterminate ? undefined : numericValue;
      vm.dataState = isIndeterminate ? 'indeterminate' : undefined;
      vm.classes = geTv(geProgressTheme)(tvProps);

      if (percent === undefined) {
        vm.indicatorStyle = undefined;
      } else if (orientation === 'vertical') {
        vm.indicatorStyle = {
          transform:
            'translateY(' + (inverted ? '' : '-') + (100 - percent) + '%)',
        };
      } else {
        vm.indicatorStyle = {
          transform:
            'translateX(' + (inverted ? '' : '-') + (100 - percent) + '%)',
        };
      }

      if (orientation === 'vertical') {
        vm.statusStyle = {
          height: Math.max(percent === undefined ? 0 : percent, 0) + '%',
        };
      } else {
        vm.statusStyle = {
          width: Math.max(percent === undefined ? 0 : percent, 0) + '%',
        };
      }

      steps = [];
      if (vm.hasSteps) {
        for (i = 0; i < vm.max.length; i += 1) {
          steps.push({
            label: vm.max[i],
            classes: geTv(geProgressTheme)(
              angular.extend({}, tvProps, {
                step: stepVariant(i, numericValue, realMax),
              })
            ).step,
          });
        }
      }
      vm.steps = steps;
    }
  }
})();
