(function () {
  'use strict';

  /**
   * geCheckbox — caixa de seleção (Form).
   *
   * Paridade com Nuxt UI Checkbox v4.10.0 (theme/checkbox.ts + Checkbox.vue).
   * Primeiro componente de Form: ngModel customizado (§5.3) no host
   * (`<ge-checkbox ng-model="vm.aceito">`), valor boolean. $formatters /
   * $parsers identidade (boolean↔boolean) para manter o padrão dos próximos.
   *
   * `indeterminate` NÃO é valor do modelo — é HTMLInputElement.indeterminate
   * (propriedade de exibição nativa). Clique do usuário zera a flag visual
   * localmente; o binding `<` do pai só volta a valer se mudar de novo.
   *
   * Semântica: `<input type="checkbox">` nativo (spec §5.8), não o
   * CheckboxRoot/button do Reka. Root é sempre `<label>` sem `for` (o input
   * é descendente — associação implícita; `for` no ancestral do próprio
   * input faz `input.click()` nativo togglear duas vezes). No upstream,
   * `list` usa `<div>`+`<Label for>` e `card` usa `<Label>` na raiz — clique
   * na description também marca, divergência pequena e deliberada para um
   * único input no DOM, evitando ng-if+ngAnimate com dois roots.
   * `$isEmpty` no host trata `value !== true` como vazio, paridade com
   * input[checkbox] nativo do Angular (senão ng-required aceita `false`).
   *
   * Bindings da tabela §6 + extras da v4.10.0: `indicator`, `highlight`,
   * `icon`, `indeterminateIcon`, `describedBy` (gancho aria-describedby para
   * geFormField — decisão §5.4 em aberto). Omitidos: `as`, `trueValue`/
   * `falseValue`, `defaultValue`, `ui`/`class`, slots Vue label/description.
   * `name` no host é o atributo HTML nativo do ngModel/FormController.
   *
   * Ícone do indicador: `<i class="i-lucide-*">` direto (não `<ge-icon>`).
   * O host do geIcon é inline com default size-5, e o CSS do demo fixa
   * width/height 1em em .i-lucide-* — juntos deslocam o check pra
   * baseline e o overflow-hidden recorta (xs praticamente some).
   *
   * Interação: proxy `ng-model="vm.viewValue"` + `ng-change` no input
   * interno (ng-change do Angular não dispara em mudança programática, então
   * $render não entra em loop). O NgModelController do consumidor é o do
   * host (`require: ngModel`), não o do input interno.
   *
   * ARIA no input interno (não no host): o ngAria aplica aria-invalid/
   * aria-required no `<ge-checkbox>` (onde está o ng-model do consumidor),
   * mas o host não é focável — o leitor de tela anuncia o `<input>`. O
   * ngModel interno (`vm.viewValue`) não tem $validators.required, então o
   * ngAria deixaria aria-invalid="false" no input para sempre. Por isso
   * `aria-invalid` é atributo interpolado (não ng-attr): no post-link o
   * ngAria só recua se elem.attr('aria-invalid') já existir; ng-attr ainda
   * não materializou o atributo nesse momento. Valor = host $invalid &&
   * $dirty — não anunciar "inválido" em campo pristine (mesmo raciocínio
   * da spec §5.4). $touched no host nunca é setado (blur cai no input);
   * form.$submitted fica para geForm/geFormField (`require: '?^^form'`).
   * aria-required lê $validators.required (cobre required="true" e
   * ng-required), não vm.isRequired. O host continua com os attrs do ngAria.
   *
   * @param {string} [vm.label]
   * @param {string} [vm.description]
   * @param {string} [vm.color='primary'] - primary|secondary|success|info|warning|error|neutral
   * @param {string} [vm.size='md'] - xs|sm|md|lg|xl
   * @param {string} [vm.variant='list'] - list|card
   * @param {string} [vm.indicator='start'] - start|end|hidden
   * @param {boolean} [vm.indeterminate] - só visual (prop nativa)
   * @param {boolean} [vm.disabled]
   * @param {boolean} [vm.required] - asterisk do tema + required no input
   * @param {boolean} [vm.highlight] - ring de cor como foco permanente
   * @param {string} [vm.icon='i-lucide-check']
   * @param {string} [vm.indeterminateIcon='i-lucide-minus']
   * @param {string} [vm.describedBy] - aria-describedby no input interno
   */
  angular.module('gravityElements.form').component('geCheckbox', {
    template:
      '<label class="{{ vm.classes.root }}"' +
      '  ng-attr-data-is-checked="{{ vm.dataChecked }}"' +
      '  ng-attr-data-is-disabled="{{ vm.dataDisabled }}"' +
      '  ng-attr-data-is-indeterminate="{{ vm.dataIndeterminate }}">' +
      '  <div class="{{ vm.classes.container }}">' +
      '    <span class="relative inline-flex shrink-0 overflow-hidden rounded">' +
      '      <input type="checkbox"' +
      '        id="{{ vm.inputId }}"' +
      '        class="{{ vm.classes.base }}"' +
      '        ng-model="vm.viewValue"' +
      '        ng-change="vm.onChange()"' +
      '        ng-disabled="vm.isDisabled"' +
      '        aria-invalid="{{ !!(vm.ngModelCtrl.$invalid && vm.ngModelCtrl.$dirty) }}"' +
      '        ng-attr-aria-required="{{ vm.ngModelCtrl.$validators.required ? \'true\' : undefined }}"' +
      '        ng-attr-aria-describedby="{{ vm.describedByAttr }}"' +
      '        ng-attr-data-is-checked="{{ vm.dataChecked }}"' +
      '        ng-attr-data-is-disabled="{{ vm.dataDisabled }}"' +
      '        ng-attr-data-is-indeterminate="{{ vm.dataIndeterminate }}">' +
      '      <span ng-if="vm.showIndicator" class="{{ vm.classes.indicator }}">' +
      '        <i class="{{ vm.resolvedIcon }} {{ vm.classes.icon }}" aria-hidden="true"></i>' +
      '      </span>' +
      '    </span>' +
      '  </div>' +
      '  <div ng-if="vm.hasText" class="{{ vm.classes.wrapper }}">' +
      '    <span ng-if="vm.hasLabel" class="{{ vm.classes.label }}">{{ vm.label }}</span>' +
      '    <p ng-if="vm.hasDescription" class="{{ vm.classes.description }}">{{ vm.description }}</p>' +
      '  </div>' +
      '</label>',
    controllerAs: 'vm',
    require: { ngModelCtrl: 'ngModel' },
    bindings: {
      label: '@',
      description: '@',
      color: '@',
      size: '@',
      variant: '@',
      indicator: '@',
      indeterminate: '<',
      disabled: '<',
      required: '<',
      highlight: '<',
      icon: '@',
      indeterminateIcon: '@',
      describedBy: '@',
    },
    controller: CheckboxController,
  });

  CheckboxController.$inject = ['$element', 'geTv', 'geCheckboxTheme', 'geId'];

  function CheckboxController($element, geTv, geCheckboxTheme, geId) {
    var vm = this;
    vm.inputId = geId.next('ge-checkbox');
    vm.classes = {};
    vm.viewValue = false;
    vm.userClearedIndeterminate = false;
    vm.$onInit = onInit;
    vm.$onChanges = onChanges;
    vm.onChange = onChange;

    function onInit() {
      // Paridade com input[type=checkbox] do Angular 1.8: só `true` preenche
      // o required. O $isEmpty default NÃO considera `false` vazio, então
      // ng-required no host passaria com desmarcado.
      vm.ngModelCtrl.$isEmpty = isUnchecked;
      vm.ngModelCtrl.$render = renderValue;
      vm.ngModelCtrl.$formatters.push(identity);
      vm.ngModelCtrl.$parsers.push(identity);
      syncView();
    }

    function onChanges(changes) {
      if (changes.indeterminate && !changes.indeterminate.isFirstChange()) {
        vm.userClearedIndeterminate = false;
      }
      syncView();
    }

    function renderValue() {
      vm.viewValue = !!vm.ngModelCtrl.$viewValue;
      syncView();
    }

    function onChange() {
      if (vm.isDisabled) {
        return;
      }
      // Clique nativo em indeterminate marca checked=true e NÃO limpa
      // a propriedade sozinho — zerar só a exibição, modelo continua boolean.
      vm.userClearedIndeterminate = true;
      vm.ngModelCtrl.$setViewValue(!!vm.viewValue);
      syncView();
    }

    function syncView() {
      var resolvedIndicator = vm.indicator || 'start';
      vm.isChecked = !!vm.viewValue;
      vm.isDisabled = vm.disabled === true;
      vm.isRequired = vm.required === true;
      vm.isIndeterminate =
        vm.indeterminate === true && !vm.userClearedIndeterminate;
      vm.hasLabel = hasText(vm.label);
      vm.hasDescription = hasText(vm.description);
      vm.hasText = vm.hasLabel || vm.hasDescription;
      vm.showIndicator =
        (vm.isChecked || vm.isIndeterminate) && resolvedIndicator !== 'hidden';
      vm.resolvedIcon = vm.isIndeterminate
        ? vm.indeterminateIcon || 'i-lucide-minus'
        : vm.icon || 'i-lucide-check';
      vm.describedByAttr = hasText(vm.describedBy) ? vm.describedBy : undefined;
      vm.dataChecked = vm.isChecked ? 'true' : undefined;
      vm.dataDisabled = vm.isDisabled ? 'true' : undefined;
      vm.dataIndeterminate = vm.isIndeterminate ? 'true' : undefined;
      vm.classes = geTv(geCheckboxTheme)({
        color: vm.color || 'primary',
        size: vm.size || 'md',
        variant: vm.variant || 'list',
        indicator: resolvedIndicator,
        required: vm.isRequired,
        disabled: vm.isDisabled,
        highlight: vm.highlight === true,
        checked: vm.isChecked,
      });
      applyInputProps();
    }

    function applyInputProps() {
      var input = $element[0].querySelector('input[type="checkbox"]');
      if (!input) {
        return;
      }
      input.indeterminate = vm.isIndeterminate;
      input.required = vm.isRequired;
    }

    function hasText(value) {
      return value !== undefined && value !== null && String(value) !== '';
    }

    function identity(value) {
      return value;
    }

    function isUnchecked(value) {
      return value !== true;
    }
  }
})();
