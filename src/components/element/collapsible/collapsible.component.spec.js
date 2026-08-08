'use strict';

describe('geCollapsible', function () {
  var $compile;
  var $rootScope;
  var host;
  var appRoot;
  var geTv;
  var geCollapsibleTheme;

  beforeEach(function () {
    appRoot = document.createElement('div');
    document.body.appendChild(appRoot);
    angular.bootstrap(appRoot, ['gravityElements']);

    var injector = angular.element(appRoot).injector();
    $compile = injector.get('$compile');
    $rootScope = injector.get('$rootScope');
    geTv = injector.get('geTv');
    geCollapsibleTheme = injector.get('geCollapsibleTheme');

    host = document.createElement('div');
    appRoot.appendChild(host);
  });

  afterEach(function () {
    if (appRoot && appRoot.parentNode) {
      appRoot.parentNode.removeChild(appRoot);
    }
  });

  function compileCollapsible(html, scopeExt) {
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

  function triggerEl(element) {
    return element[0].querySelector('.ge-collapsible-trigger');
  }

  function panelEl(element) {
    var vm = element.isolateScope().vm;
    return element[0].querySelector('#' + vm.panelId);
  }

  /**
   * Poll até a condição ser true ou timeout (§5.8 — ngAnimate assíncrono).
   * onSuccess / onTimeout separados — o callback de sucesso NÃO é o `done`
   * do Jasmine (não tem `.fail`).
   */
  function settle(conditionFn, onSuccess, onTimeout, timeoutMs) {
    var start = Date.now();
    var limit = timeoutMs || 2000;

    function tick() {
      try {
        $rootScope.$digest();
      } catch (e) {
        // digest já em andamento — ignorar
      }
      if (conditionFn()) {
        onSuccess();
        return;
      }
      if (Date.now() - start > limit) {
        onTimeout('settle timeout after ' + limit + 'ms');
        return;
      }
      setTimeout(tick, 50);
    }

    setTimeout(tick, 50);
  }

  it('abre e aplica aria-expanded=true + remove aria-hidden do painel', function (done) {
    var updates = [];
    var compiled = compileCollapsible(
      '<ge-collapsible model-value="open" on-update="onUpdate({ value: value })">' +
        '<span>Trigger</span>' +
        '<ge-collapsible-content>Painel</ge-collapsible-content>' +
        '</ge-collapsible>',
      {
        open: false,
        onUpdate: function (locals) {
          updates.push(locals.value);
          compiled.scope.open = locals.value;
        },
      }
    );
    var trigger = triggerEl(compiled.element);
    var expected = geTv(geCollapsibleTheme)();

    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    expect(panelEl(compiled.element)).toBeNull();
    expect(compiled.element.isolateScope().vm.classes.content).toBe(
      expected.content
    );

    trigger.click();
    compiled.scope.$digest();

    // Preferir vm (§5.8); painel no DOM pode atrasar com ngAnimate.
    settle(
      function () {
        var vm = compiled.element.isolateScope().vm;
        return (
          vm.isOpen === true &&
          updates.length === 1 &&
          updates[0] === true &&
          triggerEl(compiled.element).getAttribute('aria-expanded') === 'true'
        );
      },
      function () {
        var panel = panelEl(compiled.element);
        var vm = compiled.element.isolateScope().vm;

        expect(updates).toEqual([true]);
        expect(triggerEl(compiled.element).getAttribute('aria-expanded')).toBe(
          'true'
        );
        expect(triggerEl(compiled.element).getAttribute('aria-controls')).toBe(
          vm.panelId
        );
        expect(vm.isOpen).toBe(true);
        expect(vm.panelMounted).toBe(true);
        expect(vm.dataState).toBe('open');
        // Painel pode ainda estar em ng-enter; se já no DOM, checar ARIA.
        if (panel) {
          expect(panel.getAttribute('aria-hidden')).not.toBe('true');
          expect(panel.getAttribute('data-state')).toBe('open');
          expect(panel.textContent).toContain('Painel');
        }
        done();
      },
      function (msg) {
        done.fail(msg);
      }
    );
  });

  it('fecha e reverte aria-expanded / painel', function (done) {
    var compiled = compileCollapsible(
      '<ge-collapsible model-value="open" on-update="onUpdate({ value: value })">' +
        '<span>Trigger</span>' +
        '<ge-collapsible-content>Painel</ge-collapsible-content>' +
        '</ge-collapsible>',
      {
        open: true,
        onUpdate: function (locals) {
          compiled.scope.open = locals.value;
        },
      }
    );

    expect(triggerEl(compiled.element).getAttribute('aria-expanded')).toBe(
      'true'
    );
    expect(compiled.element.isolateScope().vm.panelMounted).toBe(true);

    triggerEl(compiled.element).click();
    compiled.scope.$digest();

    settle(
      function () {
        var vm = compiled.element.isolateScope().vm;
        return (
          vm.isOpen === false &&
          vm.panelMounted === false &&
          triggerEl(compiled.element).getAttribute('aria-expanded') === 'false'
        );
      },
      function () {
        var vm = compiled.element.isolateScope().vm;

        expect(triggerEl(compiled.element).getAttribute('aria-expanded')).toBe(
          'false'
        );
        expect(vm.isOpen).toBe(false);
        expect(vm.panelMounted).toBe(false);
        expect(vm.dataState).toBe('closed');
        done();
      },
      function (msg) {
        done.fail(msg);
      }
    );
  });

  it('disabled: true — toggle não muda o estado', function () {
    var updates = [];
    var compiled = compileCollapsible(
      '<ge-collapsible model-value="open" disabled="disabled"' +
        ' on-update="onUpdate({ value: value })">' +
        '<span>Trigger</span>' +
        '<ge-collapsible-content>Painel</ge-collapsible-content>' +
        '</ge-collapsible>',
      {
        open: false,
        disabled: true,
        onUpdate: function (locals) {
          updates.push(locals.value);
        },
      }
    );
    var vm = compiled.element.isolateScope().vm;
    var trigger = triggerEl(compiled.element);

    expect(vm.isOpen).toBe(false);
    expect(trigger.getAttribute('aria-disabled')).toBe('true');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    trigger.click();
    compiled.scope.$digest();

    vm = compiled.element.isolateScope().vm;
    expect(vm.isOpen).toBe(false);
    expect(updates.length).toBe(0);
    expect(panelEl(compiled.element)).toBeNull();
    expect(triggerEl(compiled.element).getAttribute('aria-expanded')).toBe(
      'false'
    );
  });

  it('atualiza isOpen quando modelValue muda após montagem', function () {
    var compiled = compileCollapsible(
      '<ge-collapsible model-value="open">' +
        '<span>Trigger</span>' +
        '<ge-collapsible-content>Painel</ge-collapsible-content>' +
        '</ge-collapsible>',
      { open: false }
    );
    var vm = compiled.element.isolateScope().vm;

    expect(vm.isOpen).toBe(false);

    compiled.scope.open = true;
    compiled.scope.$digest();
    // Assert em vm (não className do DOM) — §5.8
    vm = compiled.element.isolateScope().vm;
    expect(vm.isOpen).toBe(true);
    expect(vm.dataState).toBe('open');
    expect(vm.panelMounted).toBe(true);

    compiled.scope.open = false;
    compiled.scope.$digest();
    vm = compiled.element.isolateScope().vm;
    expect(vm.isOpen).toBe(false);
    expect(vm.dataState).toBe('closed');
  });
});
