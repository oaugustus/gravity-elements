(function () {
  'use strict';

  var DEFAULT_COLOR = '#FFFFFF';
  var DEFAULT_THROTTLE_MS = 50;
  var DEFAULT_ARIA_LABEL = 'Selecionar cor';

  /**
   * geColorPicker — seletor de cor (Form), wrapper do Pickr.
   *
   * Paridade de *uso* com Nuxt UI ColorPicker v4.10.0 no exemplo
   * “As a color chooser” (botão + painel), não com o picker HSV inline
   * do ColorPicker.vue — a spec da Etapa 2 escolheu Pickr de propósito.
   *
   * ngModel customizado (§5.3) no host (`<ge-color-picker ng-model="vm.cor">`),
   * valor **string** no formato de `format` (`hex`|`rgba`|`hsla`). Pickr
   * trabalha em HSVa; a conversão é responsabilidade deste componente
   * (`toHEXA`/`toRGBA`/`toHSLA().toString()` na borda). Evento do modelo:
   * `change` (live, como o v-model throttled do Nuxt), não `save`.
   * `comparison: false` + `interaction.save: false` — §5.7 cita geButton
   * para confirmar/limpar, mas isso não se aplica com update live; o DOM
   * de Save/Clear é da lib.
   *
   * Posicionamento: Nanopop nativo do Pickr (`position: 'bottom-start'`,
   * `useAsButton: true` anexa o painel em `body`). **Não** usa
   * `ge-floating-position` — o painel não é um nó nosso.
   *
   * Ciclo de vida (precedente ge-focus-trap / window.dateFns): Pickr.create
   * no `$onInit` sobre o trigger, `pickr.destroy()` no `$onDestroy` (não
   * `destroyAndRemove`, para não remover o botão nosso).
   *
   * ARIA (§5.8 + §5.15 por-elemento, como geCheckbox): o ngAria aplica
   * aria-invalid/aria-required no host (onde está o ng-model); o host não
   * é focável. Interpolamos no `<button>` trigger: aria-invalid com gate
   * `$invalid && $dirty`, aria-required via `$validators.required`.
   * aria-expanded sincroniza com eventos reais `show`/`hide` da lib.
   * Nuxt v4.10.0 não tem binding de label — `ariaLabel` é extra Gravity,
   * default "Selecionar cor".
   *
   * Bindings da tabela §6 + extras da v4.10.0: `size`, `throttle`.
   * Omitidos: `as`, `defaultValue` (modelo vazio → preview #FFFFFF sem
   * $setViewValue no init), `ui`/`class`, formatos `cmyk`/`lab`.
   *
   * @param {string} [vm.format='hex'] - hex|rgba|hsla
   * @param {string[]} [vm.swatches] - cores predefinidas do Pickr
   * @param {boolean} [vm.disabled]
   * @param {string} [vm.size='md'] - xs|sm|md|lg|xl (trigger/chip)
   * @param {number} [vm.throttle=50] - debounce em ms do $setViewValue
   * @param {string} [vm.ariaLabel='Selecionar cor']
   * @param {boolean} [vm.required] - ng-required no host valida a string
   * @param {string} [vm.describedBy] - aria-describedby no trigger
   */
  angular.module('gravityElements.form').component('geColorPicker', {
    template:
      '<div class="{{ vm.classes.root }}"' +
      '  ng-attr-data-is-disabled="{{ vm.dataDisabled }}">' +
      '  <button type="button"' +
      '    id="{{ vm.triggerId }}"' +
      '    class="{{ vm.classes.trigger }}"' +
      '    data-ge-color-trigger' +
      '    ng-disabled="vm.isDisabled"' +
      '    aria-haspopup="dialog"' +
      '    aria-expanded="{{ vm.isOpen ? \'true\' : \'false\' }}"' +
      '    aria-label="{{ vm.resolvedAriaLabel }}"' +
      '    aria-invalid="{{ !!(vm.ngModelCtrl.$invalid && vm.ngModelCtrl.$dirty) }}"' +
      '    ng-attr-aria-required="{{ vm.ngModelCtrl.$validators.required ? \'true\' : undefined }}"' +
      '    ng-attr-aria-describedby="{{ vm.describedByAttr }}"' +
      '    ng-attr-data-is-disabled="{{ vm.dataDisabled }}"' +
      '    ng-attr-data-is-invalid="{{ vm.dataInvalid }}">' +
      '    <span class="{{ vm.classes.preview }}">' +
      '      <span class="block size-full rounded-full"' +
      '        data-ge-color-preview' +
      '        ng-style="vm.previewStyle"></span>' +
      '    </span>' +
      '  </button>' +
      '</div>',
    controllerAs: 'vm',
    require: { ngModelCtrl: 'ngModel' },
    bindings: {
      format: '@',
      swatches: '<',
      disabled: '<',
      size: '@',
      throttle: '<',
      ariaLabel: '@',
      required: '<',
      describedBy: '@',
    },
    controller: ColorPickerController,
  });

  ColorPickerController.$inject = [
    '$element',
    '$window',
    '$timeout',
    '$scope',
    'geTv',
    'geColorPickerTheme',
    'geId',
  ];

  function ColorPickerController(
    $element,
    $window,
    $timeout,
    $scope,
    geTv,
    geColorPickerTheme,
    geId
  ) {
    var vm = this;
    var pickr = null;
    var destroyed = false;
    var applyingFromModel = false;
    var pendingTimeout = null;
    var swatchCount = 0;

    vm.triggerId = geId.next('ge-color-picker');
    vm.classes = {};
    vm.isOpen = false;
    vm.isDisabled = false;
    vm.previewColor = DEFAULT_COLOR;
    vm.previewStyle = { 'background-color': DEFAULT_COLOR };
    vm.pickr = null;
    vm.pickrReady = false;
    vm.$onInit = onInit;
    vm.$onChanges = onChanges;
    vm.$onDestroy = onDestroy;

    function onInit() {
      vm.ngModelCtrl.$isEmpty = isEmptyColor;
      vm.ngModelCtrl.$render = renderValue;
      vm.ngModelCtrl.$formatters.push(identity);
      vm.ngModelCtrl.$parsers.push(identity);
      syncView();
      createPickr();
      renderValue();
    }

    function onChanges(changes) {
      if (!pickr || destroyed) {
        if (!pickr) {
          syncView();
        }
        return;
      }
      if (changes.disabled && !changes.disabled.isFirstChange()) {
        if (vm.disabled === true) {
          pickr.disable();
          pickr.hide();
        } else {
          pickr.enable();
        }
      }
      if (changes.format && !changes.format.isFirstChange()) {
        pickr.setColorRepresentation(representationFor(vm.format));
        applyCurrentColorToModel();
      }
      if (changes.swatches && !changes.swatches.isFirstChange()) {
        replaceSwatches();
      }
      syncView();
    }

    function onDestroy() {
      destroyed = true;
      cancelPending();
      if (pickr && typeof pickr.destroy === 'function') {
        pickr.destroy();
      }
      pickr = null;
      vm.pickr = null;
    }

    function renderValue() {
      var value = vm.ngModelCtrl.$viewValue;
      updatePreview(isEmptyColor(value) ? DEFAULT_COLOR : value);
      if (!pickr || isEmptyColor(value)) {
        syncView();
        return;
      }
      applyingFromModel = true;
      pickr.setColor(value, true);
      applyingFromModel = false;
      syncView();
    }

    function createPickr() {
      var PickrCtor = $window.Pickr;
      var trigger;
      var initial;
      var swatchList;
      if (!PickrCtor || typeof PickrCtor.create !== 'function') {
        throw new Error('geColorPicker: window.Pickr não disponível');
      }
      trigger = getTrigger();
      if (!trigger) {
        throw new Error('geColorPicker: trigger não encontrado');
      }
      initial = readInitialColor();
      swatchList = normalizeSwatches(vm.swatches);
      pickr = PickrCtor.create({
        el: trigger,
        theme: 'nano',
        useAsButton: true,
        appClass: 'ge-color-picker-app',
        position: 'bottom-start',
        comparison: false,
        default: initial,
        swatches: swatchList.length ? swatchList : null,
        defaultRepresentation: representationFor(vm.format),
        disabled: vm.disabled === true,
        components: {
          preview: true,
          opacity: true,
          hue: true,
          interaction: {
            hex: false,
            rgba: false,
            hsla: false,
            input: true,
            save: false,
            clear: false,
            cancel: false,
          },
        },
        i18n: {
          'ui:dialog': 'Seletor de cor',
          'btn:toggle': DEFAULT_ARIA_LABEL,
          'btn:swatch': 'Amostra de cor',
          'aria:input': 'Campo de cor',
          'aria:palette': 'Área de seleção de cor',
          'aria:hue': 'Controle de matiz',
          'aria:opacity': 'Controle de opacidade',
        },
      });
      swatchCount = swatchList.length;
      vm.pickr = pickr;
      pickr.on('init', onPickrInit);
      pickr.on('show', onPickrShow);
      pickr.on('hide', onPickrHide);
      pickr.on('change', onPickrChange);
      pickr.on('save', onPickrChange);
    }

    function onPickrInit() {
      if (destroyed) {
        return;
      }
      vm.pickrReady = true;
      renderValue();
    }

    function onPickrShow() {
      if (destroyed) {
        return;
      }
      vm.isOpen = true;
      $timeout(triggerDigest, 0);
    }

    function onPickrHide() {
      if (destroyed) {
        return;
      }
      vm.isOpen = false;
      $timeout(triggerDigest, 0);
    }

    function triggerDigest() {}

    function onPickrChange(color) {
      if (destroyed || applyingFromModel || !color) {
        return;
      }
      scheduleCommit(color);
    }

    function scheduleCommit(color) {
      var delay = throttleDelay();
      cancelPending();
      if (!delay) {
        applyColorToModel(color);
        return;
      }
      pendingTimeout = $timeout(function commitColor() {
        pendingTimeout = null;
        if (destroyed) {
          return;
        }
        applyColorToModel(color);
      }, delay);
    }

    function applyCurrentColorToModel() {
      if (!pickr || typeof pickr.getColor !== 'function') {
        return;
      }
      applyColorToModel(pickr.getColor());
    }

    function applyColorToModel(color) {
      var str = colorToString(color, vm.format);
      vm.ngModelCtrl.$setViewValue(str);
      updatePreview(str);
      syncView();
    }

    function replaceSwatches() {
      var next = normalizeSwatches(vm.swatches);
      var i;
      while (swatchCount > 0) {
        pickr.removeSwatch(swatchCount - 1);
        swatchCount -= 1;
      }
      for (i = 0; i < next.length; i += 1) {
        if (pickr.addSwatch(next[i])) {
          swatchCount += 1;
        }
      }
    }

    function syncView() {
      vm.isDisabled = vm.disabled === true;
      vm.isRequired = vm.required === true;
      vm.resolvedAriaLabel = hasText(vm.ariaLabel)
        ? vm.ariaLabel
        : DEFAULT_ARIA_LABEL;
      vm.describedByAttr = hasText(vm.describedBy) ? vm.describedBy : undefined;
      vm.dataDisabled = vm.isDisabled ? 'true' : undefined;
      vm.dataInvalid =
        vm.ngModelCtrl &&
        vm.ngModelCtrl.$invalid &&
        vm.ngModelCtrl.$dirty
          ? 'true'
          : undefined;
      vm.classes = geTv(geColorPickerTheme)({
        size: vm.size || 'md',
        disabled: vm.isDisabled,
      });
    }

    function updatePreview(color) {
      vm.previewColor = color || DEFAULT_COLOR;
      vm.previewStyle = { 'background-color': vm.previewColor };
    }

    function getTrigger() {
      return $element[0].querySelector('[data-ge-color-trigger]');
    }

    function throttleDelay() {
      var delay;
      if (vm.throttle == null || vm.throttle === '') {
        return DEFAULT_THROTTLE_MS;
      }
      delay = Number(vm.throttle);
      if (isNaN(delay) || delay < 0) {
        return DEFAULT_THROTTLE_MS;
      }
      return delay;
    }

    function representationFor(format) {
      var key = String(format || 'hex').toLowerCase();
      if (key === 'rgba') {
        return 'RGBA';
      }
      if (key === 'hsla') {
        return 'HSLA';
      }
      return 'HEXA';
    }

    function colorToString(color, format) {
      var key;
      if (!color) {
        return '';
      }
      key = String(format || 'hex').toLowerCase();
      if (key === 'rgba' && typeof color.toRGBA === 'function') {
        return color.toRGBA().toString(0);
      }
      if (key === 'hsla' && typeof color.toHSLA === 'function') {
        return color.toHSLA().toString(0);
      }
      if (typeof color.toHEXA === 'function') {
        return color.toHEXA().toString();
      }
      return '';
    }

    function normalizeSwatches(swatches) {
      if (!Array.isArray(swatches)) {
        return [];
      }
      return swatches.filter(function keepString(item) {
        return typeof item === 'string' && item !== '';
      });
    }

    function cancelPending() {
      if (pendingTimeout) {
        $timeout.cancel(pendingTimeout);
        pendingTimeout = null;
      }
    }

    function hasText(value) {
      return value !== undefined && value !== null && String(value) !== '';
    }

    function identity(value) {
      return value;
    }

    function readInitialColor() {
      var fromView = vm.ngModelCtrl.$viewValue;
      var expr;
      var fromParent;
      if (!isEmptyColor(fromView)) {
        return fromView;
      }
      expr = $element.attr('ng-model');
      if (expr && $scope.$parent) {
        fromParent = $scope.$parent.$eval(expr);
        if (!isEmptyColor(fromParent)) {
          return fromParent;
        }
      }
      return DEFAULT_COLOR;
    }

    function isEmptyColor(value) {
      return typeof value !== 'string' || value === '';
    }
  }
})();
