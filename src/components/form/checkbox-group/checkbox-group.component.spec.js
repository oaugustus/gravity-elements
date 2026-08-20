'use strict';

describe('geCheckboxGroup', function () {
  var $compile;
  var $rootScope;
  var host;
  var appRoot;
  var geTv;
  var geCheckboxGroupTheme;
  var injector;
  var defaultOptions;

  beforeEach(function () {
    appRoot = document.createElement('div');
    document.body.appendChild(appRoot);
    angular.bootstrap(appRoot, ['gravityElements']);

    injector = angular.element(appRoot).injector();
    $compile = injector.get('$compile');
    $rootScope = injector.get('$rootScope');
    geTv = injector.get('geTv');
    geCheckboxGroupTheme = injector.get('geCheckboxGroupTheme');

    host = document.createElement('div');
    appRoot.appendChild(host);

    defaultOptions = [
      { value: 'a', label: 'Alpha' },
      { value: 'b', label: 'Bravo' },
      { value: 'c', label: 'Charlie' },
    ];
  });

  afterEach(function () {
    if (appRoot && appRoot.parentNode) {
      appRoot.parentNode.removeChild(appRoot);
    }
  });

  function compileGroup(html, scopeExt) {
    var scope = $rootScope.$new();
    if (scopeExt) {
      Object.keys(scopeExt).forEach(function (key) {
        scope[key] = scopeExt[key];
      });
    }
    var element = $compile(html)(scope);
    host.appendChild(element[0]);
    scope.$digest();
    return { element: element, scope: scope };
  }

  function getFieldset(compiled) {
    return compiled.element[0].querySelector('fieldset');
  }

  function getInputs(compiled) {
    return compiled.element[0].querySelectorAll('input[type="checkbox"]');
  }

  function getGroupElement(compiled) {
    if (compiled.element[0].tagName.toLowerCase() === 'ge-checkbox-group') {
      return compiled.element;
    }
    return angular.element(
      compiled.element[0].querySelector('ge-checkbox-group')
    );
  }

  function getInputByValue(compiled, value) {
    var vm = getGroupElement(compiled).isolateScope().vm;
    var inputs = getInputs(compiled);
    var i;
    for (i = 0; i < vm.items.length; i += 1) {
      if (vm.items[i].value === value) {
        return inputs[i];
      }
    }
    return null;
  }

  function userToggle(compiled, value) {
    var input = getInputByValue(compiled, value);
    angular.element(input).triggerHandler('click');
    compiled.scope.$digest();
  }

  function groupHost(compiled) {
    if (compiled.element[0].tagName.toLowerCase() === 'ge-checkbox-group') {
      return compiled.element[0];
    }
    return compiled.element[0].querySelector('ge-checkbox-group');
  }

  it('está registrado em gravityElements.components', function () {
    expect(injector.has('geCheckboxGroupDirective')).toBe(true);
    expect(injector.has('geCheckboxGroupTheme')).toBe(true);
  });

  it('$render reflete valor inicial array do modelo do consumidor', function () {
    var compiled = compileGroup(
      '<ge-checkbox-group ng-model="valor" options="options"></ge-checkbox-group>',
      { valor: ['a'], options: defaultOptions }
    );
    var inputs = getInputs(compiled);

    expect(inputs.length).toBe(3);
    expect(inputs[0].checked).toBe(true);
    expect(inputs[1].checked).toBe(false);
    expect(inputs[2].checked).toBe(false);
  });

  it('clicar no input chama $setViewValue e atualiza o modelo externo', function () {
    var compiled = compileGroup(
      '<ge-checkbox-group ng-model="valor" options="options"></ge-checkbox-group>',
      { valor: [], options: defaultOptions }
    );

    expect(compiled.scope.valor).toEqual([]);
    userToggle(compiled, 'a');

    expect(compiled.scope.valor).toEqual(['a']);
    expect(getInputByValue(compiled, 'a').checked).toBe(true);

    userToggle(compiled, 'a');
    expect(compiled.scope.valor).toEqual([]);
  });

  it('mudança do modelo externo após montagem reflete nos inputs via $formatters/$render', function () {
    var compiled = compileGroup(
      '<ge-checkbox-group ng-model="valor" options="options"></ge-checkbox-group>',
      { valor: ['a'], options: defaultOptions }
    );

    expect(getInputByValue(compiled, 'a').checked).toBe(true);
    expect(getInputByValue(compiled, 'b').checked).toBe(false);

    compiled.scope.valor = ['b'];
    compiled.scope.$digest();

    expect(getInputByValue(compiled, 'a').checked).toBe(false);
    expect(getInputByValue(compiled, 'b').checked).toBe(true);
  });

  it('ng-required="true" com array vazio deixa ngModelCtrl.$invalid e $error.required', function () {
    var compiled = compileGroup(
      '<form name="demoForm">' +
        '<ge-checkbox-group name="prefs" ng-model="valor" ng-required="true" options="options"></ge-checkbox-group>' +
        '</form>',
      { valor: [], options: defaultOptions }
    );
    var ngModelCtrl = angular.element(groupHost(compiled)).controller('ngModel');

    expect(ngModelCtrl).toBeDefined();
    expect(ngModelCtrl.$invalid).toBe(true);
    expect(ngModelCtrl.$error.required).toBeTruthy();

    compiled.scope.valor = ['a'];
    compiled.scope.$digest();

    expect(ngModelCtrl.$invalid).toBe(false);
    expect(ngModelCtrl.$error.required).toBeUndefined();
  });

  it('seleção múltipla reflete o array na ordem de exibição das opções', function () {
    var compiled = compileGroup(
      '<ge-checkbox-group ng-model="valor" options="options"></ge-checkbox-group>',
      { valor: [], options: defaultOptions }
    );

    userToggle(compiled, 'a');
    userToggle(compiled, 'c');
    expect(compiled.scope.valor).toEqual(['a', 'c']);

    userToggle(compiled, 'a');
    expect(compiled.scope.valor).toEqual(['c']);

    userToggle(compiled, 'b');
    expect(compiled.scope.valor).toEqual(['b', 'c']);
  });

  it('required="true" aplica aria-invalid/aria-required no fieldset, não nos inputs (pristine vs $dirty)', function () {
    var compiled = compileGroup(
      '<ge-checkbox-group ng-model="valor" required="true" options="options" legend="Tema"></ge-checkbox-group>',
      { valor: [], options: defaultOptions }
    );
    var fieldset = getFieldset(compiled);
    var inputs = getInputs(compiled);
    var ngModelCtrl = compiled.element.controller('ngModel');
    var i;

    expect(fieldset.getAttribute('role')).toBe('group');
    expect(ngModelCtrl.$invalid).toBe(true);
    expect(ngModelCtrl.$pristine).toBe(true);
    expect(fieldset.getAttribute('aria-invalid')).not.toBe('true');
    expect(fieldset.getAttribute('aria-required')).toBe('true');
    expect(fieldset.getAttribute('aria-labelledby')).toBeTruthy();

    for (i = 0; i < inputs.length; i += 1) {
      expect(inputs[i].getAttribute('aria-invalid')).not.toBe('true');
      expect(inputs[i].hasAttribute('aria-required')).toBe(false);
    }

    ngModelCtrl.$setDirty();
    compiled.scope.$digest();

    expect(fieldset.getAttribute('aria-invalid')).toBe('true');
    expect(fieldset.getAttribute('aria-required')).toBe('true');
    for (i = 0; i < inputs.length; i += 1) {
      expect(inputs[i].getAttribute('aria-invalid')).not.toBe('true');
      expect(inputs[i].hasAttribute('aria-required')).toBe(false);
    }

    compiled.scope.valor = ['a'];
    compiled.scope.$digest();

    expect(fieldset.getAttribute('aria-invalid')).toBe('false');
    expect(fieldset.getAttribute('aria-required')).toBe('true');
  });

  it('ng-required="true" aplica aria-invalid/aria-required no fieldset, não nos inputs (pristine vs $dirty)', function () {
    var compiled = compileGroup(
      '<form name="demoForm">' +
        '<ge-checkbox-group name="prefs" ng-model="valor" ng-required="true" options="options"></ge-checkbox-group>' +
        '</form>',
      { valor: [], options: defaultOptions }
    );
    var hostEl = groupHost(compiled);
    var fieldset = getFieldset(compiled);
    var inputs = getInputs(compiled);
    var ngModelCtrl = angular.element(hostEl).controller('ngModel');
    var i;

    expect(ngModelCtrl.$invalid).toBe(true);
    expect(ngModelCtrl.$pristine).toBe(true);
    expect(fieldset.getAttribute('aria-invalid')).not.toBe('true');
    expect(fieldset.getAttribute('aria-required')).toBe('true');
    expect(hostEl.getAttribute('aria-invalid')).toBe('true');
    expect(hostEl.getAttribute('aria-required')).toBe('true');

    for (i = 0; i < inputs.length; i += 1) {
      expect(inputs[i].getAttribute('aria-invalid')).not.toBe('true');
      expect(inputs[i].hasAttribute('aria-required')).toBe(false);
    }

    ngModelCtrl.$setDirty();
    compiled.scope.$digest();

    expect(fieldset.getAttribute('aria-invalid')).toBe('true');
    for (i = 0; i < inputs.length; i += 1) {
      expect(inputs[i].getAttribute('aria-invalid')).not.toBe('true');
    }

    compiled.scope.valor = ['a'];
    compiled.scope.$digest();

    expect(ngModelCtrl.$invalid).toBe(false);
    expect(fieldset.getAttribute('aria-invalid')).toBe('false');
    expect(fieldset.getAttribute('aria-required')).toBe('true');
  });

  it('aplica defaultVariants (primary/list/md/vertical) via geTv no fieldset', function () {
    var compiled = compileGroup(
      '<ge-checkbox-group ng-model="valor" options="options"></ge-checkbox-group>',
      { valor: [], options: defaultOptions }
    );
    var fieldset = getFieldset(compiled);
    var expected = geTv(geCheckboxGroupTheme)({
      color: 'primary',
      size: 'md',
      variant: 'list',
      orientation: 'vertical',
      required: false,
      disabled: false,
    });

    expect(fieldset.className).toBe(expected.fieldset);
    expect(fieldset.className).toContain('flex-col');
    expect(fieldset.className).toContain('gap-y-1');
  });

  it('escreve data-is-checked / data-is-disabled no DOM (não colide com BOOLEAN_ATTR)', function () {
    var compiled = compileGroup(
      '<ge-checkbox-group ng-model="valor" options="options" disabled="true"></ge-checkbox-group>',
      { valor: ['a'], options: defaultOptions }
    );
    var item = compiled.element[0].querySelector('[data-is-checked]');
    var input = getInputByValue(compiled, 'a');
    var fieldset = getFieldset(compiled);

    expect(item.getAttribute('data-is-checked')).toBe('true');
    expect(item.getAttribute('data-is-disabled')).toBe('true');
    expect(input.getAttribute('data-is-checked')).toBe('true');
    expect(input.getAttribute('data-is-disabled')).toBe('true');
    expect(fieldset.getAttribute('data-is-disabled')).toBe('true');
    expect(item.hasAttribute('data-checked')).toBe(false);
    expect(input.hasAttribute('data-checked')).toBe(false);
    expect(input.hasAttribute('data-disabled')).toBe(false);
  });
});
