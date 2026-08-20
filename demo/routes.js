(function () {
  'use strict';

  angular.module('demoApp').config(DemoRoutesConfig);

  DemoRoutesConfig.$inject = ['$routeProvider', '$locationProvider'];

  function DemoRoutesConfig($routeProvider, $locationProvider) {
    $locationProvider.hashPrefix('');

    $routeProvider
      .when('/layout/app', {
        templateUrl: '/demo/pages/layout/app.html',
      })
      .when('/layout/container', {
        templateUrl: '/demo/pages/layout/container.html',
      })
      .when('/layout/error', {
        templateUrl: '/demo/pages/layout/error.html',
      })
      .when('/layout/footer', {
        templateUrl: '/demo/pages/layout/footer.html',
      })
      .when('/layout/header', {
        templateUrl: '/demo/pages/layout/header.html',
      })
      .when('/layout/main', {
        templateUrl: '/demo/pages/layout/main.html',
      })
      .when('/layout/sidebar', {
        templateUrl: '/demo/pages/layout/sidebar.html',
      })
      .when('/layout/theme', {
        templateUrl: '/demo/pages/layout/theme.html',
      })
      .when('/element/alert', {
        templateUrl: '/demo/pages/element/alert.html',
      })
      .when('/element/avatar', {
        templateUrl: '/demo/pages/element/avatar.html',
      })
      .when('/element/avatar-group', {
        templateUrl: '/demo/pages/element/avatar-group.html',
      })
      .when('/element/badge', {
        templateUrl: '/demo/pages/element/badge.html',
      })
      .when('/element/banner', {
        templateUrl: '/demo/pages/element/banner.html',
      })
      .when('/element/button', {
        templateUrl: '/demo/pages/element/button.html',
      })
      .when('/element/calendar', {
        templateUrl: '/demo/pages/element/calendar.html',
      })
      .when('/element/card', {
        templateUrl: '/demo/pages/element/card.html',
      })
      .when('/element/chip', {
        templateUrl: '/demo/pages/element/chip.html',
      })
      .when('/element/collapsible', {
        templateUrl: '/demo/pages/element/collapsible.html',
      })
      .when('/element/field-group', {
        templateUrl: '/demo/pages/element/field-group.html',
      })
      .when('/element/icon', {
        templateUrl: '/demo/pages/element/icon.html',
      })
      .when('/element/kbd', {
        templateUrl: '/demo/pages/element/kbd.html',
      })
      .when('/element/progress', {
        templateUrl: '/demo/pages/element/progress.html',
      })
      .when('/element/separator', {
        templateUrl: '/demo/pages/element/separator.html',
      })
      .when('/element/skeleton', {
        templateUrl: '/demo/pages/element/skeleton.html',
      })
      .when('/form/checkbox', {
        templateUrl: '/demo/pages/form/checkbox.html',
      })
      .when('/form/checkbox-group', {
        templateUrl: '/demo/pages/form/checkbox-group.html',
      })
      .otherwise({
        redirectTo: '/layout/app',
      });
  }
})();
