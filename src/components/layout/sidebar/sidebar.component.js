(function () {
  'use strict';

  /**
   * geSidebar — barra lateral de layout (Layout).
   *
   * Paridade desktop com Nuxt UI Sidebar v4.10.0 (theme/sidebar.ts +
   * Sidebar.vue). Tema completo (13 slots + variants); rail não renderizado
   * nesta tarefa (aditivo, §6); overlay mobile (Modal/Slideover/Drawer)
   * adiado para Etapa 4 — mesmo precedente do geHeader.
   *
   * collapsible === 'none': aside inline (só inner; wrapper com `contents`).
   * collapsible offcanvas|icon: gap spacer + container fixed + data-state.
   *
   * header slot custom (2026-08-13, bug real apontado pelo usuário via
   * screenshot — × colado ao label em vez de na borda direita): a div do
   * slot `header` (ng-transclude="header") não tinha `flex-1`, então não
   * empurrava a div `actions` (com o botão de toggle/×) pra ponta do header
   * — os dois ficavam left-aligned, lado a lado, com todo o espaço vazio
   * sobrando à direita. Corrigido com `min-w-0 flex-1` na div do slot
   * (mesma classe que `wrapper` já usa pro caso title/description — Sidebar
   * upstream, ao contrário do AngularJS aqui, troca o fallback inteiro
   * (wrapper+actions) pelo conteúdo do slot custom via `<slot name="header">
   * ...fallback...</slot>`; replicar esse comportamento full built-in do Vue
   * exigiria reestruturar o transclude — fora de escopo dessa correção
   * pontual, que só resolve o alinhamento visual reportado).
   *
   * Toggle: <button> nativo (§5.4.1) até existir geButton — trocar depois.
   *
   * Uso:
   *   <ge-sidebar side="left" collapsible="offcanvas" open="vm.open"
   *               on-toggle="vm.onToggle(open)" title="Menu">
   *     <ge-sidebar-header>...</ge-sidebar-header>
   *     nav default → body
   *     <ge-sidebar-footer>...</ge-sidebar-footer>
   *   </ge-sidebar>
   *
   * @param {string} [vm.side='left'] - 'left' | 'right'
   * @param {string} [vm.collapsible='none'] - 'offcanvas' | 'icon' | 'none'
   * @param {string} [vm.variant='sidebar'] - 'sidebar' | 'floating' | 'inset'
   * @param {boolean} [vm.open=true] - two-way; expanded quando true
   * @param {string} [vm.title]
   * @param {string} [vm.description]
   * @param {Function} [vm.onToggle] - callback({ open })
   * @param {Function} [vm.onOpenChange] - callback({ open })
   */
  angular.module('gravityElements.layout').component('geSidebar', {
    template:
      '<aside class="{{ vm.classes.root }}"' +
      '  ng-attr-data-state="{{ vm.isCollapsible ? vm.dataState : undefined }}"' +
      '  ng-attr-data-collapsible="{{ vm.dataCollapsible }}"' +
      '  data-variant="{{ vm.resolvedVariant }}"' +
      '  ng-attr-data-side="{{ vm.isCollapsible ? vm.resolvedSide : undefined }}">' +
      '  <div ng-if="vm.isCollapsible" class="{{ vm.classes.gap }}" data-state="{{ vm.dataState }}"></div>' +
      // `contents` quando none: wrapper some do box tree (equiv. branch Vue sem container)
      '  <div class="{{ vm.containerClass }}"' +
      '    ng-attr-data-state="{{ vm.isCollapsible ? vm.dataState : undefined }}">' +
      '    <div class="{{ vm.classes.inner }}">' +
      '      <div ng-if="vm.hasHeader" class="{{ vm.classes.header }}">' +
      '        <div ng-if="vm.hasHeaderSlot" class="min-w-0 flex-1" ng-transclude="header"></div>' +
      '        <div ng-if="!vm.hasHeaderSlot && vm.hasWrapper" class="{{ vm.classes.wrapper }}">' +
      '          <p ng-if="vm.hasTitle" class="{{ vm.classes.title }}">' +
      '            <span ng-if="vm.hasTitleSlot" ng-transclude="title"></span>' +
      '            <span ng-if="!vm.hasTitleSlot">{{ vm.title }}</span>' +
      '          </p>' +
      '          <p ng-if="vm.hasDescription" class="{{ vm.classes.description }}">' +
      '            <span ng-if="vm.hasDescriptionSlot" ng-transclude="description"></span>' +
      '            <span ng-if="!vm.hasDescriptionSlot">{{ vm.description }}</span>' +
      '          </p>' +
      '        </div>' +
      '        <div ng-if="vm.hasActions || vm.showToggle" class="{{ vm.classes.actions }}">' +
      '          <div ng-if="vm.hasActions" ng-transclude="actions"></div>' +
      // Placeholder §5.4.1 — substituir por <ge-button> após Componente: Button
      '          <button type="button" ng-if="vm.showToggle"' +
      '            class="{{ vm.classes.close }} rounded-md font-medium inline-flex items-center justify-center transition-colors size-8 text-sm text-[var(--ui-text-muted)] hover:bg-[var(--ui-border)] hover:text-[var(--ui-text-highlighted)]"' +
      '            aria-label="Alternar barra lateral"' +
      '            aria-expanded="{{ vm.open }}"' +
      '            ng-click="vm.toggle()">×</button>' +
      '        </div>' +
      '      </div>' +
      '      <div class="{{ vm.classes.body }}" ng-transclude></div>' +
      '      <div ng-if="vm.hasFooter" class="{{ vm.classes.footer }}" ng-transclude="footer"></div>' +
      '    </div>' +
      '  </div>' +
      '</aside>',
    controllerAs: 'vm',
    transclude: {
      header: '?geSidebarHeader',
      title: '?geSidebarTitle',
      description: '?geSidebarDescription',
      actions: '?geSidebarActions',
      footer: '?geSidebarFooter',
    },
    bindings: {
      side: '@',
      collapsible: '@',
      variant: '@',
      open: '=?',
      title: '@',
      description: '@',
      onToggle: '&',
      onOpenChange: '&',
    },
    controller: SidebarController,
  });

  SidebarController.$inject = ['geTv', 'geSidebarTheme', '$transclude'];

  function SidebarController(geTv, geSidebarTheme, $transclude) {
    var vm = this;
    vm.$onInit = onInit;
    vm.$onChanges = onChanges;
    vm.toggle = toggle;

    function onInit() {
      if (vm.open === undefined) {
        vm.open = true;
      }
      // resolveTheme antes de syncSlots — hasHeader depende de showToggle
      resolveTheme();
      syncSlots();
      syncState();
    }

    function onChanges(changes) {
      if (
        changes.side ||
        changes.collapsible ||
        changes.variant ||
        changes.title ||
        changes.description
      ) {
        resolveTheme();
        syncSlots();
        syncState();
      }
      // open é `=` — $onChanges não cobre; sync no toggle + $doCheck
    }

    var prevOpen;
    vm.$doCheck = function doCheck() {
      if (vm.open !== prevOpen) {
        prevOpen = vm.open;
        syncState();
      }
    };

    function resolveTheme() {
      vm.resolvedSide = vm.side || 'left';
      vm.resolvedCollapsible = vm.collapsible || 'none';
      vm.resolvedVariant = vm.variant || 'sidebar';
      vm.isCollapsible = vm.resolvedCollapsible !== 'none';
      vm.showToggle = vm.isCollapsible;
      vm.classes = geTv(geSidebarTheme)({
        side: vm.resolvedSide,
        collapsible: vm.resolvedCollapsible,
        variant: vm.resolvedVariant,
        transition: true,
      });
      vm.containerClass = vm.isCollapsible ? vm.classes.container : 'contents';
    }

    function syncSlots() {
      vm.hasHeaderSlot = $transclude.isSlotFilled('header');
      vm.hasTitleSlot = $transclude.isSlotFilled('title');
      vm.hasDescriptionSlot = $transclude.isSlotFilled('description');
      vm.hasActions = $transclude.isSlotFilled('actions');
      vm.hasFooter = $transclude.isSlotFilled('footer');
      vm.hasTitle = vm.hasTitleSlot || !!(vm.title && String(vm.title).trim());
      vm.hasDescription =
        vm.hasDescriptionSlot ||
        !!(vm.description && String(vm.description).trim());
      vm.hasWrapper = vm.hasTitle || vm.hasDescription;
      vm.hasHeader =
        vm.hasHeaderSlot ||
        vm.hasWrapper ||
        vm.hasActions ||
        vm.showToggle;
    }

    function syncState() {
      vm.dataState = vm.open ? 'expanded' : 'collapsed';
      // Espelha Sidebar.vue: data-collapsible só quando collapsed + collapsible
      if (vm.isCollapsible && !vm.open) {
        vm.dataCollapsible = vm.resolvedCollapsible;
      } else {
        vm.dataCollapsible = undefined;
      }
    }

    function toggle() {
      vm.open = !vm.open;
      syncState();
      if (typeof vm.onToggle === 'function') {
        vm.onToggle({ open: vm.open });
      }
      if (typeof vm.onOpenChange === 'function') {
        vm.onOpenChange({ open: vm.open });
      }
    }
  }
})();
