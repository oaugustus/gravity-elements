'use strict';

describe('geProgress', function () {
  var $compile;
  var $rootScope;
  var host;
  var appRoot;
  var geTv;
  var geProgressTheme;

  beforeEach(function () {
    appRoot = document.createElement('div');
    document.body.appendChild(appRoot);
    angular.bootstrap(appRoot, ['gravityElements']);

    var injector = angular.element(appRoot).injector();
    $compile = injector.get('$compile');
    $rootScope = injector.get('$rootScope');
    geTv = injector.get('geTv');
    geProgressTheme = injector.get('geProgressTheme');

    host = document.createElement('div');
    appRoot.appendChild(host);
  });

  afterEach(function () {
    if (appRoot && appRoot.parentNode) {
      appRoot.parentNode.removeChild(appRoot);
    }
  });

  function compileProgress(html, scopeExt) {
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

  it('calcula aria-valuenow/percent e transform do indicador para value/max dados', function () {
    var compiled = compileProgress(
      '<ge-progress value="value" max="max" status="showStatus"></ge-progress>',
      { value: 25, max: 100, showStatus: true }
    );
    var vm = compiled.element.isolateScope().vm;
    var bar = compiled.element[0].querySelector('[role="progressbar"]');
    var expected = geTv(geProgressTheme)({
      color: 'primary',
      size: 'md',
    });

    expect(vm.classes.root).toBe(expected.root);
    expect(vm.classes.base).toBe(expected.base);
    expect(vm.classes.indicator).toBe(expected.indicator);
    expect(vm.classes.base).toContain('h-2');
    expect(vm.classes.indicator).toContain('bg-[var(--ui-primary)]');
    expect(vm.percent).toBe(25);
    expect(vm.ariaValueNow).toBe(25);
    expect(vm.ariaValueMax).toBe(100);
    expect(vm.indicatorStyle).toEqual({ transform: 'translateX(-75%)' });
    expect(vm.showStatus).toBe(true);
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-valuenow')).toBe('25');
  });

  it('estado indeterminate (sem value) omite aria-valuenow e aplica data-state', function () {
    var compiled = compileProgress('<ge-progress></ge-progress>');
    var vm = compiled.element.isolateScope().vm;
    var bar = compiled.element[0].querySelector('[role="progressbar"]');
    var indicator = bar.querySelector('[class*="rounded-full"]');

    expect(vm.isIndeterminate).toBe(true);
    expect(vm.percent).toBeUndefined();
    expect(vm.ariaValueNow).toBeUndefined();
    expect(vm.dataState).toBe('indeterminate');
    expect(vm.indicatorStyle).toBeUndefined();
    expect(vm.showStatus).toBe(false);
    expect(bar.hasAttribute('aria-valuenow')).toBe(false);
    expect(indicator.getAttribute('data-state')).toBe('indeterminate');
    expect(vm.classes.indicator).toContain(
      'data-[state=indeterminate]:animate-pulse'
    );
  });

  it('atualiza percent/aria quando value muda após montagem', function () {
    var compiled = compileProgress(
      '<ge-progress value="value" max="100"></ge-progress>',
      { value: 10 }
    );
    var vm = compiled.element.isolateScope().vm;

    expect(vm.percent).toBe(10);
    expect(vm.ariaValueNow).toBe(10);
    expect(vm.indicatorStyle.transform).toBe('translateX(-90%)');

    compiled.scope.value = 50;
    compiled.scope.$digest();
    vm = compiled.element.isolateScope().vm;

    expect(vm.percent).toBe(50);
    expect(vm.ariaValueNow).toBe(50);
    expect(vm.indicatorStyle.transform).toBe('translateX(-50%)');
    expect(vm.isIndeterminate).toBe(false);
  });
});
