(function () {
  'use strict';

  /**
   * geCalendar — grade de dias do mês com seleção e navegação por teclado.
   *
   * Paridade visual com Nuxt UI Calendar v4.10.0 (theme/calendar.ts +
   * Calendar.vue). Lógica com date-fns + tabbable (não @internationalized/date).
   * Só vista `day` (seleção de uma Date). Views month/year, range, multiple e
   * weekNumbers omitidos do template; permanecem no tema para safelist.
   *
   * ARIA (§5.5): role="grid"/row/gridcell, aria-selected, aria-label por dia
   * (date-fns format), heading com aria-live="polite".
   *
   * prev/next: <button> nativo aproximando geButton md/neutral/ghost/square
   * (aria-label no botão real — ge-button não propaga attrs HTML ao inner
   * <button>). Ícones CSS passthrough até geIcon (§5.4).
   *
   * @param {Date} [vm.modelValue] - data selecionada
   * @param {Function} [vm.onUpdate] - callback { value: Date }
   * @param {Date} [vm.minDate] - limite inferior (inclusive)
   * @param {Date} [vm.maxDate] - limite superior (inclusive)
   * @param {string} [vm.locale] - locale date-fns (ex. pt-BR, en-US)
   * @param {string} [vm.color='primary'] - primary|secondary|success|info|warning|error|neutral
   * @param {string} [vm.variant='solid'] - solid|outline|soft|subtle
   * @param {string} [vm.size='md'] - xs|sm|md|lg|xl
   */
  angular.module('gravityElements.element').component('geCalendar', {
    template:
      '<div class="{{ vm.classes.root }}">' +
      '  <div class="{{ vm.classes.header }}">' +
      '    <button type="button"' +
      '      class="rounded-md font-medium inline-flex items-center justify-center transition-colors size-8 text-sm text-[var(--ui-text-muted)] hover:bg-[var(--ui-border)] hover:text-[var(--ui-text-highlighted)] disabled:opacity-50"' +
      '      aria-label="Mês anterior"' +
      '      ng-disabled="vm.prevMonthDisabled"' +
      '      ng-click="vm.goToPrevMonth()">' +
      '      <i class="i-lucide-chevron-left size-5" aria-hidden="true"></i>' +
      '    </button>' +
      '    <div class="{{ vm.classes.heading }}">' +
      '      <span class="{{ vm.classes.headingLabel }}" aria-live="polite">{{ vm.headingLabel }}</span>' +
      '    </div>' +
      '    <button type="button"' +
      '      class="rounded-md font-medium inline-flex items-center justify-center transition-colors size-8 text-sm text-[var(--ui-text-muted)] hover:bg-[var(--ui-border)] hover:text-[var(--ui-text-highlighted)] disabled:opacity-50"' +
      '      aria-label="Próximo mês"' +
      '      ng-disabled="vm.nextMonthDisabled"' +
      '      ng-click="vm.goToNextMonth()">' +
      '      <i class="i-lucide-chevron-right size-5" aria-hidden="true"></i>' +
      '    </button>' +
      '  </div>' +
      '  <div class="{{ vm.classes.body }}">' +
      '    <div class="{{ vm.classes.grid }}" role="grid" tabindex="-1"' +
      '      ng-keydown="vm.handleKeydown($event)"' +
      '      data-ge-calendar-grid>' +
      '      <div class="{{ vm.classes.gridWeekDaysRow }}" role="row">' +
      '        <div ng-repeat="day in vm.weekDayLabels track by $index"' +
      '          class="{{ vm.classes.headCell }}" role="columnheader">{{ day }}</div>' +
      '      </div>' +
      '      <div class="{{ vm.classes.gridBody }}">' +
      '        <div ng-repeat="week in vm.weeks track by $index"' +
      '          class="{{ vm.classes.gridRow }}" role="row">' +
      '          <div ng-repeat="day in week track by day.key"' +
      '            class="{{ vm.classes.cell }}" role="gridcell"' +
      '            ng-attr-aria-selected="{{ day.selected ? \'true\' : \'false\' }}">' +
      '            <button type="button"' +
      '              class="{{ vm.classes.cellTrigger }}"' +
      '              data-ge-calendar-day' +
      '              data-date="{{ day.key }}"' +
      '              tabindex="{{ day.tabIndex }}"' +
      '              ng-attr-aria-label="{{ day.ariaLabel }}"' +
      '              ng-attr-aria-disabled="{{ day.disabled ? \'true\' : undefined }}"' +
      // data-is-selected / data-is-disabled (não data-selected/disabled):
      // AngularJS BOOLEAN_ATTR engole ng-attr-*-selected|disabled em <button>
      // — ver spec §5.10.
      '              ng-attr-data-is-selected="{{ day.selected ? \'true\' : undefined }}"' +
      '              ng-attr-data-today="{{ day.today ? \'true\' : undefined }}"' +
      '              ng-attr-data-is-disabled="{{ day.disabled ? \'true\' : undefined }}"' +
      '              ng-attr-data-outside-view="{{ day.outside ? \'true\' : undefined }}"' +
      '              ng-disabled="day.disabled"' +
      '              ng-click="vm.selectDay(day)">' +
      '              {{ day.label }}' +
      '            </button>' +
      '          </div>' +
      '        </div>' +
      '      </div>' +
      '    </div>' +
      '  </div>' +
      '</div>',
    controllerAs: 'vm',
    bindings: {
      modelValue: '<',
      onUpdate: '&',
      minDate: '<',
      maxDate: '<',
      locale: '@',
      color: '@',
      variant: '@',
      size: '@',
    },
    controller: CalendarController,
  });

  CalendarController.$inject = [
    'geTv',
    'geCalendarTheme',
    '$window',
    '$element',
    '$timeout',
  ];

  function CalendarController(geTv, geCalendarTheme, $window, $element, $timeout) {
    var vm = this;
    var df = null;
    var pendingFocus = false;

    vm.$onInit = onInit;
    vm.$onChanges = onChanges;
    vm.handleKeydown = handleKeydown;
    vm.selectDay = selectDay;
    vm.goToPrevMonth = goToPrevMonth;
    vm.goToNextMonth = goToNextMonth;

    function onInit() {
      ensureDateFns();
      ensureState(true);
      render();
    }

    function onChanges(changes) {
      ensureDateFns();
      ensureState(false);
      syncFocusAfterPropChange(changes);
      render();
    }

    function ensureDateFns() {
      if (!df) {
        df = $window.dateFns;
      }
      if (!df || typeof df.startOfMonth !== 'function') {
        throw new Error('geCalendar: window.dateFns não disponível');
      }
    }

    function ensureState(isInit) {
      if (!vm.viewMonth || isInit) {
        var initial = isValidDate(vm.modelValue) ? copyDate(vm.modelValue) : new Date();
        vm.viewMonth = df.startOfMonth(initial);
        vm.focusedDate = clampToRange(copyDate(initial));
      } else if (!vm.focusedDate) {
        vm.focusedDate = clampToRange(
          isValidDate(vm.modelValue) ? copyDate(vm.modelValue) : new Date()
        );
      }
    }

    function syncFocusAfterPropChange(changes) {
      if (!changes || !vm.focusedDate) {
        return;
      }
      // Não resetar foco só porque modelValue/min/max mudaram — só clamp
      // se o dia focado ficou inválido no intervalo.
      if (!isDateEnabled(vm.focusedDate)) {
        vm.focusedDate = clampToRange(vm.focusedDate);
        vm.viewMonth = df.startOfMonth(vm.focusedDate);
      }
    }

    function render() {
      var localeObj = resolveLocale();
      var weekStartsOn = resolveWeekStartsOn(localeObj);
      var formatOpts = localeObj ? { locale: localeObj } : undefined;

      vm.classes = geTv(geCalendarTheme)({
        color: vm.color || 'primary',
        variant: vm.variant || 'solid',
        size: vm.size || 'md',
        view: 'day',
      });

      vm.headingLabel = df.format(vm.viewMonth, 'MMMM yyyy', formatOpts);
      vm.weekDayLabels = buildWeekDayLabels(localeObj, weekStartsOn);
      vm.weeks = buildWeeks(localeObj, weekStartsOn, formatOpts);
      vm.prevMonthDisabled = !canMoveMonth(-1);
      vm.nextMonthDisabled = !canMoveMonth(1);

      if (pendingFocus) {
        pendingFocus = false;
        $timeout(focusFocusedDay, 0);
      }
    }

    function buildWeekDayLabels(localeObj, weekStartsOn) {
      var labels = [];
      var base = df.startOfWeek(new Date(2020, 5, 7), {
        weekStartsOn: weekStartsOn,
        locale: localeObj,
      });
      var i;
      for (i = 0; i < 7; i += 1) {
        labels.push(
          df.format(
            df.addDays(base, i),
            'EEEEEE',
            localeObj ? { locale: localeObj } : undefined
          )
        );
      }
      return labels;
    }

    function buildWeeks(localeObj, weekStartsOn, formatOpts) {
      var monthStart = df.startOfMonth(vm.viewMonth);
      var monthEnd = df.endOfMonth(vm.viewMonth);
      var gridStart = df.startOfWeek(monthStart, {
        weekStartsOn: weekStartsOn,
        locale: localeObj,
      });
      var gridEnd = df.endOfWeek(monthEnd, {
        weekStartsOn: weekStartsOn,
        locale: localeObj,
      });
      var days = df.eachDayOfInterval({ start: gridStart, end: gridEnd });
      while (days.length < 42) {
        days.push(df.addDays(days[days.length - 1], 1));
      }

      var weeks = [];
      var w;
      for (w = 0; w < 6; w += 1) {
        weeks.push(
          days.slice(w * 7, w * 7 + 7).map(function (date) {
            return buildDayCell(date, formatOpts);
          })
        );
      }
      return weeks;
    }

    function buildDayCell(date, formatOpts) {
      var key = toDateKey(date);
      var selected =
        isValidDate(vm.modelValue) && df.isSameDay(date, vm.modelValue);
      var focused = vm.focusedDate && df.isSameDay(date, vm.focusedDate);
      var disabled = !isDateEnabled(date);
      var outside = !df.isSameMonth(date, vm.viewMonth);
      return {
        date: date,
        key: key,
        label: df.format(date, 'd'),
        ariaLabel: df.format(date, 'PPPP', formatOpts),
        selected: selected,
        focused: focused,
        disabled: disabled,
        outside: outside,
        today: df.isToday(date),
        tabIndex: focused && !disabled ? 0 : -1,
      };
    }

    function handleKeydown($event) {
      var key = $event.key;
      var handled = true;

      if (key === 'ArrowLeft') {
        moveFocusByDays(-1);
      } else if (key === 'ArrowRight') {
        moveFocusByDays(1);
      } else if (key === 'ArrowUp') {
        moveFocusByDays(-7);
      } else if (key === 'ArrowDown') {
        moveFocusByDays(7);
      } else if (key === 'Home') {
        moveFocusToWeekEdge(true);
      } else if (key === 'End') {
        moveFocusToWeekEdge(false);
      } else if (key === 'PageUp') {
        shiftMonth(-1, true);
      } else if (key === 'PageDown') {
        shiftMonth(1, true);
      } else if (key === 'Enter' || key === ' ') {
        selectFocused();
      } else {
        handled = false;
      }

      if (handled) {
        $event.preventDefault();
        $event.stopPropagation();
      }
    }

    function moveFocusByDays(delta) {
      var candidate = df.addDays(vm.focusedDate, delta);
      if (!isDateEnabled(candidate)) {
        candidate = findEnabledToward(candidate, delta > 0 ? 1 : -1);
      }
      if (!candidate) {
        return;
      }
      setFocusedDate(candidate, true);
    }

    function moveFocusToWeekEdge(toStart) {
      var localeObj = resolveLocale();
      var weekStartsOn = resolveWeekStartsOn(localeObj);
      var edge = toStart
        ? df.startOfWeek(vm.focusedDate, {
            weekStartsOn: weekStartsOn,
            locale: localeObj,
          })
        : df.endOfWeek(vm.focusedDate, {
            weekStartsOn: weekStartsOn,
            locale: localeObj,
          });
      if (!isDateEnabled(edge)) {
        edge = findEnabledToward(edge, toStart ? 1 : -1);
      }
      if (!edge) {
        return;
      }
      setFocusedDate(edge, true);
    }

    function shiftMonth(delta, fromKeyboard) {
      if (!canMoveMonth(delta)) {
        return;
      }
      var nextMonth = df.addMonths(vm.viewMonth, delta);
      var day = vm.focusedDate.getDate();
      var candidate = new Date(
        nextMonth.getFullYear(),
        nextMonth.getMonth(),
        day
      );
      if (candidate.getMonth() !== nextMonth.getMonth()) {
        candidate = df.endOfMonth(nextMonth);
      }
      candidate = clampToRange(candidate);
      vm.viewMonth = df.startOfMonth(nextMonth);
      vm.focusedDate = candidate;
      if (fromKeyboard) {
        pendingFocus = true;
      }
      render();
    }

    function goToPrevMonth() {
      shiftMonth(-1, false);
    }

    function goToNextMonth() {
      shiftMonth(1, false);
    }

    function canMoveMonth(delta) {
      var target = df.addMonths(vm.viewMonth, delta);
      var targetStart = df.startOfMonth(target);
      var targetEnd = df.endOfMonth(target);
      if (
        isValidDate(vm.minDate) &&
        df.isBefore(targetEnd, startOfDay(vm.minDate))
      ) {
        return false;
      }
      if (
        isValidDate(vm.maxDate) &&
        df.isAfter(targetStart, startOfDay(vm.maxDate))
      ) {
        return false;
      }
      return true;
    }

    function selectFocused() {
      if (!vm.focusedDate || !isDateEnabled(vm.focusedDate)) {
        return;
      }
      emitUpdate(copyDate(vm.focusedDate));
    }

    function selectDay(day) {
      if (!day || day.disabled) {
        return;
      }
      setFocusedDate(day.date, false);
      emitUpdate(copyDate(day.date));
    }

    function emitUpdate(value) {
      if (typeof vm.onUpdate === 'function') {
        vm.onUpdate({ value: value });
      }
    }

    function setFocusedDate(date, shouldFocusDom) {
      vm.focusedDate = copyDate(date);
      if (!df.isSameMonth(date, vm.viewMonth)) {
        vm.viewMonth = df.startOfMonth(date);
      }
      pendingFocus = !!shouldFocusDom;
      render();
    }

    function focusFocusedDay() {
      var gridEl = $element[0].querySelector('[data-ge-calendar-grid]');
      if (!gridEl || !vm.focusedDate) {
        return;
      }
      var key = toDateKey(vm.focusedDate);
      var target = null;
      var tabApi = $window.tabbable;
      if (tabApi && typeof tabApi.focusable === 'function') {
        var nodes = tabApi.focusable(gridEl);
        var i;
        for (i = 0; i < nodes.length; i += 1) {
          if (nodes[i].getAttribute('data-date') === key) {
            target = nodes[i];
            break;
          }
        }
      }
      if (!target) {
        target = gridEl.querySelector(
          '[data-ge-calendar-day][data-date="' + key + '"]'
        );
      }
      if (target && typeof target.focus === 'function') {
        target.focus();
      }
    }

    function findEnabledToward(from, step) {
      var cursor = copyDate(from);
      var guard = 0;
      while (guard < 366) {
        if (isDateEnabled(cursor)) {
          return cursor;
        }
        cursor = df.addDays(cursor, step);
        if (
          isValidDate(vm.minDate) &&
          step < 0 &&
          df.isBefore(cursor, startOfDay(vm.minDate))
        ) {
          return null;
        }
        if (
          isValidDate(vm.maxDate) &&
          step > 0 &&
          df.isAfter(cursor, startOfDay(vm.maxDate))
        ) {
          return null;
        }
        guard += 1;
      }
      return null;
    }

    function isDateEnabled(date) {
      if (!isValidDate(date)) {
        return false;
      }
      var day = startOfDay(date);
      if (isValidDate(vm.minDate) && df.isBefore(day, startOfDay(vm.minDate))) {
        return false;
      }
      if (isValidDate(vm.maxDate) && df.isAfter(day, startOfDay(vm.maxDate))) {
        return false;
      }
      return true;
    }

    function clampToRange(date) {
      var day = startOfDay(date);
      if (isValidDate(vm.minDate) && df.isBefore(day, startOfDay(vm.minDate))) {
        return startOfDay(vm.minDate);
      }
      if (isValidDate(vm.maxDate) && df.isAfter(day, startOfDay(vm.maxDate))) {
        return startOfDay(vm.maxDate);
      }
      return day;
    }

    function resolveLocale() {
      if (!vm.locale || !df.locale) {
        return undefined;
      }
      var raw = String(vm.locale).trim();
      if (!raw) {
        return undefined;
      }
      var parts = raw.split(/[-_]/);
      var key = parts[0].toLowerCase();
      if (parts.length > 1) {
        key += parts[1].toUpperCase();
      }
      if (df.locale[key]) {
        return df.locale[key];
      }
      return undefined;
    }

    function resolveWeekStartsOn(localeObj) {
      if (
        localeObj &&
        localeObj.options &&
        typeof localeObj.options.weekStartsOn === 'number'
      ) {
        return localeObj.options.weekStartsOn;
      }
      return 0;
    }

    function startOfDay(date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    function copyDate(date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    function toDateKey(date) {
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

    function isValidDate(value) {
      return (
        Object.prototype.toString.call(value) === '[object Date]' &&
        !isNaN(value.getTime())
      );
    }
  }
})();
