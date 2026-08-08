'use strict';

describe('geBanner', function () {
  var $compile;
  var $rootScope;
  var $timeout;
  var host;
  var appRoot;
  var geTv;
  var geBannerTheme;

  beforeEach(function () {
    appRoot = document.createElement('div');
    document.body.appendChild(appRoot);
    angular.bootstrap(appRoot, ['gravityElements']);

    var injector = angular.element(appRoot).injector();
    $compile = injector.get('$compile');
    $rootScope = injector.get('$rootScope');
    $timeout = injector.get('$timeout');
    geTv = injector.get('geTv');
    geBannerTheme = injector.get('geBannerTheme');

    host = document.createElement('div');
    appRoot.appendChild(host);
  });

  afterEach(function () {
    if (appRoot && appRoot.parentNode) {
      appRoot.parentNode.removeChild(appRoot);
    }
  });

  function compileBanner(html, scopeExt) {
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

  it('aplica defaultVariants (primary) com role=status e title', function () {
    var compiled = compileBanner(
      '<ge-banner title="Ship faster with Gravity"></ge-banner>'
    );
    var root = compiled.element.children()[0];
    var expected = geTv(geBannerTheme)({
      color: 'primary',
      to: false,
    });

    expect(root.getAttribute('role')).toBe('status');
    expect(root.className).toBe(expected.root);
    expect(root.className).toContain('bg-[var(--ui-primary)]');
    expect(root.textContent).toContain('Ship faster with Gravity');
  });

  it('override color=error usa role=alert e closable dispara onClose', function () {
    var closed = false;
    var compiled = compileBanner(
      '<ge-banner title="Outage"' +
        ' color="error"' +
        ' closable="closable"' +
        ' on-close="onClose()">' +
        '</ge-banner>',
      {
        closable: true,
        onClose: function () {
          closed = true;
        },
      }
    );
    var root = compiled.element.children()[0];
    var expected = geTv(geBannerTheme)({
      color: 'error',
      to: false,
    });
    var closeBtn = root.querySelector('button[aria-label="Fechar"]');

    expect(root.getAttribute('role')).toBe('alert');
    expect(root.className).toBe(expected.root);
    expect(root.className).toContain('bg-[var(--ui-error)]');
    expect(closeBtn).not.toBeNull();

    angular.element(closeBtn).triggerHandler('click');
    compiled.scope.$digest();

    expect(closed).toBe(true);
    expect(compiled.element.children().length).toBe(0);
  });

  it('atualiza role e classes quando color muda após montagem', function () {
    var compiled = compileBanner(
      '<ge-banner title="News" color="{{ color }}"></ge-banner>',
      { color: 'primary' }
    );
    var root = compiled.element.children()[0];

    expect(root.getAttribute('role')).toBe('status');
    expect(root.className).toContain('bg-[var(--ui-primary)]');

    compiled.scope.color = 'error';
    compiled.scope.$digest();
    // ngAnimate pode deixar classes transitórias no root (§5.8).
    try {
      $timeout.flush();
    } catch (e) {
      // sem timeouts pendentes
    }
    root = compiled.element.children()[0];

    expect(root.getAttribute('role')).toBe('alert');
    expect(root.className).toContain('bg-[var(--ui-error)]');
    expect(root.className).not.toContain('bg-[var(--ui-primary)]');
  });
});

