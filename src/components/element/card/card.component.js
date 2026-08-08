(function () {
  'use strict';

  /**
   * geCard — container de conteúdo com header/body/footer (Element).
   *
   * Paridade com Nuxt UI Card v4.10.0 (theme/card.ts + Card.vue).
   * Tabela §7 listava `—` (sem bindings); upstream tem `variant` / `title` /
   * `description` (§5.4.2). Multi-slot (§5.3 / decisão como geFooter):
   * header / title / description / default (body) / footer — slots do tema
   * batem com Card.vue; não slot único.
   *
   * Uso:
   *   <ge-card title="Título" description="Sub" variant="outline">
   *     <ge-card-header>...</ge-card-header>   <!-- substitui title+desc -->
   *     conteúdo default → body
   *     <ge-card-footer>...</ge-card-footer>
   *   </ge-card>
   *
   * @param {string} [vm.variant='outline'] - solid|outline|soft|subtle
   * @param {string} [vm.title]
   * @param {string} [vm.description]
   */
  angular.module('gravityElements.element').component('geCard', {
    template:
      '<div class="{{ vm.classes.root }}">' +
      // header slot: classes no mesmo nó do ng-transclude (precedente Footer).
      '  <div ng-if="vm.hasHeaderSlot" class="{{ vm.classes.header }}" ng-transclude="header"></div>' +
      '  <div ng-if="!vm.hasHeaderSlot && vm.hasHeader" class="{{ vm.classes.header }}">' +
      '    <div ng-if="vm.hasTitle" class="{{ vm.classes.title }}">' +
      '      <span ng-if="vm.hasTitleSlot" ng-transclude="title"></span>' +
      '      <span ng-if="!vm.hasTitleSlot">{{ vm.title }}</span>' +
      '    </div>' +
      '    <div ng-if="vm.hasDescription" class="{{ vm.classes.description }}">' +
      '      <span ng-if="vm.hasDescriptionSlot" ng-transclude="description"></span>' +
      '      <span ng-if="!vm.hasDescriptionSlot">{{ vm.description }}</span>' +
      '    </div>' +
      '  </div>' +
      '  <div ng-if="vm.hasBody" class="{{ vm.classes.body }}" ng-transclude></div>' +
      '  <div ng-if="vm.hasFooter" class="{{ vm.classes.footer }}" ng-transclude="footer"></div>' +
      '</div>',
    controllerAs: 'vm',
    transclude: {
      header: '?geCardHeader',
      title: '?geCardTitle',
      description: '?geCardDescription',
      footer: '?geCardFooter',
    },
    bindings: {
      variant: '@',
      title: '@',
      description: '@',
    },
    controller: CardController,
  });

  CardController.$inject = ['geTv', 'geCardTheme', '$transclude'];

  function CardController(geTv, geCardTheme, $transclude) {
    var vm = this;
    vm.$onInit = render;
    vm.$onChanges = render;

    function render() {
      vm.resolvedVariant = vm.variant || 'outline';
      vm.classes = geTv(geCardTheme)({
        variant: vm.resolvedVariant,
      });

      vm.hasHeaderSlot = $transclude.isSlotFilled('header');
      vm.hasTitleSlot = $transclude.isSlotFilled('title');
      vm.hasDescriptionSlot = $transclude.isSlotFilled('description');
      vm.hasFooter = $transclude.isSlotFilled('footer');
      // Slot default não entra em $$slots — isSlotFilled() sem nome não serve.
      // Probe via $transclude (paridade Vue !!slots.default); clone não anexado.
      vm.hasBody = isDefaultSlotFilled();

      vm.hasTitle = vm.hasTitleSlot || !!(vm.title && String(vm.title).trim());
      vm.hasDescription =
        vm.hasDescriptionSlot ||
        !!(vm.description && String(vm.description).trim());
      // Card.vue: header se slot header OU title OU description.
      vm.hasHeader =
        vm.hasHeaderSlot || vm.hasTitle || vm.hasDescription;
    }

    function isDefaultSlotFilled() {
      var filled = false;
      $transclude(function (clone) {
        var i;
        var node;
        for (i = 0; i < clone.length; i++) {
          node = clone[i];
          if (node.nodeType === 1) {
            filled = true;
            break;
          }
          if (
            node.nodeType === 3 &&
            node.nodeValue &&
            node.nodeValue.trim()
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
