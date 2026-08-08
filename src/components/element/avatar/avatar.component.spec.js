'use strict';

describe('geAvatar', function () {
  var $compile;
  var $rootScope;
  var host;
  var appRoot;
  var geTv;
  var geAvatarTheme;

  beforeEach(function () {
    appRoot = document.createElement('div');
    document.body.appendChild(appRoot);
    angular.bootstrap(appRoot, ['gravityElements']);

    var injector = angular.element(appRoot).injector();
    $compile = injector.get('$compile');
    $rootScope = injector.get('$rootScope');
    geTv = injector.get('geTv');
    geAvatarTheme = injector.get('geAvatarTheme');

    host = document.createElement('div');
    appRoot.appendChild(host);
  });

  afterEach(function () {
    if (appRoot && appRoot.parentNode) {
      appRoot.parentNode.removeChild(appRoot);
    }
  });

  function compileAvatar(html, scopeExt) {
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

  it('aplica defaultVariants (md/neutral) com fallback text', function () {
    var compiled = compileAvatar('<ge-avatar text="AB"></ge-avatar>');
    var root = compiled.element.children()[0];
    var expected = geTv(geAvatarTheme)({
      size: 'md',
      color: 'neutral',
    });
    var fallback = root.querySelector('[aria-hidden="true"]');

    expect(root.className).toBe(expected.root);
    expect(root.className).toContain('size-8');
    expect(root.className).toContain('bg-[var(--ui-bg-elevated)]');
    expect(root.querySelector('img')).toBeNull();
    expect(fallback).not.toBeNull();
    expect(fallback.textContent).toBe('AB');
    expect(fallback.className).toBe(expected.fallback);
  });

  it('override size e fallback icon quando não há src/text', function () {
    var compiled = compileAvatar(
      '<ge-avatar size="lg" color="primary" icon="i-lucide-user"></ge-avatar>'
    );
    var root = compiled.element.children()[0];
    var expected = geTv(geAvatarTheme)({
      size: 'lg',
      color: 'primary',
    });
    var icon = root.querySelector('i');

    expect(root.className).toBe(expected.root);
    expect(root.className).toContain('size-9');
    expect(root.className).toContain(
      'bg-[color-mix(in_srgb,var(--ui-primary)_10%,transparent)]'
    );
    expect(icon).not.toBeNull();
    expect(icon.className).toContain('i-lucide-user');
    expect(icon.className).toContain(expected.icon);
    expect(icon.getAttribute('aria-hidden')).toBe('true');
    expect(root.querySelector('img')).toBeNull();
  });
});
