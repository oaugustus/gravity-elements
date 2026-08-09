(function () {
  'use strict';

  /**
   * geSkeleton — placeholder visual de carregamento (Element).
   *
   * Paridade com Nuxt UI Skeleton v4.10.0 (theme/skeleton.ts + Skeleton.vue):
   * só classes de tema (pulse via CSS/Tailwind); sem bindings (§7).
   * Props Vue `as`/`ui`/`class` não portadas.
   *
   * ARIA (§5.5): aria-hidden="true" — é só placeholder visual, não deve ser
   * anunciado por leitor de tela. Diferente do upstream (role="alert" +
   * aria-live / aria-busy / aria-label="loading"); a spec deste projeto é a
   * fonte de verdade nesse ponto.
   *
   * Sem $onChanges: nenhuma prop reativa — geTv(geSkeletonTheme)() uma vez
   * no $onInit já basta.
   *
   * Transclusion: conteúdo opcional (ex. dimensões via classe externa no host
   * ou filho) como o <slot/> do upstream.
   */
  angular.module('gravityElements.element').component('geSkeleton', {
    template:
      '<div aria-hidden="true" class="{{ vm.classes.base }}" ng-transclude></div>',
    controllerAs: 'vm',
    transclude: true,
    controller: SkeletonController,
  });

  SkeletonController.$inject = ['geTv', 'geSkeletonTheme'];

  function SkeletonController(geTv, geSkeletonTheme) {
    var vm = this;
    vm.$onInit = onInit;

    function onInit() {
      vm.classes = geTv(geSkeletonTheme)({});
    }
  }
})();
