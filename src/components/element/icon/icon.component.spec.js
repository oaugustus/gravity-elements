'use strict';

describe('geIcon', function () {
  var $compile;
  var $rootScope;
  var host;
  var appRoot;
  var geTv;
  var geIconTheme;

  beforeEach(function () {
    appRoot = document.createElement('div');
    document.body.appendChild(appRoot);
    angular.bootstrap(appRoot, ['gravityElements']);

    var injector = angular.element(appRoot).injector();
    $compile = injector.get('$compile');
    $rootScope = injector.get('$rootScope');
    geTv = injector.get('geTv');
    geIconTheme = injector.get('geIconTheme');

    host = document.createElement('div');
    appRoot.appendChild(host);
  });

  afterEach(function () {
    if (appRoot && appRoot.parentNode) {
      appRoot.parentNode.removeChild(appRoot);
    }
  });

  function compileIcon(html, scopeExt) {
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

  it('aplica name como classe CSS no elemento', function () {
    var compiled = compileIcon(
      '<ge-icon name="i-lucide-check"></ge-icon>'
    );
    var icon = compiled.element.children()[0];
    var expected = geTv(geIconTheme)({ size: 'md' });

    expect(icon).toBeDefined();
    expect(icon.tagName.toLowerCase()).toBe('i');
    expect(icon.className).toContain('i-lucide-check');
    expect(icon.className).toContain(expected.base);
    expect(icon.getAttribute('aria-hidden')).toBe('true');
  });

  it('aplica tamanho correto via size (default md e override xs)', function () {
    var defaultCompiled = compileIcon(
      '<ge-icon name="i-lucide-star"></ge-icon>'
    );
    var defaultIcon = defaultCompiled.element.children()[0];
    var expectedMd = geTv(geIconTheme)({ size: 'md' });

    expect(defaultIcon.className).toContain('size-5');
    expect(defaultIcon.className).toContain(expectedMd.base);

    var xsCompiled = compileIcon(
      '<ge-icon name="i-lucide-star" size="xs"></ge-icon>'
    );
    var xsIcon = xsCompiled.element.children()[0];
    var expectedXs = geTv(geIconTheme)({ size: 'xs' });

    expect(xsIcon.className).toContain('size-4');
    expect(xsIcon.className).toContain(expectedXs.base);
    expect(xsIcon.className).not.toContain('size-5');
  });

  it('atualiza classes quando size muda após montagem', function () {
    var compiled = compileIcon(
      '<ge-icon name="i-lucide-check" size="{{ size }}"></ge-icon>',
      { size: 'md' }
    );
    var vm = compiled.element.isolateScope().vm;

    expect(vm.classes.base).toContain('size-5');

    compiled.scope.size = 'xl';
    compiled.scope.$digest();
    // Assert em vm.classes (não no className do DOM): ngAnimate deixa
    // *-add/*-remove no atributo class até a transição assentar (§5.8).
    vm = compiled.element.isolateScope().vm;
    var expected = geTv(geIconTheme)({ size: 'xl' });

    expect(vm.classes.base).toBe(expected.base);
    expect(vm.classes.base).toContain('size-6');
    expect(vm.classes.base).not.toContain('size-5');
  });
});
