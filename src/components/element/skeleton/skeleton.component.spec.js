'use strict';

describe('geSkeleton', function () {
  var $compile;
  var $rootScope;
  var host;
  var appRoot;
  var geTv;
  var geSkeletonTheme;

  beforeEach(function () {
    appRoot = document.createElement('div');
    document.body.appendChild(appRoot);
    angular.bootstrap(appRoot, ['gravityElements']);

    var injector = angular.element(appRoot).injector();
    $compile = injector.get('$compile');
    $rootScope = injector.get('$rootScope');
    geTv = injector.get('geTv');
    geSkeletonTheme = injector.get('geSkeletonTheme');

    host = document.createElement('div');
    appRoot.appendChild(host);
  });

  afterEach(function () {
    if (appRoot && appRoot.parentNode) {
      appRoot.parentNode.removeChild(appRoot);
    }
  });

  function compileSkeleton(html) {
    var scope = $rootScope.$new();
    var element = $compile(html)(scope);
    host.appendChild(element[0]);
    scope.$digest();
    return element;
  }

  it('aplica classes do tema (animate-pulse, rounded-md, bg elevated)', function () {
    var element = compileSkeleton('<ge-skeleton></ge-skeleton>');
    var root = element.children()[0];
    var expected = geTv(geSkeletonTheme)({}).base;

    expect(root.className).toBe(expected);
    expect(root.className).toContain('animate-pulse');
    expect(root.className).toContain('rounded-md');
    expect(root.className).toContain('bg-[var(--ui-bg-elevated)]');
  });

  it('tem aria-hidden="true" e transclui o conteúdo', function () {
    var element = compileSkeleton(
      '<ge-skeleton><span class="child">Placeholder</span></ge-skeleton>'
    );
    var root = element.children()[0];
    var child = element[0].querySelector('.child');

    expect(root.getAttribute('aria-hidden')).toBe('true');
    expect(child).toBeDefined();
    expect(child).not.toBeNull();
    expect(child.textContent).toBe('Placeholder');
  });
});
