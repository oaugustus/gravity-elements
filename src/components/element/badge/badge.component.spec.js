'use strict';

describe('geBadge', function () {
  var $compile;
  var $rootScope;
  var host;
  var appRoot;
  var geTv;
  var geBadgeTheme;

  beforeEach(function () {
    appRoot = document.createElement('div');
    document.body.appendChild(appRoot);
    angular.bootstrap(appRoot, ['gravityElements']);

    var injector = angular.element(appRoot).injector();
    $compile = injector.get('$compile');
    $rootScope = injector.get('$rootScope');
    geTv = injector.get('geTv');
    geBadgeTheme = injector.get('geBadgeTheme');

    host = document.createElement('div');
    appRoot.appendChild(host);
  });

  afterEach(function () {
    if (appRoot && appRoot.parentNode) {
      appRoot.parentNode.removeChild(appRoot);
    }
  });

  function compileBadge(html, scopeExt) {
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

  it('aplica defaultVariants (primary/solid/md) com label', function () {
    var compiled = compileBadge('<ge-badge label="Hello"></ge-badge>');
    var root = compiled.element.children()[0];
    var expected = geTv(geBadgeTheme)({
      color: 'primary',
      variant: 'solid',
      size: 'md',
      square: false,
    });

    expect(root).toBeDefined();
    expect(root.className).toBe(expected.base);
    expect(root.className).toContain('inline-flex');
    expect(root.className).toContain('bg-[var(--ui-primary)]');
    expect(root.className).toContain('text-xs');
    expect(root.textContent.trim()).toBe('Hello');
  });

  it('aplica override de color/variant/size via geTv', function () {
    var compiled = compileBadge(
      '<ge-badge label="Neutral" color="neutral" variant="outline" size="lg"></ge-badge>'
    );
    var root = compiled.element.children()[0];
    var expected = geTv(geBadgeTheme)({
      color: 'neutral',
      variant: 'outline',
      size: 'lg',
      square: false,
    });

    expect(root.className).toBe(expected.base);
    expect(root.className).toContain('ring-[var(--ui-border-accented)]');
    expect(root.className).toContain('text-[var(--ui-text)]');
    expect(root.className).toContain('text-sm');
    expect(root.className).not.toContain('bg-[var(--ui-primary)]');
    expect(root.textContent.trim()).toBe('Neutral');
  });

  it('atualiza classes quando color muda após montagem', function () {
    var compiled = compileBadge(
      '<ge-badge label="Hello" color="{{ color }}"></ge-badge>',
      { color: 'primary' }
    );
    var vm = compiled.element.isolateScope().vm;

    expect(vm.classes.base).toContain('bg-[var(--ui-primary)]');

    compiled.scope.color = 'neutral';
    compiled.scope.$digest();
    // Assert em vm.classes (não no className do DOM): ngAnimate deixa
    // *-add/*-remove no atributo class até a transição assentar (§5.8).
    vm = compiled.element.isolateScope().vm;
    var expected = geTv(geBadgeTheme)({
      color: 'neutral',
      variant: 'solid',
      size: 'md',
      square: false,
    });

    expect(vm.classes.base).toBe(expected.base);
    expect(vm.classes.base).toContain('bg-[var(--ui-bg-inverted)]');
    expect(vm.classes.base).not.toContain('bg-[var(--ui-primary)]');
  });

  it('não renderiza span de transclude vazio quando só label é usado (evita gap fantasma descentralizando o texto)', function () {
    var compiled = compileBadge('<ge-badge label="Badge"></ge-badge>');
    var root = compiled.element.children()[0];
    var spans = root.querySelectorAll('span');

    expect(spans.length).toBe(1);
    expect(spans[0].textContent.trim()).toBe('Badge');
  });
});




