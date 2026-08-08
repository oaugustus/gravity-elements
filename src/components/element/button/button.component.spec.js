'use strict';

describe('geButton', function () {
  var $compile;
  var $rootScope;
  var host;
  var appRoot;
  var geTv;
  var geButtonTheme;

  beforeEach(function () {
    appRoot = document.createElement('div');
    document.body.appendChild(appRoot);
    angular.bootstrap(appRoot, ['gravityElements']);

    var injector = angular.element(appRoot).injector();
    $compile = injector.get('$compile');
    $rootScope = injector.get('$rootScope');
    geTv = injector.get('geTv');
    geButtonTheme = injector.get('geButtonTheme');

    host = document.createElement('div');
    appRoot.appendChild(host);
  });

  afterEach(function () {
    if (appRoot && appRoot.parentNode) {
      appRoot.parentNode.removeChild(appRoot);
    }
  });

  function compileButton(html, scopeExt) {
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
    var compiled = compileButton('<ge-button label="Save"></ge-button>');
    var root = compiled.element.children()[0];
    var expected = geTv(geButtonTheme)({
      color: 'primary',
      variant: 'solid',
      size: 'md',
      block: false,
      square: false,
      loading: false,
      leading: false,
      trailing: false,
    });

    expect(root).toBeDefined();
    expect(root.tagName.toLowerCase()).toBe('button');
    expect(root.getAttribute('type')).toBe('button');
    expect(root.className).toBe(expected.base);
    expect(root.className).toContain('inline-flex');
    expect(root.className).toContain('bg-[var(--ui-primary)]');
    expect(root.className).toContain('text-sm');
    expect(root.getAttribute('aria-busy')).toBeNull();
    expect(root.textContent.trim()).toBe('Save');
  });

  it('loading=true aplica aria-busy e spinner leading via geTv', function () {
    var compiled = compileButton(
      '<ge-button label="Saving" color="neutral" variant="outline" loading="loading">' +
        '</ge-button>',
      { loading: true }
    );
    var root = compiled.element.children()[0];
    var expected = geTv(geButtonTheme)({
      color: 'neutral',
      variant: 'outline',
      size: 'md',
      block: false,
      square: false,
      loading: true,
      leading: true,
      trailing: false,
    });
    var spinner = root.querySelector('i');

    expect(root.getAttribute('aria-busy')).toBe('true');
    expect(root.disabled).toBe(true);
    expect(root.className).toBe(expected.base);
    expect(root.className).toContain('ring-[var(--ui-border-accented)]');
    expect(root.className).toContain('text-[var(--ui-text)]');
    expect(root.className).not.toContain('bg-[var(--ui-primary)]');
    expect(spinner).not.toBeNull();
    expect(spinner.className).toContain('i-lucide-loader-circle');
    expect(spinner.className).toContain('animate-spin');
    expect(root.textContent.trim()).toBe('Saving');
  });

  it('atualiza aria-busy/disabled/spinner quando loading muda após montagem', function () {
    var compiled = compileButton(
      '<ge-button label="Save" loading="isLoading"></ge-button>',
      { isLoading: false }
    );
    var root = compiled.element.children()[0];

    expect(root.getAttribute('aria-busy')).toBeNull();
    expect(root.disabled).toBe(false);
    expect(root.querySelector('i')).toBeNull();

    compiled.scope.isLoading = true;
    compiled.scope.$digest();
    root = compiled.element.children()[0];

    expect(root.getAttribute('aria-busy')).toBe('true');
    expect(root.disabled).toBe(true);
    expect(root.querySelector('i')).not.toBeNull();
    expect(root.querySelector('i').className).toContain('animate-spin');
  });
});

