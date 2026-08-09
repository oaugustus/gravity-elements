(function () {
  'use strict';

  /**
   * Mapa estático de teclas especiais (paridade useKbd.ts v4.10.0).
   * Simplificação §7: sem detecção de macOS para meta/alt/ctrl — omitidas;
   * use `command`/`control`/`option` ou texto literal.
   */
  var KBD_KEYS_MAP = {
    win: '\u229E',
    command: '\u2318',
    shift: '\u21E7',
    control: '\u2303',
    option: '\u2325',
    enter: '\u21B5',
    delete: '\u2326',
    backspace: '\u232B',
    escape: 'Esc',
    tab: '\u21E5',
    capslock: '\u21EA',
    arrowup: '\u2191',
    arrowright: '\u2192',
    arrowdown: '\u2193',
    arrowleft: '\u2190',
    pageup: '\u21DE',
    pagedown: '\u21DF',
    home: '\u2196',
    end: '\u2198',
  };

  /**
   * geKbd — tecla de atalho (Element).
   *
   * Paridade com Nuxt UI Kbd v4.10.0 (theme/kbd.ts + Kbd.vue + useKbd.ts).
   *
   * Decisões de API (§7):
   * - Só binding `value` (`@`) — paridade 1:1 com Kbd.vue upstream; combinações
   *   tipo Ctrl+K = vários `<ge-kbd>` em sequência, não array `keys`.
   * - Transclusion opcional: slot default substitui o texto resolvido de `value`.
   * - Mapa de símbolos estático; sem detecção de SO para meta/alt/ctrl.
   *
   * Uso:
   *   <ge-kbd value="shift"></ge-kbd>
   *   <ge-kbd value="command"></ge-kbd><ge-kbd value="k"></ge-kbd>
   *   <ge-kbd color="primary" variant="soft" size="lg">Custom</ge-kbd>
   *
   * @param {string} [vm.value] - nome da tecla (mapa ou texto bruto)
   * @param {string} [vm.color='neutral'] - primary|secondary|success|info|warning|error|neutral
   * @param {string} [vm.variant='outline'] - solid|outline|soft|subtle
   * @param {string} [vm.size='md'] - sm|md|lg
   */
  angular.module('gravityElements.element').component('geKbd', {
    template:
      '<kbd class="{{ vm.classes.base }}" ng-transclude>{{ vm.displayValue }}</kbd>',
    controllerAs: 'vm',
    transclude: true,
    bindings: {
      value: '@',
      color: '@',
      variant: '@',
      size: '@',
    },
    controller: KbdController,
  });

  KbdController.$inject = ['geTv', 'geKbdTheme'];

  function KbdController(geTv, geKbdTheme) {
    var vm = this;
    vm.$onInit = render;
    vm.$onChanges = render;

    function render() {
      vm.displayValue = getKbdKey(vm.value);
      vm.classes = geTv(geKbdTheme)({
        color: vm.color || 'neutral',
        variant: vm.variant || 'outline',
        size: vm.size || 'md',
      });
    }

    function getKbdKey(value) {
      if (value === undefined || value === null || String(value) === '') {
        return '';
      }

      var key = String(value);
      return Object.prototype.hasOwnProperty.call(KBD_KEYS_MAP, key)
        ? KBD_KEYS_MAP[key]
        : key;
    }
  }
})();
