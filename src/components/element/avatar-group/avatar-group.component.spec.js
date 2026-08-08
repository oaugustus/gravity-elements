'use strict';

describe('geAvatarGroup', function () {
  var $compile;
  var $rootScope;
  var host;
  var appRoot;
  var geTv;
  var geAvatarGroupTheme;

  beforeEach(function () {
    appRoot = document.createElement('div');
    document.body.appendChild(appRoot);
    angular.bootstrap(appRoot, ['gravityElements']);

    var injector = angular.element(appRoot).injector();
    $compile = injector.get('$compile');
    $rootScope = injector.get('$rootScope');
    geTv = injector.get('geTv');
    geAvatarGroupTheme = injector.get('geAvatarGroupTheme');

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

  function memberAvatars(root) {
    return Array.prototype.filter.call(root.querySelectorAll('ge-avatar'), function (el) {
      return el.getAttribute('data-ge-avatar-group-overflow') !== 'true';
    });
  }

  function overflowAvatar(root) {
    return root.querySelector('ge-avatar[data-ge-avatar-group-overflow="true"]');
  }

  function isHidden(el) {
    return el.classList.contains('hidden');
  }

  it('menos que max: todos visíveis, sem +N', function () {
    var compiled = compileGroup(
      '<ge-avatar-group max="3">' +
        '<ge-avatar text="A"></ge-avatar>' +
        '<ge-avatar text="B"></ge-avatar>' +
        '</ge-avatar-group>'
    );
    var root = compiled.element.children()[0];
    var expected = geTv(geAvatarGroupTheme)({
      size: 'md',
      color: 'neutral',
    });
    var members = memberAvatars(root);

    expect(root.className).toBe(expected.root);
    expect(root.className).toContain('flex-row-reverse');
    expect(members.length).toBe(2);
    expect(isHidden(members[0])).toBe(false);
    expect(isHidden(members[1])).toBe(false);
    expect(overflowAvatar(root)).toBeNull();
  });

  it('exatamente max: todos visíveis, sem +N', function () {
    var compiled = compileGroup(
      '<ge-avatar-group max="3">' +
        '<ge-avatar text="A"></ge-avatar>' +
        '<ge-avatar text="B"></ge-avatar>' +
        '<ge-avatar text="C"></ge-avatar>' +
        '</ge-avatar-group>'
    );
    var root = compiled.element.children()[0];
    var members = memberAvatars(root);

    expect(members.length).toBe(3);
    members.forEach(function (el) {
      expect(isHidden(el)).toBe(false);
    });
    expect(overflowAvatar(root)).toBeNull();
  });

  it('mais que max: excedente hidden, +N com aria-label', function () {
    var compiled = compileGroup(
      '<ge-avatar-group max="2">' +
        '<ge-avatar text="A"></ge-avatar>' +
        '<ge-avatar text="B"></ge-avatar>' +
        '<ge-avatar text="C"></ge-avatar>' +
        '<ge-avatar text="D"></ge-avatar>' +
        '<ge-avatar text="E"></ge-avatar>' +
        '</ge-avatar-group>'
    );
    var root = compiled.element.children()[0];
    var members = memberAvatars(root);
    var overflow = overflowAvatar(root);
    var visible = members.filter(function (el) {
      return !isHidden(el);
    });
    var hidden = members.filter(isHidden);
    var overflowRoot = overflow && overflow.querySelector('[aria-label]');

    var visibleTexts = visible
      .map(function (el) {
        return el.querySelector('[aria-hidden="true"]').textContent;
      })
      .sort();

    expect(members.length).toBe(5);
    expect(visible.length).toBe(2);
    expect(hidden.length).toBe(3);
    expect(overflow).not.toBeNull();
    expect(overflow.textContent.trim()).toBe('+3');
    expect(overflowRoot).not.toBeNull();
    expect(overflowRoot.getAttribute('aria-label')).toBe('mais 3');
    // Visíveis = primeiros do slot (A,B); DOM pode estar reversed (Vue)
    expect(visibleTexts).toEqual(['A', 'B']);
  });
});

