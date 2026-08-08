'use strict';

describe('geFieldGroup', function () {
  var $compile;
  var $rootScope;
  var host;
  var appRoot;
  var geTv;
  var geFieldGroupTheme;
  var geButtonTheme;

  beforeEach(function () {
    appRoot = document.createElement('div');
    document.body.appendChild(appRoot);
    angular.bootstrap(appRoot, ['gravityElements']);

    var injector = angular.element(appRoot).injector();
    $compile = injector.get('$compile');
    $rootScope = injector.get('$rootScope');
    geTv = injector.get('geTv');
    geFieldGroupTheme = injector.get('geFieldGroupTheme');
    geButtonTheme = injector.get('geButtonTheme');

    host = document.createElement('div');
    appRoot.appendChild(host);
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

  it('aplica defaultVariants (orientation horizontal, size md)', function () {
    var compiled = compileGroup(
      '<ge-field-group><span class="child">A</span></ge-field-group>'
    );
    var root = compiled.element.children()[0];
    var expected = geTv(geFieldGroupTheme)({
      size: 'md',
      orientation: 'horizontal',
    });

    expect(root).toBeDefined();
    expect(root.className).toBe(expected.base);
    expect(root.className).toContain('relative');
    expect(root.className).toContain('inline-flex');
    expect(root.className).toContain('-space-x-px');
    expect(root.querySelector('.child')).not.toBeNull();
  });

  it('aplica override orientation=vertical via geTv', function () {
    var compiled = compileGroup(
      '<ge-field-group orientation="vertical">' +
        '<span class="child">A</span>' +
        '</ge-field-group>'
    );
    var root = compiled.element.children()[0];
    var expected = geTv(geFieldGroupTheme)({
      size: 'md',
      orientation: 'vertical',
    });

    expect(root.className).toBe(expected.base);
    expect(root.className).toContain('flex');
    expect(root.className).toContain('flex-col');
    expect(root.className).toContain('-space-y-px');
    expect(root.className).not.toContain('inline-flex');
  });

  it('atualiza classes quando orientation muda após montagem', function () {
    var compiled = compileGroup(
      '<ge-field-group orientation="{{ orient }}">' +
        '<span class="child">A</span>' +
        '</ge-field-group>',
      { orient: 'horizontal' }
    );
    var isolate = compiled.element.isolateScope();
    var expectedHorizontal = geTv(geFieldGroupTheme)({
      size: 'md',
      orientation: 'horizontal',
    });
    var expectedVertical = geTv(geFieldGroupTheme)({
      size: 'md',
      orientation: 'vertical',
    });

    expect(isolate.vm.classes.base).toBe(expectedHorizontal.base);

    compiled.scope.orient = 'vertical';
    compiled.scope.$digest();

    expect(isolate.vm.classes.base).toBe(expectedVertical.base);
    expect(isolate.vm.classes.base).toContain('-space-y-px');
  });

  it('propaga fieldGroup/size para ge-button filhos', function () {
    var compiled = compileGroup(
      '<ge-field-group size="lg">' +
        '<ge-button label="One"></ge-button>' +
        '<ge-button label="Two"></ge-button>' +
        '</ge-field-group>'
    );
    var buttonVms = compiled.element[0].querySelectorAll('ge-button');
    var expected = geTv(geButtonTheme)({
      color: 'primary',
      variant: 'solid',
      size: 'lg',
      block: false,
      square: false,
      loading: false,
      leading: false,
      trailing: false,
      fieldGroup: 'horizontal',
    });
    var firstVm = angular.element(buttonVms[0]).isolateScope().vm;
    var alone = geTv(geButtonTheme)({
      color: 'primary',
      variant: 'solid',
      size: 'md',
      block: false,
      square: false,
      loading: false,
      leading: false,
      trailing: false,
    });

    expect(buttonVms.length).toBe(2);
    // Assert em vm.classes (não DOM className — §5.8 / ngAnimate)
    expect(firstVm.classes.base).toBe(expected.base);
    expect(firstVm.classes.base).toContain(
      '[ge-button:not(:only-child):first-child_&]:rounded-e-none'
    );
    expect(firstVm.classes.base).toContain('px-3'); // size lg (md usa px-2.5)
    expect(alone.base).not.toContain('ge-button:not(:only-child)');
  });
});


