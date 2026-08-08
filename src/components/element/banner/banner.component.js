(function () {
  'use strict';

  /**
   * geBanner — faixa promocional/anúncio no topo (Element).
   *
   * Paridade com Nuxt UI Banner v4.10.0 (theme/banner.ts + Banner.vue).
   * Bindings da §7 + `closeIcon` / `to` (§5.4.2 — slots/variants do tema).
   * Persistência `id` + localStorage/useHead omitida (Nuxt SSR/prehydrate).
   * Prop `actions[]` omitida — ações via transclusion até existir geButton.
   *
   * icon / closeIcon: classe CSS inline até existir geIcon (§5.4) — trocar
   * por <ge-icon> quando a tarefa "Componente: Icon" for concluída.
   *
   * close: <button> nativo aproximando UButton md/neutral/ghost até existir
   * geButton (§5.4.1) — trocar por <ge-button> quando a tarefa
   * "Componente: Button" for concluída.
   *
   * ARIA (§5.5): role="alert" se color for error|warning; senão role="status".
   *
   * @param {string} [vm.title]
   * @param {string} [vm.icon] - nome/classe CSS do ícone (passthrough)
   * @param {string} [vm.color='primary'] - primary|secondary|success|info|warning|error|neutral
   * @param {boolean} [vm.closable] - mostra o botão de fechar
   * @param {Function} [vm.onClose] - callback ao fechar
   * @param {string} [vm.closeIcon='i-lucide-x'] - classe CSS do ícone de fechar
   * @param {string} [vm.to] - URL; ativa variant `to` + overlay <a>
   */
  angular.module('gravityElements.element').component('geBanner', {
    template:
      '<div ng-if="vm.open" role="{{ vm.role }}"' +
      '  class="{{ vm.classes.root }}">' +
      '  <a ng-if="vm.to"' +
      '    ng-href="{{ vm.to }}"' +
      '    class="absolute inset-0"' +
      '    aria-label="{{ vm.title }}"></a>' +
      '  <ge-container>' +
      '    <div class="{{ vm.classes.container }}">' +
      '      <div class="{{ vm.classes.left }}"></div>' +
      '      <div class="{{ vm.classes.center }}">' +
      // Ícone CSS passthrough (§5.4) até existir geIcon — trocar por <ge-icon>
      '        <i ng-if="vm.icon"' +
      '          class="{{ vm.icon }} {{ vm.classes.icon }}"' +
      '          aria-hidden="true"></i>' +
      '        <div ng-if="vm.title" class="{{ vm.classes.title }}">{{ vm.title }}</div>' +
      '        <div ng-if="vm.hasActions"' +
      '          class="{{ vm.classes.actions }}"' +
      '          ng-transclude></div>' +
      '      </div>' +
      '      <div class="{{ vm.classes.right }}">' +
      // Placeholder §5.4.1 — substituir por <ge-button> após Componente: Button
      '        <button ng-if="vm.closable"' +
      '          type="button"' +
      '          class="rounded-md font-medium inline-flex items-center justify-center transition-colors size-8 text-sm {{ vm.classes.close }}"' +
      '          aria-label="Fechar"' +
      '          ng-click="vm.handleClose()">' +
      '          <i class="{{ vm.resolvedCloseIcon }} size-5" aria-hidden="true"></i>' +
      '        </button>' +
      '      </div>' +
      '    </div>' +
      '  </ge-container>' +
      '</div>',
    controllerAs: 'vm',
    transclude: true,
    bindings: {
      title: '@',
      icon: '@',
      color: '@',
      closable: '<',
      onClose: '&',
      closeIcon: '@',
      to: '@',
    },
    controller: BannerController,
  });

  BannerController.$inject = ['geTv', 'geBannerTheme', '$transclude'];

  function BannerController(geTv, geBannerTheme, $transclude) {
    var vm = this;
    vm.$onInit = onInit;
    vm.handleClose = handleClose;

    function onInit() {
      var color = vm.color || 'primary';
      var hasTo = !!(vm.to && vm.to.length);

      vm.open = true;
      vm.resolvedCloseIcon = vm.closeIcon || 'i-lucide-x';
      vm.hasActions = hasDefaultTransclude();
      vm.role =
        color === 'error' || color === 'warning' ? 'alert' : 'status';

      vm.classes = geTv(geBannerTheme)({
        color: color,
        to: hasTo,
      });
    }

    function handleClose() {
      vm.open = false;
      if (typeof vm.onClose === 'function') {
        vm.onClose();
      }
    }

    function hasDefaultTransclude() {
      var filled = false;
      $transclude(function (clone) {
        var i;
        for (i = 0; i < clone.length; i += 1) {
          if (clone[i].nodeType === 1) {
            filled = true;
            break;
          }
          if (
            clone[i].nodeType === 3 &&
            clone[i].textContent &&
            clone[i].textContent.trim()
          ) {
            filled = true;
            break;
          }
        }
      });
      return filled;
    }
  }
})();
