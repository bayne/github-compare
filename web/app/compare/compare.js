angular.module('Compare', ['ngRoute', 'CompareControllers', 'CompareDirectives'], function ($routeProvider) {
  "use strict";
  $routeProvider.when('/compare/:owner1/:repo1/:owner2/:repo2', {templateUrl: 'app/compare/compare.html'});
});