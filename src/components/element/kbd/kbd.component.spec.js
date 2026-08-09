'use strict';

describe('geKbd', function () {
  var $compile;
  var $rootScope;
  var host;
  var appRoot;
  var geTv;
  var geKbdTheme;

  beforeEach(function () {
    appRoot = document.createElement('div');
    document.body.appendChild(appRoot);
    angular.bootstrap(appRoot, ['gravityElements']);

    var injector = angular.element(appRoot).injector();
    $compile = injector.get('$compile');
    $rootScope = injector.get('$rootScope');
    geTv = injector.get('geTv');
    geKbdTheme = injector.get('geKbdTheme');

    host = document.createElement('div');
    appRoot.appendChild(host);
  });

  afterEach(function () {
    if (appRoot && appRoot.parentNode) {
      appRoot.parentNode.removeChild(appRoot);
    }
  });

  function compileKbd(html, scopeExt) {
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

  it('renderiza o símbolo correto para uma tecla conhecida (shift → ⇧)', function () {
    var compiled = compileKbd('<ge-kbd value="shift"></ge-kbd>');
    var kbd = compiled.element.children()[0];

    expect(kbd).toBeDefined();
    expect(kbd.tagName.toLowerCase()).toBe('kbd');
    expect(kbd.textContent.trim()).toBe('\u21E7');
  });

  it('aplica color/variant/size via geTv (default neutral/outline/md e override primary/soft/lg)', function () {
    var defaultCompiled = compileKbd('<ge-kbd value="k"></ge-kbd>');
    var defaultKbd = defaultCompiled.element.children()[0];
    var expectedDefault = geTv(geKbdTheme)({
      color: 'neutral',
      variant: 'outline',
      size: 'md',
    });

    expect(defaultKbd.className).toBe(expectedDefault.base);
    expect(defaultKbd.className).toContain('h-5');
    expect(defaultKbd.className).toContain('ring-[var(--ui-border-accented)]');

    var overrideCompiled = compileKbd(
      '<ge-kbd value="k" color="primary" variant="soft" size="lg"></ge-kbd>'
    );
    var overrideKbd = overrideCompiled.element.children()[0];
    var expectedOverride = geTv(geKbdTheme)({
      color: 'primary',
      variant: 'soft',
      size: 'lg',
    });

    expect(overrideKbd.className).toBe(expectedOverride.base);
    expect(overrideKbd.className).toContain('h-6');
    expect(overrideKbd.className).toContain(
      'bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)]'
    );
    expect(overrideKbd.className).toContain('text-[var(--ui-primary)]');
  });

  it('atualiza displayValue e classes quando value/color mudam após montagem', function () {
    var compiled = compileKbd(
      '<ge-kbd value="{{ key }}" color="{{ color }}"></ge-kbd>',
      { key: 'shift', color: 'neutral' }
    );
    var vm = compiled.element.isolateScope().vm;

    expect(vm.displayValue).toBe('\u21E7');
    expect(vm.classes.base).toContain('ring-[var(--ui-border-accented)]');

    compiled.scope.key = 'enter';
    compiled.scope.color = 'primary';
    compiled.scope.$digest();
    vm = compiled.element.isolateScope().vm;
    var expected = geTv(geKbdTheme)({
      color: 'primary',
      variant: 'outline',
      size: 'md',
    });

    expect(vm.displayValue).toBe('\u21B5');
    expect(vm.classes.base).toBe(expected.base);
    expect(vm.classes.base).toContain('text-[var(--ui-primary)]');
    expect(vm.classes.base).not.toContain('ring-[var(--ui-border-accented)]');
  });
});
