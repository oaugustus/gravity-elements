(function () {
  'use strict';

  /**
   * geAlert — callout para chamar atenção do usuário (Element).
   *
   * Paridade com Nuxt UI Alert v4.10.0 (theme/alert.ts + Alert.vue).
   * Bindings da §7 + `orientation` / `closeIcon` (§5.4.2 — variants/slots
   * do tema upstream). avatar/actions omitidos do template (dependem de
   * geAvatar/geButton); slots permanecem no tema para safelist.
   *
   * icon / closeIcon: classe CSS inline até existir geIcon (§5.4) — trocar
   * por <ge-icon> quando a tarefa "Componente: Icon" for concluída.
   *
   * close: <button> nativo aproximando UButton md/neutral/link até existir
   * geButton (§5.4.1) — trocar por <ge-button> quando a tarefa
   * "Componente: Button" for concluída.
   *
   * @param {string} [vm.title]
   * @param {string} [vm.description]
   * @param {string} [vm.color='primary'] - primary|secondary|success|info|warning|error|neutral
   * @param {string} [vm.variant='solid'] - solid|outline|soft|subtle
   * @param {string} [vm.icon] - nome/classe CSS do ícone (passthrough)
   * @param {boolean} [vm.closable] - mostra o botão de fechar
   * @param {Function} [vm.onClose] - callback ao fechar
   * @param {string} [vm.orientation='vertical'] - vertical|horizontal
   * @param {string} [vm.closeIcon='i-lucide-x'] - classe CSS do ícone de fechar
   */
  angular.module('gravityElements.element').component('geAlert', {
    template:
      '<div ng-if="vm.open" role="alert"' +
      '  class="{{ vm.classes.root }}"' +
      '  data-orientation="{{ vm.resolvedOrientation }}">' +
      // Ícone CSS passthrough (§5.4) até existir geIcon — trocar por <ge-icon>
      '  <i ng-if="vm.icon" class="{{ vm.icon }} {{ vm.classes.icon }}" aria-hidden="true"></i>' +
      '  <div class="{{ vm.classes.wrapper }}">' +
      '    <div ng-if="vm.title" class="{{ vm.classes.title }}">{{ vm.title }}</div>' +
      '    <div ng-if="vm.description" class="{{ vm.classes.description }}">{{ vm.description }}</div>' +
      '  </div>' +
      '  <div ng-if="vm.closable" class="{{ vm.classes.actions }}">' +
      // Placeholder §5.4.1 — substituir por <ge-button> após Componente: Button
      '    <button type="button"' +
      '      class="rounded-md font-medium inline-flex items-center justify-center transition-colors size-8 text-sm text-current hover:opacity-75 {{ vm.classes.close }}"' +
      '      aria-label="Fechar"' +
      '      ng-click="vm.handleClose()">' +
      '      <i class="{{ vm.resolvedCloseIcon }} size-5" aria-hidden="true"></i>' +
      '    </button>' +
      '  </div>' +
      '</div>',
    controllerAs: 'vm',
    bindings: {
      title: '@',
      description: '@',
      color: '@',
      variant: '@',
      icon: '@',
      closable: '<',
      onClose: '&',
      orientation: '@',
      closeIcon: '@',
    },
    controller: AlertController,
  });

  AlertController.$inject = ['geTv', 'geAlertTheme'];

  function AlertController(geTv, geAlertTheme) {
    var vm = this;
    vm.$onInit = onInit;
    vm.handleClose = handleClose;

    function onInit() {
      vm.open = true;
      vm.resolvedOrientation = vm.orientation || 'vertical';
      vm.resolvedCloseIcon = vm.closeIcon || 'i-lucide-x';
      // Dimensão booleana `title` do tema (mt-1 em description) ≠ binding string.
      vm.classes = geTv(geAlertTheme)({
        color: vm.color || 'primary',
        variant: vm.variant || 'solid',
        orientation: vm.resolvedOrientation,
        title: !!vm.title,
      });
    }

    function handleClose() {
      vm.open = false;
      if (typeof vm.onClose === 'function') {
        vm.onClose();
      }
    }
  }
})();
