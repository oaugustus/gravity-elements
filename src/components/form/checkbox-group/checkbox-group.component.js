(function () {
  'use strict';

  /**
   * geCheckboxGroup — grupo de caixas de seleção (Form).
   *
   * Paridade com Nuxt UI CheckboxGroup v4.10.0 (theme/checkbox-group.ts +
   * CheckboxGroup.vue). ngModel customizado (§5.3) no host
   * (`<ge-checkbox-group ng-model="vm.selecionados">`), valor **array** de
   * values selecionados (diferente do geCheckbox boolean).
   *
   * Upstream (v4.10.0) reusa `UCheckbox` internamente. Aqui **não** aninhamos
   * `<ge-checkbox>`: o geCheckbox exige ngModel boolean (N controles extras
   * no FormController pai) e interpola aria-invalid/aria-required em cada
   * input — o que a §5.15 proíbe no grupo. Markup de item copiado da
   * estrutura do checkbox; classes via `geTv(geCheckboxTheme)`. Quando
   * `variant === 'table'`, os itens usam o tema do checkbox em `list` (o
   * chrome de tabela vive no slot `item` deste grupo).
   *
   * Binding da lista: `options` (tabela §6). Upstream chama isso de `items`.
   * $formatters/$parsers normalizam não-array → `[]` (não identidade pura).
   * `$isEmpty` trata array vazio como vazio (o default do Angular 1.8 não
   * trata `[]` como empty — ng-required passaria). Ordem do modelo: **ordem
   * de exibição de `options`**, não ordem de marcação.
   *
   * ARIA (§5.8 + §5.15): invalidade/obrigatoriedade no `<fieldset
   * role="group">`, não em cada input. aria-invalid interpolado com gate
   * `$invalid && $dirty` (mesmo raciocínio do geCheckbox / §5.4).
   * aria-required via `$validators.required` (cobre `required` e
   * `ng-required`). `legend` (extra da v4.10.0, ausente da tabela §6)
   * gera `aria-labelledby` no fieldset. Sem `aria-invalid`/`aria-required`
   * nos inputs das opções. O host continua com os attrs do ngAria.
   *
   * Interação: `ng-checked` + `ng-click` nos inputs (sem ng-model interno,
   * para não registrar N NgModelControllers no form pai). ng-click lê o
   * estado anterior (`!item.checked`) — funciona com clique nativo e com
   * triggerHandler dos testes.
   *
   * Bindings da tabela §6 + extras da v4.10.0: `legend`, `disabled`,
   * `required`, `highlight`, `indicator`, `icon`, `describedBy`, `variant`
   * inclui `'table'`. Omitidos: `as`, `loop`, `defaultValue`, `valueKey`/
   * `labelKey`/`descriptionKey`, `ui`/`class`, slots Vue.
   * `name` no host é o atributo HTML nativo do ngModel/FormController.
   *
   * @param {Array<string|number|{value:*, label:string, description:string, disabled:boolean}>} [vm.options]
   * @param {string} [vm.orientation='vertical'] - horizontal|vertical
   * @param {string} [vm.color='primary'] - primary|secondary|success|info|warning|error|neutral
   * @param {string} [vm.size='md'] - xs|sm|md|lg|xl
   * @param {string} [vm.variant='list'] - list|card|table
   * @param {string} [vm.legend] - texto do <legend> (upstream; tabela §6 não listava)
   * @param {string} [vm.indicator='start'] - start|end|hidden (propaga aos itens)
   * @param {boolean} [vm.disabled] - desabilita o grupo inteiro
   * @param {boolean} [vm.required] - asterisk no legend; ng-required no host valida o array
   * @param {boolean} [vm.highlight] - ring de cor como foco permanente (propaga)
   * @param {string} [vm.icon='i-lucide-check']
   * @param {string} [vm.describedBy] - aria-describedby no fieldset (gancho geFormField)
   */
  angular.module('gravityElements.form').component('geCheckboxGroup', {
    template:
      '<div class="{{ vm.classes.root }}">' +
      '  <fieldset class="{{ vm.classes.fieldset }}"' +
      '    role="group"' +
      '    aria-invalid="{{ !!(vm.ngModelCtrl.$invalid && vm.ngModelCtrl.$dirty) }}"' +
      '    ng-attr-aria-required="{{ vm.ngModelCtrl.$validators.required ? \'true\' : undefined }}"' +
      '    ng-attr-aria-labelledby="{{ vm.legendIdAttr }}"' +
      '    ng-attr-aria-describedby="{{ vm.describedByAttr }}"' +
      '    ng-attr-data-is-disabled="{{ vm.dataDisabled }}">' +
      '    <legend ng-if="vm.hasLegend" id="{{ vm.legendId }}" class="{{ vm.classes.legend }}">' +
      '      {{ vm.legend }}' +
      '    </legend>' +
      '    <div ng-repeat="item in vm.items track by item.id"' +
      '      class="{{ vm.classes.item }}"' +
      '      ng-attr-data-is-checked="{{ item.dataChecked }}"' +
      '      ng-attr-data-is-disabled="{{ item.dataDisabled }}">' +
      '      <label class="{{ item.classes.root }}"' +
      '        ng-attr-data-is-checked="{{ item.dataChecked }}"' +
      '        ng-attr-data-is-disabled="{{ item.dataDisabled }}">' +
      '        <div class="{{ item.classes.container }}">' +
      '          <span class="relative inline-flex shrink-0 overflow-hidden rounded">' +
      '            <input type="checkbox"' +
      '              id="{{ item.inputId }}"' +
      '              class="{{ item.classes.base }}"' +
      '              ng-checked="item.checked"' +
      '              ng-click="vm.onToggle(item, $event)"' +
      '              ng-disabled="item.isDisabled"' +
      '              ng-attr-data-is-checked="{{ item.dataChecked }}"' +
      '              ng-attr-data-is-disabled="{{ item.dataDisabled }}">' +
      '            <span ng-if="item.showIndicator" class="{{ item.classes.indicator }}">' +
      '              <i class="{{ item.resolvedIcon }} {{ item.classes.icon }}" aria-hidden="true"></i>' +
      '            </span>' +
      '          </span>' +
      '        </div>' +
      '        <div ng-if="item.hasText" class="{{ item.classes.wrapper }}">' +
      '          <span ng-if="item.hasLabel" class="{{ item.classes.label }}">{{ item.label }}</span>' +
      '          <p ng-if="item.hasDescription" class="{{ item.classes.description }}">{{ item.description }}</p>' +
      '        </div>' +
      '      </label>' +
      '    </div>' +
      '  </fieldset>' +
      '</div>',
    controllerAs: 'vm',
    require: { ngModelCtrl: 'ngModel' },
    bindings: {
      options: '<',
      orientation: '@',
      color: '@',
      size: '@',
      variant: '@',
      legend: '@',
      indicator: '@',
      disabled: '<',
      required: '<',
      highlight: '<',
      icon: '@',
      describedBy: '@',
    },
    controller: CheckboxGroupController,
  });

  CheckboxGroupController.$inject = [
    'geTv',
    'geCheckboxTheme',
    'geCheckboxGroupTheme',
    'geId',
  ];

  function CheckboxGroupController(
    geTv,
    geCheckboxTheme,
    geCheckboxGroupTheme,
    geId
  ) {
    var vm = this;
    vm.groupId = geId.next('ge-checkbox-group');
    vm.legendId = vm.groupId + '-legend';
    vm.classes = {};
    vm.items = [];
    vm.$onInit = onInit;
    vm.$onChanges = onChanges;
    vm.onToggle = onToggle;

    function onInit() {
      vm.ngModelCtrl.$isEmpty = isEmptySelection;
      vm.ngModelCtrl.$render = renderValue;
      vm.ngModelCtrl.$formatters.push(toArray);
      vm.ngModelCtrl.$parsers.push(toArray);
      syncView();
    }

    function onChanges() {
      if (!vm.ngModelCtrl) {
        return;
      }
      syncView();
    }

    function renderValue() {
      syncView();
    }

    function onToggle(item, event) {
      var selected;
      var idx;
      var wantChecked;
      if (!item || item.isDisabled) {
        if (event && event.preventDefault) {
          event.preventDefault();
        }
        return;
      }
      wantChecked = !item.checked;
      selected = toArray(vm.ngModelCtrl.$viewValue);
      idx = selected.indexOf(item.value);
      if (wantChecked && idx === -1) {
        selected.push(item.value);
      } else if (!wantChecked && idx !== -1) {
        selected.splice(idx, 1);
      }
      vm.ngModelCtrl.$setViewValue(orderByOptions(selected));
      syncView();
    }

    function syncView() {
      var selected = selectedValues();
      var resolvedIndicator = vm.indicator || 'start';
      var checkboxVariant =
        vm.variant === 'table' ? 'list' : vm.variant || 'list';
      var normalized = normalizeOptions(vm.options);
      vm.isDisabled = vm.disabled === true;
      vm.isRequired = vm.required === true;
      vm.hasLegend = hasText(vm.legend);
      vm.legendIdAttr = vm.hasLegend ? vm.legendId : undefined;
      vm.describedByAttr = hasText(vm.describedBy) ? vm.describedBy : undefined;
      vm.dataDisabled = vm.isDisabled ? 'true' : undefined;
      vm.classes = geTv(geCheckboxGroupTheme)({
        color: vm.color || 'primary',
        size: vm.size || 'md',
        variant: vm.variant || 'list',
        orientation: vm.orientation || 'vertical',
        required: vm.isRequired,
        disabled: vm.isDisabled,
      });
      vm.items = normalized.map(function mapItem(opt, index) {
        var checked = selected.indexOf(opt.value) !== -1;
        var itemDisabled = vm.isDisabled || opt.disabled;
        var hasLabel = hasText(opt.label);
        var hasDescription = hasText(opt.description);
        return {
          id: opt.id,
          inputId: vm.groupId + '-item-' + index,
          value: opt.value,
          label: opt.label,
          description: opt.description,
          checked: checked,
          isDisabled: itemDisabled,
          hasLabel: hasLabel,
          hasDescription: hasDescription,
          hasText: hasLabel || hasDescription,
          showIndicator: checked && resolvedIndicator !== 'hidden',
          resolvedIcon: vm.icon || 'i-lucide-check',
          dataChecked: checked ? 'true' : undefined,
          dataDisabled: itemDisabled ? 'true' : undefined,
          classes: geTv(geCheckboxTheme)({
            color: vm.color || 'primary',
            size: vm.size || 'md',
            variant: checkboxVariant,
            indicator: resolvedIndicator,
            required: false,
            disabled: itemDisabled,
            highlight: vm.highlight === true,
            checked: checked,
          }),
        };
      });
    }

    function normalizeOptions(options) {
      if (!Array.isArray(options)) {
        return [];
      }
      return options.map(function mapOption(raw, index) {
        if (raw === null || raw === undefined) {
          return {
            id: vm.groupId + ':empty:' + index,
            value: undefined,
            label: undefined,
            description: undefined,
            disabled: false,
          };
        }
        if (typeof raw === 'string' || typeof raw === 'number') {
          return {
            id: vm.groupId + ':' + raw + ':' + index,
            value: String(raw),
            label: String(raw),
            description: undefined,
            disabled: false,
          };
        }
        return {
          id: vm.groupId + ':' + String(raw.value) + ':' + index,
          value: raw.value,
          label: raw.label,
          description: raw.description,
          disabled: raw.disabled === true,
        };
      });
    }

    function orderByOptions(selected) {
      return vm.items
        .map(function mapValue(item) {
          return item.value;
        })
        .filter(function isSelected(value) {
          return selected.indexOf(value) !== -1;
        });
    }

    function selectedValues() {
      if (!vm.ngModelCtrl) {
        return [];
      }
      return toArray(vm.ngModelCtrl.$viewValue);
    }

    function toArray(value) {
      return Array.isArray(value) ? value.slice() : [];
    }

    function isEmptySelection(value) {
      return !Array.isArray(value) || value.length === 0;
    }

    function hasText(value) {
      return value !== undefined && value !== null && String(value) !== '';
    }
  }
})();
