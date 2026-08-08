(function () {
  'use strict';

  /**
   * geAvatarGroup — agrupamento de avatares com overlap e colapso +N (Element).
   *
   * Paridade com Nuxt UI AvatarGroup v4.10.0 (theme/avatar-group.ts +
   * AvatarGroup.vue). Bindings da §7 + `color` (§5.4.2 — prop/provide e
   * variant do tema upstream).
   *
   * Em $postLink: conta filhos ge-avatar, aplica overlap (slot base do tema
   * via require no geAvatar), esconde excedente (> max) e prepende avatar
   * +N com aria-label "mais N" (§5.5). Ordem DOM espelha Vue
   * ([+N, ...visíveisReversed] + flex-row-reverse).
   *
   * @param {number} [vm.max] - máximo de avatares visíveis (além disso, +N)
   * @param {string} [vm.size='md'] - 3xs|2xs|xs|sm|md|lg|xl|2xl|3xl (propaga)
   * @param {string} [vm.color='neutral'] - propaga aos filhos (§5.4.2)
   */
  angular.module('gravityElements.element').component('geAvatarGroup', {
    template:
      '<div class="{{ vm.classes.root }}" ng-transclude></div>',
    controllerAs: 'vm',
    transclude: true,
    bindings: {
      max: '<',
      size: '@',
      color: '@',
    },
    controller: AvatarGroupController,
  });

  AvatarGroupController.$inject = [
    'geTv',
    'geAvatarGroupTheme',
    '$element',
    '$compile',
    '$scope',
  ];

  function AvatarGroupController(
    geTv,
    geAvatarGroupTheme,
    $element,
    $compile,
    $scope
  ) {
    var vm = this;
    var overflowEl = null;
    var synced = false;
    // Ordem original do slot — após o 1º reverse o DOM não é mais fonte da verdade
    var members = null;

    vm.$onInit = onInit;
    vm.$postLink = onPostLink;
    vm.$onChanges = onChanges;
    vm.getBaseClass = getBaseClass;

    function onInit() {
      refreshTheme();
    }

    function onPostLink() {
      synced = true;
      syncChildren();
    }

    function onChanges(changes) {
      if (!vm.classes) {
        return;
      }
      var hasLaterChange = Object.keys(changes).some(function (key) {
        return !changes[key].isFirstChange();
      });
      if (!hasLaterChange) {
        return;
      }
      refreshTheme();
      if (synced) {
        syncChildren();
      }
    }

    function refreshTheme() {
      vm.size = vm.size || 'md';
      vm.color = vm.color || 'neutral';
      vm.classes = geTv(geAvatarGroupTheme)({
        size: vm.size,
        color: vm.color,
      });
    }

    function getBaseClass() {
      return vm.classes ? vm.classes.base : '';
    }

    function syncChildren() {
      var root = $element.children()[0];
      if (!root) {
        return;
      }

      removeOverflow(root);

      if (!members) {
        members = getMemberAvatars(root);
      }
      var avatars = members;
      var max = resolveMax();
      var i;

      for (i = 0; i < avatars.length; i++) {
        avatars[i].classList.remove('hidden');
      }

      var visible;
      var hiddenCount = 0;

      if (!max || max <= 0 || avatars.length <= max) {
        visible = avatars.slice();
      } else {
        hiddenCount = avatars.length - max;
        visible = avatars.slice(0, max);
        var hidden = avatars.slice(max);
        for (i = 0; i < hidden.length; i++) {
          hidden[i].classList.add('hidden');
        }
      }

      // Vue sempre faz reverse dos visíveis (+ flex-row-reverse = ordem do slot)
      for (i = visible.length - 1; i >= 0; i--) {
        root.appendChild(visible[i]);
      }

      if (hiddenCount <= 0) {
        return;
      }

      var overflowHtml =
        '<ge-avatar text="+' +
        hiddenCount +
        '" alt="mais ' +
        hiddenCount +
        '"' +
        (vm.size ? ' size="' + vm.size + '"' : '') +
        (vm.color ? ' color="' + vm.color + '"' : '') +
        ' data-ge-avatar-group-overflow="true"></ge-avatar>';
      overflowEl = $compile(overflowHtml)($scope);
      root.insertBefore(overflowEl[0], root.firstChild);
    }

    function removeOverflow(root) {
      if (overflowEl && overflowEl[0] && overflowEl[0].parentNode) {
        overflowEl[0].parentNode.removeChild(overflowEl[0]);
        overflowEl.remove();
      }
      overflowEl = null;
      var stale = root.querySelectorAll(
        'ge-avatar[data-ge-avatar-group-overflow="true"]'
      );
      var i;
      for (i = 0; i < stale.length; i++) {
        if (stale[i].parentNode) {
          stale[i].parentNode.removeChild(stale[i]);
        }
      }
    }

    function getMemberAvatars(root) {
      var children = root.children;
      var result = [];
      var i;
      for (i = 0; i < children.length; i++) {
        var el = children[i];
        if (
          el.tagName &&
          el.tagName.toLowerCase() === 'ge-avatar' &&
          el.getAttribute('data-ge-avatar-group-overflow') !== 'true'
        ) {
          result.push(el);
        }
      }
      return result;
    }

    function resolveMax() {
      if (vm.max === undefined || vm.max === null || vm.max === '') {
        return null;
      }
      var n = typeof vm.max === 'string' ? Number.parseInt(vm.max, 10) : vm.max;
      return Number.isNaN(n) ? null : n;
    }
  }
})();
