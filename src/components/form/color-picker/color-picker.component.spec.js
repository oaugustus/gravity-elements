'use strict';

describe('geColorPicker', function () {
  var $compile;
  var $rootScope;
  var $timeout;
  var host;
  var appRoot;
  var geTv;
  var geColorPickerTheme;
  var injector;

  beforeEach(function () {
    appRoot = document.createElement('div');
    document.body.appendChild(appRoot);
    angular.bootstrap(appRoot, ['gravityElements']);

    injector = angular.element(appRoot).injector();
    $compile = injector.get('$compile');
    $rootScope = injector.get('$rootScope');
    $timeout = injector.get('$timeout');
    geTv = injector.get('geTv');
    geColorPickerTheme = injector.get('geColorPickerTheme');

    host = document.createElement('div');
    appRoot.appendChild(host);
  });

  afterEach(function () {
    var leftover;
    var i;
    if (appRoot) {
      angular.element(appRoot).scope().$destroy();
      if (appRoot.parentNode) {
        appRoot.parentNode.removeChild(appRoot);
      }
    }
    leftover = document.querySelectorAll('.pcr-app');
    for (i = 0; i < leftover.length; i += 1) {
      if (leftover[i].parentNode) {
        leftover[i].parentNode.removeChild(leftover[i]);
      }
    }
  });

  function compilePicker(html, scopeExt) {
    var scope = $rootScope.$new();
    var element;
    if (scopeExt) {
      Object.keys(scopeExt).forEach(function (key) {
        scope[key] = scopeExt[key];
      });
    }
    element = $compile(html)(scope);
    host.appendChild(element[0]);
    scope.$digest();
    return { element: element, scope: scope };
  }

  function pickerHost(compiled) {
    if (compiled.element[0].tagName.toLowerCase() === 'ge-color-picker') {
      return compiled.element;
    }
    return angular.element(
      compiled.element[0].querySelector('ge-color-picker')
    );
  }

  function getVm(compiled) {
    return pickerHost(compiled).isolateScope().vm;
  }

  function getTrigger(compiled) {
    return compiled.element[0].querySelector('[data-ge-color-trigger]');
  }

  function getPreview(compiled) {
    return compiled.element[0].querySelector('[data-ge-color-preview]');
  }

  function flushTimeout() {
    try {
      $timeout.flush();
    } catch (err) {
      // flush lança se não há deferred — ok em testes sem throttle pendente
    }
  }

  function whenPickrReady(compiled, fn) {
    var vm = getVm(compiled);
    if (vm.pickrReady) {
      fn();
      return;
    }
    vm.pickr.on('init', function onInitReady() {
      compiled.scope.$digest();
      fn();
    });
  }

  function simulatePickrChange(compiled, colorStr) {
    var vm = getVm(compiled);
    var root;
    var buttons;
    expect(vm.pickr).toBeDefined();
    expect(vm.pickr.addSwatch(colorStr)).toBe(true);
    // Escopo à instância sob teste: cada Pickr.create() anexa um .pcr-app
    // em document.body que sobrevive a hide(); query em document inteiro
    // pode clicar o swatch de outro painel residual.
    root = vm.pickr.getRoot();
    expect(root.app).toBeDefined();
    buttons = root.app.querySelectorAll('.pcr-swatches button');
    expect(buttons.length).toBeGreaterThan(0);
    buttons[buttons.length - 1].click();
    flushTimeout();
    compiled.scope.$digest();
  }

  it('está registrado em gravityElements.components', function () {
    expect(injector.has('geColorPickerDirective')).toBe(true);
    expect(injector.has('geColorPickerTheme')).toBe(true);
  });

  it('$render reflete valor inicial hex do modelo do consumidor', function (done) {
    var compiled = compilePicker(
      '<ge-color-picker ng-model="valor" throttle="0"></ge-color-picker>',
      { valor: '#00C16A' }
    );
    whenPickrReady(compiled, function () {
      var vm = getVm(compiled);
      expect(vm.previewColor.toLowerCase()).toBe('#00c16a');
      expect(getPreview(compiled).style.backgroundColor).toBeTruthy();
      expect(vm.pickr).toBeDefined();
      expect(vm.pickr.getColor().toHEXA().toString().toLowerCase()).toBe(
        '#00c16a'
      );
      done();
    });
  });

  it('interação do usuário (change do Pickr) chama $setViewValue e atualiza o modelo', function (done) {
    var compiled = compilePicker(
      '<ge-color-picker ng-model="valor" throttle="0"></ge-color-picker>',
      { valor: '#000000' }
    );
    whenPickrReady(compiled, function () {
      simulatePickrChange(compiled, '#FF0000');
      expect(compiled.scope.valor.toLowerCase()).toBe('#ff0000');
      expect(getVm(compiled).previewColor.toLowerCase()).toBe('#ff0000');
      done();
    });
  });

  it('mudança do modelo externo após montagem reflete na preview e no Pickr', function (done) {
    var compiled = compilePicker(
      '<ge-color-picker ng-model="valor" throttle="0"></ge-color-picker>',
      { valor: '#000000' }
    );
    whenPickrReady(compiled, function () {
      var vm = getVm(compiled);
      expect(vm.previewColor.toLowerCase()).toBe('#000000');

      compiled.scope.valor = '#00C16A';
      compiled.scope.$digest();

      expect(getVm(compiled).previewColor.toLowerCase()).toBe('#00c16a');
      expect(getPreview(compiled).getAttribute('style')).toContain(
        'background-color'
      );
      expect(vm.pickr.getColor().toHEXA().toString().toLowerCase()).toBe(
        '#00c16a'
      );
      done();
    });
  });

  it('ng-required="true" com valor vazio deixa ngModelCtrl.$invalid e $error.required', function () {
    var compiled = compilePicker(
      '<form name="demoForm">' +
        '<ge-color-picker name="accent" ng-model="valor" ng-required="true" throttle="0"></ge-color-picker>' +
        '</form>',
      { valor: '' }
    );
    var ngModelCtrl = pickerHost(compiled).controller('ngModel');

    expect(ngModelCtrl).toBeDefined();
    expect(ngModelCtrl.$invalid).toBe(true);
    expect(ngModelCtrl.$error.required).toBeTruthy();

    compiled.scope.valor = '#00C16A';
    compiled.scope.$digest();

    expect(ngModelCtrl.$invalid).toBe(false);
    expect(ngModelCtrl.$error.required).toBeUndefined();
  });

  it('inicializa o Pickr no $onInit e chama destroy no $onDestroy', function () {
    var compiled = compilePicker(
      '<ge-color-picker ng-model="valor" throttle="0"></ge-color-picker>',
      { valor: '#00C16A' }
    );
    var vm = getVm(compiled);
    var destroySpy;

    expect(vm.pickr).toBeDefined();
    expect(typeof vm.pickr.destroy).toBe('function');

    destroySpy = spyOn(vm.pickr, 'destroy').and.callThrough();
    compiled.scope.$destroy();

    expect(destroySpy).toHaveBeenCalled();
  });

  it('preview do trigger reflete valor inicial e mudança externa do modelo', function () {
    var compiled = compilePicker(
      '<ge-color-picker ng-model="valor" throttle="0"></ge-color-picker>',
      { valor: '#00C16A' }
    );
    var preview = getPreview(compiled);
    var initialStyle = preview.style.backgroundColor;

    expect(getVm(compiled).previewColor.toLowerCase()).toBe('#00c16a');
    expect(initialStyle).toBeTruthy();

    compiled.scope.valor = '#FF0000';
    compiled.scope.$digest();

    expect(getVm(compiled).previewColor.toLowerCase()).toBe('#ff0000');
    expect(getPreview(compiled).style.backgroundColor).not.toBe(initialStyle);
  });

  it('required="true" proxy aria-invalid/aria-required no trigger (pristine vs $dirty)', function () {
    var compiled = compilePicker(
      '<ge-color-picker ng-model="valor" required="true" throttle="0"></ge-color-picker>',
      { valor: '' }
    );
    var hostEl = pickerHost(compiled)[0];
    var trigger = getTrigger(compiled);
    var ngModelCtrl = pickerHost(compiled).controller('ngModel');

    expect(ngModelCtrl.$invalid).toBe(true);
    expect(ngModelCtrl.$pristine).toBe(true);
    expect(trigger.getAttribute('aria-invalid')).not.toBe('true');
    expect(trigger.getAttribute('aria-required')).toBe('true');
    expect(trigger.getAttribute('aria-haspopup')).toBe('dialog');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(trigger.getAttribute('aria-label')).toBe('Selecionar cor');
    expect(hostEl.getAttribute('aria-invalid')).toBe('true');
    expect(hostEl.getAttribute('aria-required')).toBe('true');

    ngModelCtrl.$setDirty();
    compiled.scope.$digest();

    expect(trigger.getAttribute('aria-invalid')).toBe('true');
    expect(trigger.getAttribute('aria-required')).toBe('true');

    compiled.scope.valor = '#00C16A';
    compiled.scope.$digest();

    expect(trigger.getAttribute('aria-invalid')).toBe('false');
    expect(trigger.getAttribute('aria-required')).toBe('true');
  });

  it('ng-required="true" proxy aria-invalid/aria-required no trigger (pristine vs $dirty)', function () {
    var compiled = compilePicker(
      '<form name="demoForm">' +
        '<ge-color-picker name="accent" ng-model="valor" ng-required="true" throttle="0"></ge-color-picker>' +
        '</form>',
      { valor: '' }
    );
    var hostEl = pickerHost(compiled)[0];
    var trigger = getTrigger(compiled);
    var ngModelCtrl = pickerHost(compiled).controller('ngModel');

    expect(ngModelCtrl.$invalid).toBe(true);
    expect(ngModelCtrl.$pristine).toBe(true);
    expect(trigger.getAttribute('aria-invalid')).not.toBe('true');
    expect(trigger.getAttribute('aria-required')).toBe('true');
    expect(hostEl.getAttribute('aria-invalid')).toBe('true');

    ngModelCtrl.$setDirty();
    compiled.scope.$digest();

    expect(trigger.getAttribute('aria-invalid')).toBe('true');

    compiled.scope.valor = '#00C16A';
    compiled.scope.$digest();

    expect(ngModelCtrl.$invalid).toBe(false);
    expect(trigger.getAttribute('aria-invalid')).toBe('false');
    expect(trigger.getAttribute('aria-required')).toBe('true');
  });

  it('aria-expanded reflete show/hide reais do Pickr', function (done) {
    var compiled = compilePicker(
      '<ge-color-picker ng-model="valor" throttle="0"></ge-color-picker>',
      { valor: '#00C16A' }
    );
    whenPickrReady(compiled, function () {
      var trigger = getTrigger(compiled);
      var vm = getVm(compiled);

      expect(trigger.getAttribute('aria-expanded')).toBe('false');

      vm.pickr.show();
      compiled.scope.$digest();

      expect(trigger.getAttribute('aria-expanded')).toBe('true');
      expect(vm.isOpen).toBe(true);

      vm.pickr.hide();
      compiled.scope.$digest();

      expect(trigger.getAttribute('aria-expanded')).toBe('false');
      expect(vm.isOpen).toBe(false);
      done();
    });
  });

  it('aplica defaultVariants (md) via geTv no trigger', function () {
    var compiled = compilePicker(
      '<ge-color-picker ng-model="valor" throttle="0"></ge-color-picker>',
      { valor: '#00C16A' }
    );
    var expected = geTv(geColorPickerTheme)({
      size: 'md',
      disabled: false,
    });

    expect(getTrigger(compiled).className).toBe(expected.trigger);
    expect(getTrigger(compiled).className).toContain('p-1.5');
  });

  it('escreve data-is-disabled no trigger (não colide com BOOLEAN_ATTR)', function () {
    var compiled = compilePicker(
      '<ge-color-picker ng-model="valor" disabled="true" throttle="0"></ge-color-picker>',
      { valor: '#00C16A' }
    );
    var trigger = getTrigger(compiled);
    var root = compiled.element[0].querySelector('[data-is-disabled]');

    expect(trigger.getAttribute('data-is-disabled')).toBe('true');
    expect(trigger.disabled).toBe(true);
    expect(root.getAttribute('data-is-disabled')).toBe('true');
    expect(trigger.hasAttribute('data-disabled')).toBe(false);
  });

  it('format rgba converte a string do modelo a partir do change do Pickr', function (done) {
    var compiled = compilePicker(
      '<ge-color-picker ng-model="valor" format="rgba" throttle="0"></ge-color-picker>',
      { valor: 'rgba(0, 0, 0, 1)' }
    );
    whenPickrReady(compiled, function () {
      simulatePickrChange(compiled, '#FF0000');
      expect(compiled.scope.valor.toLowerCase()).toContain('rgba');
      expect(compiled.scope.valor).toMatch(/255/);
      done();
    });
  });
});
