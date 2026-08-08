'use strict';

describe('geChip', function () {
  var $compile;
  var $rootScope;
  var host;
  var appRoot;
  var geTv;
  var geChipTheme;

  beforeEach(function () {
    appRoot = document.createElement('div');
    document.body.appendChild(appRoot);
    angular.bootstrap(appRoot, ['gravityElements']);

    var injector = angular.element(appRoot).injector();
    $compile = injector.get('$compile');
    $rootScope = injector.get('$rootScope');
    geTv = injector.get('geTv');
    geChipTheme = injector.get('geChipTheme');

    host = document.createElement('div');
    appRoot.appendChild(host);
  });

  afterEach(function () {
    if (appRoot && appRoot.parentNode) {
      appRoot.parentNode.removeChild(appRoot);
    }
  });

  function compileChip(html, scopeExt) {
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

  it('aplica defaultVariants (primary/md/top-right) sem standalone', function () {
    var compiled = compileChip('<ge-chip text="3"></ge-chip>');
    var root = compiled.element.children()[0];
    var expected = geTv(geChipTheme)({
      color: 'primary',
      size: 'md',
      position: 'top-right',
      inset: false,
      standalone: false,
    });
    var baseEl = root.querySelector('[class*="rounded-full"]');

    expect(root).toBeDefined();
    expect(root.className).toBe(expected.root);
    expect(root.className).toContain('relative');
    expect(root.className).toContain('inline-flex');
    expect(baseEl).toBeDefined();
    expect(baseEl.className).toBe(expected.base);
    expect(baseEl.className).toContain('bg-[var(--ui-primary)]');
    expect(baseEl.className).toContain('absolute');
    expect(baseEl.className).toContain('h-[8px]');
    expect(baseEl.className).toContain('-translate-y-1/2');
    expect(baseEl.textContent.trim()).toBe('3');
  });

  it('aplica override de color/size/position e standalone', function () {
    // standalone é binding `<` — precisa de expressão no scope
    var compiled = compileChip(
      '<ge-chip text="9" color="error" size="lg" position="bottom-left" standalone="standalone"></ge-chip>',
      { standalone: true }
    );
    var root = compiled.element.children()[0];
    var expected = geTv(geChipTheme)({
      color: 'error',
      size: 'lg',
      position: 'bottom-left',
      inset: false,
      standalone: true,
    });
    var vm = compiled.element.isolateScope().vm;

    expect(vm.classes.root).toBe(expected.root);
    expect(vm.classes.base).toBe(expected.base);
    expect(vm.classes.base).toContain('bg-[var(--ui-error)]');
    expect(vm.classes.base).toContain('h-[9px]');
    expect(vm.classes.base).toContain('bottom-0');
    expect(vm.classes.base).toContain('left-0');
    expect(vm.classes.base).not.toContain('absolute');
    expect(root.textContent.trim()).toBe('9');
  });

  it('atualiza classes quando color muda após montagem', function () {
    var compiled = compileChip(
      '<ge-chip text="1" color="{{ color }}"></ge-chip>',
      { color: 'primary' }
    );
    var vm = compiled.element.isolateScope().vm;

    expect(vm.classes.base).toContain('bg-[var(--ui-primary)]');

    compiled.scope.color = 'neutral';
    compiled.scope.$digest();
    // Assert em vm.classes (não no className do DOM): ngAnimate deixa
    // *-add/*-remove no atributo class até a transição assentar (§5.8).
    vm = compiled.element.isolateScope().vm;
    var expected = geTv(geChipTheme)({
      color: 'neutral',
      size: 'md',
      position: 'top-right',
      inset: false,
      standalone: false,
    });

    expect(vm.classes.base).toBe(expected.base);
    expect(vm.classes.base).toContain('bg-[var(--ui-bg-inverted)]');
    expect(vm.classes.base).not.toContain('bg-[var(--ui-primary)]');
  });
});
