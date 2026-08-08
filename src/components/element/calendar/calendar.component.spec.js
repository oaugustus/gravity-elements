'use strict';

describe('geCalendar', function () {
  var $compile;
  var $rootScope;
  var $timeout;
  var host;
  var appRoot;
  var geTv;
  var geCalendarTheme;
  var df;

  beforeEach(function () {
    appRoot = document.createElement('div');
    document.body.appendChild(appRoot);
    angular.bootstrap(appRoot, ['gravityElements']);

    var injector = angular.element(appRoot).injector();
    $compile = injector.get('$compile');
    $rootScope = injector.get('$rootScope');
    $timeout = injector.get('$timeout');
    geTv = injector.get('geTv');
    geCalendarTheme = injector.get('geCalendarTheme');
    df = window.dateFns;

    host = document.createElement('div');
    appRoot.appendChild(host);
  });

  afterEach(function () {
    if (appRoot && appRoot.parentNode) {
      appRoot.parentNode.removeChild(appRoot);
    }
  });

  function compileCalendar(html, scopeExt) {
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

  function getVm(compiled) {
    return compiled.element.isolateScope().vm;
  }

  function fireKey(compiled, key) {
    var grid = compiled.element[0].querySelector('[data-ge-calendar-grid]');
    angular.element(grid).triggerHandler({ type: 'keydown', key: key });
    compiled.scope.$digest();
    try {
      $timeout.flush();
    } catch (e) {
      // sem $timeout pendente
    }
  }

  function dateKey(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1);
    var d = String(date.getDate());
    if (m.length < 2) {
      m = '0' + m;
    }
    if (d.length < 2) {
      d = '0' + d;
    }
    return y + '-' + m + '-' + d;
  }

  it('aplica defaultVariants (primary/solid/md/day) via geTv', function () {
    var compiled = compileCalendar(
      '<ge-calendar model-value="value"></ge-calendar>',
      { value: new Date(2026, 7, 15) }
    );
    var vm = getVm(compiled);
    var expected = geTv(geCalendarTheme)({
      color: 'primary',
      variant: 'solid',
      size: 'md',
      view: 'day',
    });

    expect(vm.classes.cellTrigger).toBe(expected.cellTrigger);
    expect(vm.classes.cellTrigger).toContain('size-8');
    expect(vm.classes.gridRow).toContain('grid-cols-7');
    expect(vm.headingLabel).toMatch(/August|agosto/i);
  });

  it('navegação por seta move o foco um dia', function () {
    var start = new Date(2026, 7, 15);
    var compiled = compileCalendar(
      '<ge-calendar model-value="value"></ge-calendar>',
      { value: start }
    );
    var vm = getVm(compiled);

    expect(df.isSameDay(vm.focusedDate, start)).toBe(true);

    fireKey(compiled, 'ArrowRight');
    vm = getVm(compiled);
    expect(df.isSameDay(vm.focusedDate, new Date(2026, 7, 16))).toBe(true);

    fireKey(compiled, 'ArrowLeft');
    vm = getVm(compiled);
    expect(df.isSameDay(vm.focusedDate, start)).toBe(true);
  });

  it('Home/End movem o foco para início/fim da semana', function () {
    var start = new Date(2026, 7, 12); // quarta-feira
    var compiled = compileCalendar(
      '<ge-calendar model-value="value"></ge-calendar>',
      { value: start }
    );

    fireKey(compiled, 'Home');
    var vm = getVm(compiled);
    var weekStart = df.startOfWeek(start, { weekStartsOn: 0 });
    expect(df.isSameDay(vm.focusedDate, weekStart)).toBe(true);

    fireKey(compiled, 'End');
    vm = getVm(compiled);
    var weekEnd = df.endOfWeek(start, { weekStartsOn: 0 });
    expect(df.isSameDay(vm.focusedDate, weekEnd)).toBe(true);
  });

  it('PageUp/PageDown trocam o mês exibido no heading', function () {
    var start = new Date(2026, 7, 15);
    var compiled = compileCalendar(
      '<ge-calendar model-value="value"></ge-calendar>',
      { value: start }
    );
    var vm = getVm(compiled);
    var augustLabel = vm.headingLabel;

    fireKey(compiled, 'PageDown');
    vm = getVm(compiled);
    expect(vm.headingLabel).not.toBe(augustLabel);
    expect(vm.viewMonth.getMonth()).toBe(8); // setembro
    expect(vm.headingLabel).toMatch(/September|setembro/i);

    fireKey(compiled, 'PageUp');
    vm = getVm(compiled);
    expect(vm.viewMonth.getMonth()).toBe(7);
    expect(vm.headingLabel).toBe(augustLabel);
  });

  it('Enter/Espaço seleciona o dia focado e dispara onUpdate', function () {
    var start = new Date(2026, 7, 15);
    var updates = [];
    var compiled = compileCalendar(
      '<ge-calendar model-value="value" on-update="onUpdate({ value: value })"></ge-calendar>',
      {
        value: start,
        onUpdate: function (locals) {
          updates.push(locals.value);
        },
      }
    );

    fireKey(compiled, 'ArrowRight');
    fireKey(compiled, 'Enter');
    expect(updates.length).toBe(1);
    expect(df.isSameDay(updates[0], new Date(2026, 7, 16))).toBe(true);

    fireKey(compiled, 'ArrowRight');
    fireKey(compiled, ' ');
    expect(updates.length).toBe(2);
    expect(df.isSameDay(updates[1], new Date(2026, 7, 17))).toBe(true);
  });

  it('minDate/maxDate desabilitam navegação além do intervalo', function () {
    var start = new Date(2026, 7, 15);
    var min = new Date(2026, 7, 10);
    var max = new Date(2026, 7, 20);
    var updates = [];
    var compiled = compileCalendar(
      '<ge-calendar model-value="value" min-date="min" max-date="max"' +
        ' on-update="onUpdate({ value: value })"></ge-calendar>',
      {
        value: start,
        min: min,
        max: max,
        onUpdate: function (locals) {
          updates.push(locals.value);
        },
      }
    );
    var vm = getVm(compiled);

    // Tenta ir para antes do min via setas repetidas
    var i;
    for (i = 0; i < 10; i += 1) {
      fireKey(compiled, 'ArrowLeft');
    }
    vm = getVm(compiled);
    expect(df.isBefore(vm.focusedDate, min)).toBe(false);
    expect(df.isSameDay(vm.focusedDate, min) || df.isAfter(vm.focusedDate, min)).toBe(
      true
    );

    // PageUp para julho deve ser bloqueado (mês inteiro antes do min)
    var headingBefore = vm.headingLabel;
    fireKey(compiled, 'PageUp');
    vm = getVm(compiled);
    expect(vm.headingLabel).toBe(headingBefore);
    expect(vm.prevMonthDisabled).toBe(true);

    // Dia além do max fica disabled no grid
    var disabledDay = compiled.element[0].querySelector(
      '[data-ge-calendar-day][data-date="' + dateKey(new Date(2026, 7, 25)) + '"]'
    );
    expect(disabledDay).toBeTruthy();
    expect(disabledDay.hasAttribute('disabled') || disabledDay.getAttribute('aria-disabled')).toBeTruthy();

    // Selecionar dia fora do intervalo não dispara update
    updates.length = 0;
    vm.selectDay({ date: new Date(2026, 7, 25), disabled: true });
    expect(updates.length).toBe(0);
  });

  it('atualiza seleção quando modelValue muda após montagem sem resetar foco válido', function () {
    var start = new Date(2026, 7, 15);
    var compiled = compileCalendar(
      '<ge-calendar model-value="value" min-date="min"></ge-calendar>',
      { value: start, min: null }
    );
    var vm = getVm(compiled);
    var focusedBefore = dateKey(vm.focusedDate);

    fireKey(compiled, 'ArrowRight');
    vm = getVm(compiled);
    var focusedAfterArrow = dateKey(vm.focusedDate);
    expect(focusedAfterArrow).not.toBe(focusedBefore);

    compiled.scope.value = new Date(2026, 7, 20);
    compiled.scope.$digest();
    vm = getVm(compiled);

    // Foco permanece no dia navegável; seleção reflete o novo modelValue.
    // Assert em vm.weeks (não no className/DOM cru): ngAnimate + ng-repeat
    // podem deixar o atributo assíncrono (§5.8).
    expect(dateKey(vm.focusedDate)).toBe(focusedAfterArrow);
    var selected = null;
    vm.weeks.forEach(function (week) {
      week.forEach(function (day) {
        if (day.selected) {
          selected = day;
        }
      });
    });
    expect(selected).toBeTruthy();
    expect(selected.key).toBe('2026-08-20');
  });

  it('escreve data-is-selected / data-is-disabled no DOM (não colide com BOOLEAN_ATTR)', function () {
    // §5.10: ng-attr-data-selected / ng-attr-data-disabled em <button> são
    // engolidos pelo BOOLEAN_ATTR do AngularJS — usamos data-is-*.
    var compiled = compileCalendar(
      '<ge-calendar model-value="value" min-date="min" max-date="max"></ge-calendar>',
      {
        value: new Date(2026, 7, 15),
        min: new Date(2026, 7, 10),
        max: new Date(2026, 7, 20),
      }
    );

    var selectedEl = compiled.element[0].querySelector(
      '[data-ge-calendar-day][data-is-selected]'
    );
    expect(selectedEl).toBeTruthy();
    expect(selectedEl.getAttribute('data-date')).toBe('2026-08-15');
    expect(selectedEl.getAttribute('data-is-selected')).toBe('true');

    var disabledEl = compiled.element[0].querySelector(
      '[data-ge-calendar-day][data-date="2026-08-25"][data-is-disabled]'
    );
    expect(disabledEl).toBeTruthy();
    expect(disabledEl.getAttribute('data-is-disabled')).toBe('true');

    // Nomes antigos que colidem com BOOLEAN_ATTR não devem aparecer
    expect(
      compiled.element[0].querySelector('[data-ge-calendar-day][data-selected]')
    ).toBeNull();
    expect(
      compiled.element[0].querySelector('[data-ge-calendar-day][data-disabled]')
    ).toBeNull();
  });
});
