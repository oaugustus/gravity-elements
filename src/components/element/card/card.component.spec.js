'use strict';

describe('geCard', function () {
  var $compile;
  var $rootScope;
  var host;
  var appRoot;
  var geTv;
  var geCardTheme;

  beforeEach(function () {
    appRoot = document.createElement('div');
    document.body.appendChild(appRoot);
    angular.bootstrap(appRoot, ['gravityElements']);

    var injector = angular.element(appRoot).injector();
    $compile = injector.get('$compile');
    $rootScope = injector.get('$rootScope');
    geTv = injector.get('geTv');
    geCardTheme = injector.get('geCardTheme');

    host = document.createElement('div');
    appRoot.appendChild(host);
  });

  afterEach(function () {
    if (appRoot && appRoot.parentNode) {
      appRoot.parentNode.removeChild(appRoot);
    }
  });

  function compileCard(html, scopeExt) {
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

  /**
   * Conteúdo de slots nomeados fica dentro de <ge-card-*>; o default (body)
   * é filho direto do wrapper com classes do tema.
   */
  function themedSlotParent(node) {
    var parent = node.parentNode;
    if (parent && /^GE-CARD-/i.test(parent.tagName)) {
      return parent.parentNode;
    }
    return parent;
  }

  it('aplica defaultVariants (outline) com title/description', function () {
    var compiled = compileCard(
      '<ge-card title="Card title" description="Card description">' +
        '<span class="body-child">Body</span>' +
        '</ge-card>'
    );
    var root = compiled.element.children()[0];
    var expected = geTv(geCardTheme)({ variant: 'outline' });
    var titleEl = root.querySelector('[class*="font-semibold"]');
    var descEl = root.querySelector('[class*="text-sm"]');
    var bodyChild = root.querySelector('.body-child');

    expect(root).toBeDefined();
    expect(root.className).toBe(expected.root);
    expect(root.className).toContain('bg-[var(--ui-bg)]');
    expect(root.className).toContain('ring-[var(--ui-border)]');
    expect(titleEl).not.toBeNull();
    expect(titleEl.textContent.trim()).toBe('Card title');
    expect(titleEl.className).toBe(expected.title);
    expect(descEl).not.toBeNull();
    expect(descEl.textContent.trim()).toBe('Card description');
    expect(descEl.className).toBe(expected.description);
    expect(bodyChild).not.toBeNull();
    expect(themedSlotParent(bodyChild).className).toBe(expected.body);
  });

  it('aplica override variant=soft via geTv', function () {
    var compiled = compileCard(
      '<ge-card variant="soft"><span class="body-child">Soft</span></ge-card>'
    );
    var root = compiled.element.children()[0];
    var expected = geTv(geCardTheme)({ variant: 'soft' });

    expect(root.className).toBe(expected.root);
    expect(root.className).toContain(
      'bg-[color-mix(in_srgb,var(--ui-bg-elevated)_50%,transparent)]'
    );
    expect(root.className).toContain('divide-[var(--ui-border)]');
    expect(root.className).not.toContain('ring-[var(--ui-border)]');
  });

  it('distribui conteúdo multi-slot nas regiões header/body/footer', function () {
    var compiled = compileCard(
      '<ge-card>' +
        '<ge-card-header><span class="slot-header">Header</span></ge-card-header>' +
        '<span class="slot-body">Body</span>' +
        '<ge-card-footer><span class="slot-footer">Footer</span></ge-card-footer>' +
        '</ge-card>'
    );
    var root = compiled.element.children()[0];
    var expected = geTv(geCardTheme)({ variant: 'outline' });
    var headerEl = themedSlotParent(root.querySelector('.slot-header'));
    var bodyEl = themedSlotParent(root.querySelector('.slot-body'));
    var footerEl = themedSlotParent(root.querySelector('.slot-footer'));

    expect(root.className).toBe(expected.root);
    expect(headerEl.className).toBe(expected.header);
    expect(bodyEl.className).toBe(expected.body);
    expect(footerEl.className).toBe(expected.footer);
    expect(root.querySelector('.slot-header').textContent).toBe('Header');
    expect(root.querySelector('.slot-body').textContent).toBe('Body');
    expect(root.querySelector('.slot-footer').textContent).toBe('Footer');
  });

  it('atualiza classes quando variant muda após montagem', function () {
    var compiled = compileCard(
      '<ge-card variant="{{ variant }}" title="T">' +
        '<span>Body</span>' +
        '</ge-card>',
      { variant: 'outline' }
    );
    var vm = compiled.element.isolateScope().vm;

    expect(vm.classes.root).toContain('bg-[var(--ui-bg)]');

    compiled.scope.variant = 'solid';
    compiled.scope.$digest();
    // Assert em vm.classes (não no className do DOM): ngAnimate deixa
    // *-add/*-remove no atributo class até a transição assentar (§5.8).
    vm = compiled.element.isolateScope().vm;
    var expected = geTv(geCardTheme)({ variant: 'solid' });
    expect(vm.classes.root).toBe(expected.root);
    expect(vm.classes.root).toContain('bg-[var(--ui-bg-inverted)]');
    expect(vm.classes.title).toBe(expected.title);
  });
});
