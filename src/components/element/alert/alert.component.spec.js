'use strict';

describe('geAlert', function () {
  var $compile;
  var $rootScope;
  var $timeout;
  var host;
  var appRoot;
  var geTv;
  var geAlertTheme;

  beforeEach(function () {
    appRoot = document.createElement('div');
    document.body.appendChild(appRoot);
    angular.bootstrap(appRoot, ['gravityElements']);

    var injector = angular.element(appRoot).injector();
    $compile = injector.get('$compile');
    $rootScope = injector.get('$rootScope');
    $timeout = injector.get('$timeout');
    geTv = injector.get('geTv');
    geAlertTheme = injector.get('geAlertTheme');

    host = document.createElement('div');
    appRoot.appendChild(host);
  });

  afterEach(function () {
    if (appRoot && appRoot.parentNode) {
      appRoot.parentNode.removeChild(appRoot);
    }
  });

  function compileAlert(html, scopeExt) {
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

  it('aplica defaultVariants (primary/solid) com role=alert e title', function () {
    var compiled = compileAlert(
      '<ge-alert title="Heads up!" description="Check the config."></ge-alert>'
    );
    var root = compiled.element.children()[0];
    var expected = geTv(geAlertTheme)({
      color: 'primary',
      variant: 'solid',
      orientation: 'vertical',
      title: true,
    });

    expect(root.getAttribute('role')).toBe('alert');
    expect(root.getAttribute('data-orientation')).toBe('vertical');
    expect(root.className).toBe(expected.root);
    expect(root.className).toContain('rounded-lg');
    expect(root.className).toContain('bg-[var(--ui-primary)]');
    expect(root.textContent).toContain('Heads up!');
    expect(root.textContent).toContain('Check the config.');
    expect(expected.description).toContain('mt-1');
  });

  it('override color/variant e closable dispara onClose', function () {
    var closed = false;
    var compiled = compileAlert(
      '<ge-alert title="Note" color="neutral" variant="outline"' +
        ' closable="closable" on-close="onClose()">' +
        '</ge-alert>',
      {
        closable: true,
        onClose: function () {
          closed = true;
        },
      }
    );
    var root = compiled.element.children()[0];
    var expected = geTv(geAlertTheme)({
      color: 'neutral',
      variant: 'outline',
      orientation: 'vertical',
      title: true,
    });
    var closeBtn = root.querySelector('button[aria-label="Fechar"]');

    expect(root.className).toBe(expected.root);
    expect(root.className).toContain('ring-[var(--ui-border)]');
    expect(root.className).toContain('text-[var(--ui-text-highlighted)]');
    expect(closeBtn).not.toBeNull();

    angular.element(closeBtn).triggerHandler('click');
    compiled.scope.$digest();

    expect(closed).toBe(true);
    expect(compiled.element.children().length).toBe(0);
  });

  it('atualiza classes quando color muda após montagem', function () {
    var compiled = compileAlert(
      '<ge-alert title="Note" color="{{ color }}"></ge-alert>',
      { color: 'primary' }
    );
    var root = compiled.element.children()[0];

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

    expect(root.className).toContain('bg-[var(--ui-error)]');
    expect(root.className).not.toContain('bg-[var(--ui-primary)]');
  });
});


