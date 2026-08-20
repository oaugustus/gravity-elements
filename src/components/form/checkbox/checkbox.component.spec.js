'use strict';

describe('geCheckbox', function () {
  var $compile;
  var $rootScope;
  var host;
  var appRoot;
  var geTv;
  var geCheckboxTheme;
  var injector;

  beforeEach(function () {
    appRoot = document.createElement('div');
    document.body.appendChild(appRoot);
    angular.bootstrap(appRoot, ['gravityElements']);

    injector = angular.element(appRoot).injector();
    $compile = injector.get('$compile');
    $rootScope = injector.get('$rootScope');
    geTv = injector.get('geTv');
    geCheckboxTheme = injector.get('geCheckboxTheme');

    host = document.createElement('div');
    appRoot.appendChild(host);
  });

  afterEach(function () {
    if (appRoot && appRoot.parentNode) {
      appRoot.parentNode.removeChild(appRoot);
    }
  });

  function compileCheckbox(html, scopeExt) {
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

  function getInput(compiled) {
    return compiled.element[0].querySelector('input[type="checkbox"]');
  }

  function getRoot(compiled) {
    return compiled.element.children()[0];
  }

  function userToggle(compiled) {
    var input = getInput(compiled);
    input.checked = !input.checked;
    // input[checkbox] do Angular escuta `change` e lê element.checked —
    // triggerHandler não dispara o default nativo (label retrigger) e é o
    // padrão da suíte (geCollapsible/geAlert).
    angular.element(input).triggerHandler('change');
    compiled.scope.$digest();
  }

  it('está registrado em gravityElements.components', function () {
    expect(injector.has('geCheckboxDirective')).toBe(true);
    expect(injector.has('geCheckboxTheme')).toBe(true);
  });

  it('$render reflete valor inicial true/false do modelo do consumidor', function () {
    var checked = compileCheckbox(
      '<ge-checkbox ng-model="valor" label="Aceito"></ge-checkbox>',
      { valor: true }
    );
    var unchecked = compileCheckbox(
      '<ge-checkbox ng-model="valor" label="Aceito"></ge-checkbox>',
      { valor: false }
    );

    expect(getInput(checked).checked).toBe(true);
    expect(getInput(unchecked).checked).toBe(false);
  });

  it('clicar no input chama $setViewValue e atualiza o modelo externo', function () {
    var compiled = compileCheckbox(
      '<ge-checkbox ng-model="valor" label="Aceito"></ge-checkbox>',
      { valor: false }
    );

    expect(compiled.scope.valor).toBe(false);
    userToggle(compiled);

    expect(compiled.scope.valor).toBe(true);
    expect(getInput(compiled).checked).toBe(true);

    userToggle(compiled);
    expect(compiled.scope.valor).toBe(false);
  });

  it('mudança do modelo externo após montagem reflete no input via $formatters/$render', function () {
    var compiled = compileCheckbox(
      '<ge-checkbox ng-model="valor" label="Aceito"></ge-checkbox>',
      { valor: false }
    );
    var input = getInput(compiled);

    expect(input.checked).toBe(false);

    compiled.scope.valor = true;
    compiled.scope.$digest();

    expect(getInput(compiled).checked).toBe(true);
    expect(compiled.element.isolateScope().vm.viewValue).toBe(true);
  });

  it('ng-required="true" com valor false deixa ngModelCtrl.$invalid e $error.required', function () {
    var compiled = compileCheckbox(
      '<form name="demoForm">' +
        '<ge-checkbox name="terms" ng-model="valor" ng-required="true" label="Aceito"></ge-checkbox>' +
        '</form>',
      { valor: false }
    );
    var checkbox = compiled.element[0].querySelector('ge-checkbox');
    var ngModelCtrl = angular.element(checkbox).controller('ngModel');

    expect(ngModelCtrl).toBeDefined();
    expect(ngModelCtrl.$invalid).toBe(true);
    expect(ngModelCtrl.$error.required).toBeTruthy();

    compiled.scope.valor = true;
    compiled.scope.$digest();

    expect(ngModelCtrl.$invalid).toBe(false);
    expect(ngModelCtrl.$error.required).toBeUndefined();
  });

  it('aplica defaultVariants (primary/list/md/start) via geTv no root', function () {
    var compiled = compileCheckbox(
      '<ge-checkbox ng-model="valor" label="Aceito"></ge-checkbox>',
      { valor: false }
    );
    var root = getRoot(compiled);
    var expected = geTv(geCheckboxTheme)({
      color: 'primary',
      size: 'md',
      variant: 'list',
      indicator: 'start',
      required: false,
      disabled: false,
      highlight: false,
      checked: false,
    });

    expect(root.className).toBe(expected.root);
    expect(root.className).toContain('relative');
    expect(root.className).toContain('flex');
    expect(getInput(compiled).className).toContain('appearance-none');
    expect(getInput(compiled).className).toContain('size-4');
  });

  it('escreve data-is-checked / data-is-disabled no DOM (não colide com BOOLEAN_ATTR)', function () {
    var compiled = compileCheckbox(
      '<ge-checkbox ng-model="valor" disabled="true" label="Aceito"></ge-checkbox>',
      { valor: true }
    );
    var root = getRoot(compiled);
    var input = getInput(compiled);

    expect(root.getAttribute('data-is-checked')).toBe('true');
    expect(root.getAttribute('data-is-disabled')).toBe('true');
    expect(input.getAttribute('data-is-checked')).toBe('true');
    expect(input.getAttribute('data-is-disabled')).toBe('true');
    expect(root.hasAttribute('data-checked')).toBe(false);
    expect(input.hasAttribute('data-checked')).toBe(false);
    expect(input.hasAttribute('data-disabled')).toBe(false);
  });

  it('indeterminate é propriedade nativa do input, independente do ngModel', function () {
    var compiled = compileCheckbox(
      '<ge-checkbox ng-model="valor" indeterminate="isIndeterminate" label="Parcial"></ge-checkbox>',
      { valor: false, isIndeterminate: true }
    );
    var input = getInput(compiled);

    expect(compiled.scope.valor).toBe(false);
    expect(input.checked).toBe(false);
    expect(input.indeterminate).toBe(true);
    expect(getRoot(compiled).getAttribute('data-is-indeterminate')).toBe('true');

    userToggle(compiled);

    expect(compiled.scope.valor).toBe(true);
    expect(getInput(compiled).indeterminate).toBe(false);
  });

  it('required="true" proxy aria-invalid/aria-required no input (pristine vs $dirty)', function () {
    var compiled = compileCheckbox(
      '<ge-checkbox ng-model="valor" required="true" label="Aceito"></ge-checkbox>',
      { valor: false }
    );
    var host = compiled.element[0];
    var input = getInput(compiled);
    var ngModelCtrl = compiled.element.controller('ngModel');

    expect(ngModelCtrl.$invalid).toBe(true);
    expect(ngModelCtrl.$pristine).toBe(true);
    expect(input.getAttribute('aria-invalid')).not.toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(host.getAttribute('aria-invalid')).toBe('true');
    expect(host.getAttribute('aria-required')).toBe('true');

    ngModelCtrl.$setDirty();
    compiled.scope.$digest();

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');

    compiled.scope.valor = true;
    compiled.scope.$digest();

    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(input.getAttribute('aria-required')).toBe('true');
  });

  it('ng-required="true" proxy aria-invalid/aria-required no input (pristine vs $dirty)', function () {
    var compiled = compileCheckbox(
      '<form name="demoForm">' +
        '<ge-checkbox name="terms" ng-model="valor" ng-required="true" label="Aceito"></ge-checkbox>' +
        '</form>',
      { valor: false }
    );
    var host = compiled.element[0].querySelector('ge-checkbox');
    var input = getInput(compiled);
    var ngModelCtrl = angular.element(host).controller('ngModel');

    expect(ngModelCtrl.$invalid).toBe(true);
    expect(ngModelCtrl.$pristine).toBe(true);
    expect(input.getAttribute('aria-invalid')).not.toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');
    expect(host.getAttribute('aria-invalid')).toBe('true');
    expect(host.getAttribute('aria-required')).toBe('true');

    ngModelCtrl.$setDirty();
    compiled.scope.$digest();

    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('aria-required')).toBe('true');

    compiled.scope.valor = true;
    compiled.scope.$digest();

    expect(ngModelCtrl.$invalid).toBe(false);
    expect(input.getAttribute('aria-invalid')).toBe('false');
    expect(input.getAttribute('aria-required')).toBe('true');
  });
});
