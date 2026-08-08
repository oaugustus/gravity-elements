(function () {
  'use strict';

  /**
   * geFieldGroup — agrupamento visual de inputs/botões adjacentes (Element).
   *
   * Paridade com Nuxt UI FieldGroup v4.10.0 (theme/field-group.ts +
   * FieldGroup.vue). Nesta etapa é só o wrapper visual (bordas coladas via
   * -space-x/y-px + variant fieldGroup nos filhos); inputs de formulário
   * nascem na Etapa 2.
   *
   * Bindings §7 `size` + extra `orientation` (§5.4.2 — prop real do
   * FieldGroup.vue com efeito no tema; default 'horizontal').
   * Transclusion de slot único (§5.3).
   *
   * Filhos geBadge/geButton herdam size/orientation via
   * `require: '?^^geFieldGroup'` (paridade useFieldGroup / AvatarGroup).
   * Limitação conhecida (§5.9, mesmo padrão AvatarGroup): mudança de
   * size/orientation do grupo depois que os filhos já montaram não
   * re-renderiza filhos existentes — só leem o pai no próprio
   * $onInit/$onChanges. O wrapper atualiza as próprias classes via
   * $onChanges.
   *
   * @param {string} [vm.size='md'] - xs|sm|md|lg|xl (propaga aos filhos)
   * @param {string} [vm.orientation='horizontal'] - horizontal|vertical
   */
  angular.module('gravityElements.element').component('geFieldGroup', {
    template: '<div class="{{ vm.classes.base }}" ng-transclude></div>',
    controllerAs: 'vm',
    transclude: true,
    bindings: {
      size: '@',
      orientation: '@',
    },
    controller: FieldGroupController,
  });

  FieldGroupController.$inject = ['geTv', 'geFieldGroupTheme'];

  function FieldGroupController(geTv, geFieldGroupTheme) {
    var vm = this;
    vm.$onInit = render;
    vm.$onChanges = render;

    function render() {
      // Expor resolvidos no controller para filhos via require
      vm.size = vm.size || 'md';
      vm.orientation = vm.orientation || 'horizontal';
      vm.classes = geTv(geFieldGroupTheme)({
        size: vm.size,
        orientation: vm.orientation,
      });
    }
  }
})();
