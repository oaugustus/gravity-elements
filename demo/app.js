(function () {
  'use strict';

  angular
    .module('demoApp', ['gravityElements', 'ngRoute'])
    .controller('DemoController', DemoController);

  DemoController.$inject = ['$location'];

  function DemoController($location) {
    var vm = this;

    vm.calendarValue = new Date(2026, 7, 15);
    vm.checkboxValue = true;
    vm.checkboxCard = false;
    vm.checkboxDisabled = true;
    vm.checkboxIndeterminate = false;
    vm.checkboxGroupValue = ['System'];
    vm.checkboxGroupOptions = ['System', 'Light', 'Dark'];
    vm.checkboxGroupObjectOptions = [
      {
        value: 'system',
        label: 'System',
        description: 'This is the first option.',
      },
      {
        value: 'light',
        label: 'Light',
        description: 'This is the second option.',
      },
      {
        value: 'dark',
        label: 'Dark',
        description: 'This is the third option.',
        disabled: true,
      },
    ];
    vm.checkboxGroupObjectValue = ['system'];
    vm.checkboxGroupCardValue = ['System'];
    vm.checkboxGroupDisabledValue = ['System'];
    vm.collapsibleOpen = true;
    vm.sidebarOpen = true;
    vm.errorCleared = false;
    vm.progressMaxSteps = [
      'Waiting...',
      'Cloning...',
      'Migrating...',
      'Deploying...',
      'Done!',
    ];

    vm.onCalendarUpdate = onCalendarUpdate;
    vm.onCollapsibleUpdate = onCollapsibleUpdate;
    vm.toggleSidebar = toggleSidebar;
    vm.onSidebarOpenChange = onSidebarOpenChange;
    vm.onErrorClear = onErrorClear;
    vm.isActive = isActive;

    function onCalendarUpdate(value) {
      vm.calendarValue = value;
    }

    function onCollapsibleUpdate(value) {
      vm.collapsibleOpen = value;
    }

    function toggleSidebar() {
      vm.sidebarOpen = !vm.sidebarOpen;
    }

    function onSidebarOpenChange(open) {
      vm.sidebarOpen = open;
    }

    function onErrorClear() {
      vm.errorCleared = true;
    }

    function isActive(path) {
      return $location.path() === path;
    }
  }
})();
