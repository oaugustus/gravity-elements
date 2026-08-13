'use strict';

describe('geProgress', function () {
  var $compile;
  var $rootScope;
  var host;
  var appRoot;
  var geTv;
  var geProgressTheme;
  var STEP_LABELS;

  beforeEach(function () {
    appRoot = document.createElement('div');
    document.body.appendChild(appRoot);
    angular.bootstrap(appRoot, ['gravityElements']);

    var injector = angular.element(appRoot).injector();
    $compile = injector.get('$compile');
    $rootScope = injector.get('$rootScope');
    geTv = injector.get('geTv');
    geProgressTheme = injector.get('geProgressTheme');

    host = document.createElement('div');
    appRoot.appendChild(host);

    STEP_LABELS = [
      'Waiting...',
      'Cloning...',
      'Migrating...',
      'Deploying...',
      'Done!',
    ];
  });

  afterEach(function () {
    if (appRoot && appRoot.parentNode) {
      appRoot.parentNode.removeChild(appRoot);
    }
  });

  function compileProgress(html, scopeExt) {
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

  function expectedClasses(props) {
    return geTv(geProgressTheme)(props);
  }

  it('calcula aria-valuenow/percent e transform do indicador para value/max dados', function () {
    var compiled = compileProgress(
      '<ge-progress value="value" max="max" status="showStatus"></ge-progress>',
      { value: 25, max: 100, showStatus: true }
    );
    var vm = compiled.element.isolateScope().vm;
    var bar = compiled.element[0].querySelector('[role="progressbar"]');
    var expected = expectedClasses({
      color: 'primary',
      size: 'md',
      orientation: 'horizontal',
      inverted: false,
      animation: 'carousel',
    });

    expect(vm.classes.root).toBe(expected.root);
    expect(vm.classes.base).toBe(expected.base);
    expect(vm.classes.indicator).toBe(expected.indicator);
    expect(vm.classes.base).toContain('h-2');
    expect(vm.classes.indicator).toContain('bg-[var(--ui-primary)]');
    expect(vm.percent).toBe(25);
    expect(vm.ariaValueNow).toBe(25);
    expect(vm.ariaValueMax).toBe(100);
    expect(vm.indicatorStyle).toEqual({ transform: 'translateX(-75%)' });
    expect(vm.showStatus).toBe(true);
    expect(bar.getAttribute('role')).toBe('progressbar');
    expect(bar.getAttribute('aria-valuemin')).toBe('0');
    expect(bar.getAttribute('aria-valuemax')).toBe('100');
    expect(bar.getAttribute('aria-valuenow')).toBe('25');
    expect(bar.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('estado indeterminate (sem value) omite aria-valuenow e aplica data-state', function () {
    var compiled = compileProgress('<ge-progress></ge-progress>');
    var vm = compiled.element.isolateScope().vm;
    var bar = compiled.element[0].querySelector('[role="progressbar"]');
    var indicator = bar.querySelector('[class*="rounded-full"]');

    expect(vm.isIndeterminate).toBe(true);
    expect(vm.percent).toBeUndefined();
    expect(vm.ariaValueNow).toBeUndefined();
    expect(vm.dataState).toBe('indeterminate');
    expect(vm.indicatorStyle).toBeUndefined();
    expect(vm.showStatus).toBe(false);
    expect(bar.hasAttribute('aria-valuenow')).toBe(false);
    expect(indicator.getAttribute('data-state')).toBe('indeterminate');
    expect(vm.classes.indicator).toContain(
      'motion-reduce:data-[state=indeterminate]:animate-pulse'
    );
    expect(vm.classes.indicator).toContain(
      'motion-safe:data-[state=indeterminate]:animate-[carousel_2s_ease-in-out_infinite]'
    );
  });

  it('atualiza percent/aria quando value muda após montagem', function () {
    var compiled = compileProgress(
      '<ge-progress value="value" max="100"></ge-progress>',
      { value: 10 }
    );
    var vm = compiled.element.isolateScope().vm;

    expect(vm.percent).toBe(10);
    expect(vm.ariaValueNow).toBe(10);
    expect(vm.indicatorStyle.transform).toBe('translateX(-90%)');

    compiled.scope.value = 50;
    compiled.scope.$digest();
    vm = compiled.element.isolateScope().vm;

    expect(vm.percent).toBe(50);
    expect(vm.ariaValueNow).toBe(50);
    expect(vm.indicatorStyle.transform).toBe('translateX(-50%)');
    expect(vm.isIndeterminate).toBe(false);
  });

  it('orientation horizontal default aplica h-* no base e aria-orientation', function () {
    var compiled = compileProgress(
      '<ge-progress value="50"></ge-progress>'
    );
    var vm = compiled.element.isolateScope().vm;
    var bar = compiled.element[0].querySelector('[role="progressbar"]');
    var expected = expectedClasses({
      color: 'primary',
      size: 'md',
      orientation: 'horizontal',
      inverted: false,
      animation: 'carousel',
    });

    expect(vm.resolvedOrientation).toBe('horizontal');
    expect(vm.classes.root).toBe(expected.root);
    expect(vm.classes.root).toContain('w-full');
    expect(vm.classes.root).toContain('flex-col');
    expect(vm.classes.base).toContain('h-2');
    expect(vm.classes.base).not.toContain('w-2');
    expect(bar.getAttribute('aria-orientation')).toBe('horizontal');
  });

  it('orientation vertical aplica w-* no base, flex-row-reverse e translateY', function () {
    var compiled = compileProgress(
      '<ge-progress value="value" orientation="{{ orientation }}"></ge-progress>',
      { value: 25, orientation: 'vertical' }
    );
    var vm = compiled.element.isolateScope().vm;
    var bar = compiled.element[0].querySelector('[role="progressbar"]');
    var expected = expectedClasses({
      color: 'primary',
      size: 'md',
      orientation: 'vertical',
      inverted: false,
      animation: 'carousel',
    });

    expect(vm.classes.root).toBe(expected.root);
    expect(vm.classes.root).toContain('h-full');
    expect(vm.classes.root).toContain('flex-row-reverse');
    expect(vm.classes.base).toContain('w-2');
    expect(vm.classes.base).not.toContain('h-2');
    expect(vm.indicatorStyle).toEqual({ transform: 'translateY(-75%)' });
    expect(vm.statusStyle).toEqual({ height: '25%' });
    expect(bar.getAttribute('aria-orientation')).toBe('vertical');
  });

  it('inverted horizontal usa translateX positivo e flex-row-reverse no status', function () {
    var compiled = compileProgress(
      '<ge-progress value="value" status="true" inverted="isInverted"></ge-progress>',
      { value: 25, isInverted: true }
    );
    var vm = compiled.element.isolateScope().vm;
    var expected = expectedClasses({
      color: 'primary',
      size: 'md',
      orientation: 'horizontal',
      inverted: true,
      animation: 'carousel',
    });

    expect(vm.classes.status).toBe(expected.status);
    expect(vm.classes.status).toContain('flex-row-reverse');
    expect(vm.classes.status).toContain('self-end');
    expect(vm.indicatorStyle).toEqual({ transform: 'translateX(75%)' });
  });

  it('inverted vertical usa translateY positivo e flex-col-reverse no status', function () {
    var compiled = compileProgress(
      '<ge-progress value="value" orientation="vertical" inverted="isInverted" status="true"></ge-progress>',
      { value: 40, isInverted: true }
    );
    var vm = compiled.element.isolateScope().vm;
    var expected = expectedClasses({
      color: 'primary',
      size: 'md',
      orientation: 'vertical',
      inverted: true,
      animation: 'carousel',
    });

    expect(vm.classes.status).toBe(expected.status);
    expect(vm.classes.status).toContain('flex-col-reverse');
    expect(vm.classes.steps).toContain('items-start');
    expect(vm.indicatorStyle).toEqual({ transform: 'translateY(60%)' });
  });

  it('animation default carousel aplica compound motion-safe no indicator', function () {
    var compiled = compileProgress('<ge-progress></ge-progress>');
    var vm = compiled.element.isolateScope().vm;

    expect(vm.classes.indicator).toContain(
      'motion-safe:data-[state=indeterminate]:animate-[carousel_2s_ease-in-out_infinite]'
    );
    expect(vm.classes.indicator).toContain(
      'motion-safe:data-[state=indeterminate]:rtl:animate-[carousel-rtl_2s_ease-in-out_infinite]'
    );
    expect(vm.classes.indicator).not.toContain(
      'animate-[swing_2s_ease-in-out_infinite]'
    );
  });

  it('animation swing (e elastic vertical) substituem o compound do indicator', function () {
    var compiled = compileProgress(
      '<ge-progress animation="{{ animation }}"></ge-progress>',
      { animation: 'swing' }
    );
    var vm = compiled.element.isolateScope().vm;

    expect(vm.classes.indicator).toContain(
      'motion-safe:data-[state=indeterminate]:animate-[swing_2s_ease-in-out_infinite]'
    );
    expect(vm.classes.indicator).not.toContain(
      'animate-[carousel_2s_ease-in-out_infinite]'
    );

    compiled = compileProgress(
      '<ge-progress animation="elastic" orientation="vertical"></ge-progress>'
    );
    vm = compiled.element.isolateScope().vm;

    expect(vm.classes.indicator).toContain(
      'motion-safe:data-[state=indeterminate]:animate-[elastic-vertical_2s_ease-in-out_infinite]'
    );
  });

  it('max como array renderiza steps e calcula percent contra length-1', function () {
    var compiled = compileProgress(
      '<ge-progress value="value" max="maxSteps"></ge-progress>',
      { value: 3, maxSteps: STEP_LABELS }
    );
    var vm = compiled.element.isolateScope().vm;
    var bar = compiled.element[0].querySelector('[role="progressbar"]');
    var stepEls = compiled.element[0].querySelectorAll(
      '[class*="row-start-1"]'
    );

    expect(vm.hasSteps).toBe(true);
    expect(vm.steps.length).toBe(5);
    expect(vm.percent).toBe(75);
    expect(vm.ariaValueMax).toBe(4);
    expect(vm.ariaValueNow).toBe(3);
    expect(bar.getAttribute('aria-valuemax')).toBe('4');
    expect(stepEls.length).toBe(5);
    expect(vm.steps[3].label).toBe('Deploying...');
    expect(vm.steps[3].classes).toContain('opacity-100');
    expect(vm.steps[0].classes).toContain('opacity-0');
    expect(vm.steps[1].classes).toContain('opacity-0');
    expect(vm.steps[2].classes).toContain('opacity-0');
    expect(vm.steps[4].classes).toContain('opacity-0');
  });

  it('max array com value 0 aplica variant first no primeiro step', function () {
    var compiled = compileProgress(
      '<ge-progress value="value" max="maxSteps"></ge-progress>',
      { value: 0, maxSteps: STEP_LABELS }
    );
    var vm = compiled.element.isolateScope().vm;
    var expectedFirst = expectedClasses({
      color: 'primary',
      size: 'md',
      orientation: 'horizontal',
      inverted: false,
      animation: 'carousel',
      step: 'first',
    });

    expect(vm.percent).toBe(0);
    expect(vm.steps[0].classes).toBe(expectedFirst.step);
    expect(vm.steps[0].classes).toContain('opacity-100');
    expect(vm.steps[0].classes).toContain('text-[var(--ui-text-muted)]');
    expect(vm.steps[1].classes).toContain('opacity-0');
    expect(vm.steps[4].classes).toContain('opacity-0');
  });

  it('atualiza orientation e max array após montagem', function () {
    var compiled = compileProgress(
      '<ge-progress value="value" max="maxVal" orientation="{{ orientation }}"></ge-progress>',
      { value: 25, maxVal: 100, orientation: 'horizontal' }
    );
    var vm = compiled.element.isolateScope().vm;
    var bar = compiled.element[0].querySelector('[role="progressbar"]');

    expect(vm.classes.base).toContain('h-2');
    expect(bar.getAttribute('aria-orientation')).toBe('horizontal');
    expect(vm.hasSteps).toBe(false);
    expect(vm.indicatorStyle.transform).toBe('translateX(-75%)');

    compiled.scope.orientation = 'vertical';
    compiled.scope.maxVal = STEP_LABELS;
    compiled.scope.value = 3;
    compiled.scope.$digest();
    vm = compiled.element.isolateScope().vm;
    bar = compiled.element[0].querySelector('[role="progressbar"]');

    expect(vm.classes.base).toContain('w-2');
    expect(vm.classes.root).toContain('flex-row-reverse');
    expect(bar.getAttribute('aria-orientation')).toBe('vertical');
    expect(vm.hasSteps).toBe(true);
    expect(vm.steps.length).toBe(5);
    expect(vm.percent).toBe(75);
    expect(vm.ariaValueMax).toBe(4);
    expect(vm.indicatorStyle.transform).toBe('translateY(-25%)');
  });
});
