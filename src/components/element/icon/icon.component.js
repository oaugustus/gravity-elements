(function () {
  'use strict';

  /**
   * geIcon — ícone fino via classe CSS (Element).
   *
   * Deliberadamente sem sistema de ícones embutido (fora de escopo §5.4 / §10).
   * O binding `name` é aplicado como classe CSS no `<i>`; cabe ao app
   * consumidor registrar uma fonte compatível (Iconify via
   * `@iconify/tailwind`, Font Awesome, etc.).
   *
   * Paridade com Nuxt UI Icon v4.10.0 é só de API (`name` / `size`) — o
   * upstream resolve via `@nuxt/icon` e não tem `theme/icon.ts`; o tamanho
   * aqui é variant do `geTv` (decisão interna — ver `icon.theme.js`).
   *
   * Uso:
   *   <ge-icon name="i-lucide-check" size="md"></ge-icon>
   *
   * @param {string} vm.name - classe CSS do ícone (ex. `i-lucide-check`)
   * @param {string} [vm.size='md'] - 3xs|2xs|xs|sm|md|lg|xl|2xl|3xl
   */
  angular.module('gravityElements.element').component('geIcon', {
    template:
      '<i class="{{ vm.name }} {{ vm.classes.base }}" aria-hidden="true"></i>',
    controllerAs: 'vm',
    bindings: {
      name: '@',
      size: '@',
    },
    controller: IconController,
  });

  IconController.$inject = ['geTv', 'geIconTheme'];

  function IconController(geTv, geIconTheme) {
    var vm = this;
    vm.$onInit = render;
    vm.$onChanges = render;

    function render() {
      vm.classes = geTv(geIconTheme)({
        size: vm.size || 'md',
      });
    }
  }
})();
