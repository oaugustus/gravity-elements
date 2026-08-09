'use strict';

describe('geSeparator', function () {
  var $compile;
  var $rootScope;
  var host;
  var appRoot;
  var geTv;
  var geSeparatorTheme;

  beforeEach(function () {
    appRoot = document.createElement('div');
    document.body.appendChild(appRoot);
    angular.bootstrap(appRoot, ['gravityElements']);

    var injector = angular.element(appRoot).injector();
    $compile = injector.get('$compile');
    $rootScope = injector.get('$rootScope');
    geTv = injector.get('geTv');
    geSeparatorTheme = injector.get('geSeparatorTheme');

    host = document.createElement('div');
    appRoot.appendChild(host);
  });

  afterEach(function () {
    if (appRoot && appRoot.parentNode) {
      appRoot.parentNode.removeChild(appRoot);
    }
  });

  function compileSeparator(html, scopeExt) {
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

  it('aplica role="separator" e aria-orientation horizontal por default', function () {
    var compiled = compileSeparator('<ge-separator></ge-separator>');
    var vm = compiled.element.isolateScope().vm;
    var root = compiled.element[0].querySelector('[role="separator"]');
    var expected = geTv(geSeparatorTheme)({
      color: 'neutral',
      orientation: 'horizontal',
      size: 'xs',
      type: 'solid',
      position: 'center',
    });

    expect(root).toBeDefined();
    expect(root.getAttribute('role')).toBe('separator');
    expect(root.getAttribute('aria-orientation')).toBe('horizontal');
    expect(vm.classes.root).toBe(expected.root);
    expect(vm.classes.border).toBe(expected.border);
    expect(vm.classes.border).toContain('border-[var(--ui-border)]');
    expect(vm.classes.border).toContain('border-t');
    expect(vm.classes.border).toContain('border-solid');
    expect(vm.hasLabel).toBe(false);
    expect(root.querySelectorAll('[class*="font-medium"]').length).toBe(0);
  });

  it('renderiza label e aplica color/size/type/orientation via geTv', function () {
    var compiled = compileSeparator(
      '<ge-separator orientation="vertical" label="Ou" color="primary" size="md" type="dashed"></ge-separator>'
    );
    var vm = compiled.element.isolateScope().vm;
    var root = compiled.element[0].querySelector('[role="separator"]');
    var label = root.querySelector('span');
    var expected = geTv(geSeparatorTheme)({
      color: 'primary',
      orientation: 'vertical',
      size: 'md',
      type: 'dashed',
      position: 'center',
    });

    expect(root.getAttribute('aria-orientation')).toBe('vertical');
    expect(vm.hasLabel).toBe(true);
    expect(label).toBeDefined();
    expect(label.textContent.trim()).toBe('Ou');
    expect(vm.classes.root).toBe(expected.root);
    expect(vm.classes.border).toBe(expected.border);
    expect(vm.classes.container).toBe(expected.container);
    expect(vm.classes.label).toBe(expected.label);
    expect(vm.classes.border).toContain('border-[var(--ui-primary)]');
    expect(vm.classes.border).toContain('border-s-[3px]');
    expect(vm.classes.border).toContain('border-dashed');
    expect(vm.classes.container).toContain('my-2');
  });

  it('atualiza aria-orientation e classes quando props mudam após montagem', function () {
    var compiled = compileSeparator(
      '<ge-separator orientation="{{ orientation }}" color="{{ color }}" label="{{ label }}"></ge-separator>',
      { orientation: 'horizontal', color: 'neutral', label: '' }
    );
    var vm = compiled.element.isolateScope().vm;
    var root = compiled.element[0].querySelector('[role="separator"]');

    expect(root.getAttribute('aria-orientation')).toBe('horizontal');
    expect(vm.classes.border).toContain('border-[var(--ui-border)]');
    expect(vm.hasLabel).toBe(false);

    compiled.scope.orientation = 'vertical';
    compiled.scope.color = 'primary';
    compiled.scope.label = 'Seção';
    compiled.scope.$digest();
    vm = compiled.element.isolateScope().vm;
    root = compiled.element[0].querySelector('[role="separator"]');

    var expected = geTv(geSeparatorTheme)({
      color: 'primary',
      orientation: 'vertical',
      size: 'xs',
      type: 'solid',
      position: 'center',
    });

    expect(root.getAttribute('aria-orientation')).toBe('vertical');
    expect(vm.classes.root).toBe(expected.root);
    expect(vm.classes.border).toBe(expected.border);
    expect(vm.classes.border).toContain('border-[var(--ui-primary)]');
    expect(vm.classes.border).toContain('border-s');
    expect(vm.hasLabel).toBe(true);
    expect(root.querySelector('span').textContent.trim()).toBe('Seção');
  });
});
