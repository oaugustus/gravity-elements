(function () {
  'use strict';

  /**
   * geCollapsible — painel expansível/colapsável (Element).
   *
   * Paridade com Nuxt UI Collapsible v4.10.0 (theme/collapsible.ts +
   * Collapsible.vue / Reka Collapsible). Transição de altura via ngAnimate
   * (classes .ge-collapsible.ng-enter/leave + aliases .ge-collapsible-enter/
   * leave em gravity-elements.css) — sem animação JS (§5.8).
   *
   * Bindings §7 + extras `defaultOpen` / `unmountOnHide` (§5.4.2 — props
   * reais do Collapsible.vue). Slots: default = trigger; content =
   * `#content` via `<ge-collapsible-content>`.
   *
   * ARIA (§5.5): aria-expanded + aria-controls (geId) no trigger; painel
   * com aria-hidden quando fechado. data-state open|closed (não data-open —
   * §5.10 BOOLEAN_ATTR).
   *
   * Uso:
   *   <ge-collapsible model-value="open" on-update="open = value">
   *     <ge-button label="Abrir"></ge-button>
   *     <ge-collapsible-content>Conteúdo</ge-collapsible-content>
   *   </ge-collapsible>
   *
   * Duplo tab-stop (2026-08-13, encontrado em revisão, não reportado pelo
   * usuário): upstream usa `<CollapsibleTrigger as-child>` — Reka injeta
   * aria-expanded/aria-controls/data-state direto no elemento real que o
   * consumidor passa (ex.: um UButton), sem criar wrapper próprio, então só
   * existe UM elemento focável. AngularJS não tem equivalente de `as-child`
   * (clonar attrs pro filho); a única opção estrutural aqui é a `<div
   * class="ge-collapsible-trigger">` de fato existir no DOM como host da
   * ARIA/ng-click. Problema: o `ngAria` (módulo em gravityElements.core)
   * detecta `ng-click` sem role nativo e injeta `role="button"` +
   * `tabindex="0"` nessa div automaticamente — e se o conteúdo transcluído
   * já for ele mesmo focável nativamente (ex.: o exemplo "Usage" do demo usa
   * <ge-button>, cujo <button> interno já tem seu próprio tabindex), o
   * resultado são DOIS tab-stops adjacentes pra um único controle lógico: a
   * div (role=button, com todo o estado ARIA) e o botão interno (sem
   * nenhum aria-expanded/controls, name computado só do próprio label).
   * Confirmado via inspeção do DOM/tab order ao vivo (2 focusable stops
   * adjacentes de 31 na página demo). Fix: `$postLink` desabilita o tab-stop
   * de qualquer descendente nativamente focável dentro do trigger
   * (`tabindex="-1"`), preservando a div wrapper como único elemento focável
   * — o nome acessível da div continua computado a partir do texto do
   * descendente (accessible-name computation não depende de tabindex).
   * Escopo: scan único no $postLink (conteúdo do trigger é tipicamente
   * estático); não reobserva mudanças dinâmicas no slot default.
   *
   * @param {boolean} [vm.modelValue] - aberto/fechado (controlado)
   * @param {Function} [vm.onUpdate] - callback { value: boolean }
   * @param {boolean} [vm.disabled] - bloqueia o toggle
   * @param {boolean} [vm.defaultOpen=false] - estado inicial se modelValue omitido
   * @param {boolean} [vm.unmountOnHide=true] - ng-if no painel quando true
   */
  angular.module('gravityElements.element').component('geCollapsible', {
    template:
      '<div class="{{ vm.classes.root }}" ng-attr-data-state="{{ vm.dataState }}">' +
      '  <div class="ge-collapsible-trigger"' +
      '    ng-click="vm.toggle()"' +
      '    ng-attr-aria-expanded="{{ vm.isOpen ? \'true\' : \'false\' }}"' +
      '    ng-attr-aria-controls="{{ vm.panelId }}"' +
      '    ng-attr-aria-disabled="{{ vm.isDisabled ? \'true\' : undefined }}"' +
      '    ng-attr-data-state="{{ vm.dataState }}"' +
      '    ng-transclude></div>' +
      '  <div id="{{ vm.panelId }}"' +
      '    class="{{ vm.classes.content }}"' +
      '    ng-if="vm.panelMounted"' +
      '    ng-show="vm.panelVisible"' +
      '    ng-attr-data-state="{{ vm.dataState }}"' +
      '    ng-attr-aria-hidden="{{ vm.isOpen ? undefined : \'true\' }}">' +
      '    <div ng-transclude="content"></div>' +
      '  </div>' +
      '</div>',
    controllerAs: 'vm',
    transclude: {
      content: '?geCollapsibleContent',
    },
    bindings: {
      modelValue: '<',
      onUpdate: '&',
      disabled: '<',
      defaultOpen: '<',
      unmountOnHide: '<',
    },
    controller: CollapsibleController,
  });

  CollapsibleController.$inject = ['$element', 'geTv', 'geCollapsibleTheme', 'geId'];

  function CollapsibleController($element, geTv, geCollapsibleTheme, geId) {
    var vm = this;
    var initialized = false;

    vm.$onInit = onInit;
    vm.$onChanges = onChanges;
    vm.$postLink = postLink;
    vm.toggle = toggle;

    function onInit() {
      vm.panelId = geId.next('ge-collapsible');
      if (vm.modelValue !== undefined) {
        vm.isOpen = vm.modelValue === true;
      } else {
        vm.isOpen = vm.defaultOpen === true;
      }
      initialized = true;
      render();
    }

    function onChanges(changes) {
      // $onChanges roda antes de $onInit na 1ª passagem — esperar init.
      if (!initialized) {
        return;
      }
      if (changes.modelValue && vm.modelValue !== undefined) {
        vm.isOpen = vm.modelValue === true;
      }
      render();
    }

    function toggle() {
      if (vm.disabled === true) {
        return;
      }
      var next = !vm.isOpen;
      vm.isOpen = next;
      render();
      if (typeof vm.onUpdate === 'function') {
        vm.onUpdate({ value: next });
      }
    }

    function render() {
      vm.isDisabled = vm.disabled === true;
      vm.dataState = vm.isOpen ? 'open' : 'closed';
      // Vue default unmountOnHide: true
      vm.shouldUnmount = vm.unmountOnHide !== false;
      vm.panelMounted = vm.shouldUnmount ? vm.isOpen : true;
      // Com unmount, ng-if controla presença; ng-show fica true enquanto montado.
      vm.panelVisible = vm.shouldUnmount ? true : vm.isOpen;
      vm.classes = geTv(geCollapsibleTheme)();
    }

    // Elimina o duplo tab-stop quando o conteúdo transcluído do trigger já
    // é nativamente focável (ver comentário no topo do arquivo).
    function postLink() {
      var trigger = $element[0].querySelector('.ge-collapsible-trigger');
      if (!trigger) {
        return;
      }
      var focusable = trigger.querySelectorAll(
        'a[href], button, input, select, textarea, [tabindex]'
      );
      for (var i = 0; i < focusable.length; i++) {
        focusable[i].setAttribute('tabindex', '-1');
      }
    }
  }
})();
