angular.module('CompareControllers', [])
  .controller('CompareControllers_compareCtrl', function ($scope, $routeParams, githubApiClient, OAuth) {
    "use strict";
    githubApiClient
      .getRepositoryStats($routeParams.owner1, $routeParams.repo1)
      .then(function (repo) {
        $scope.repo1 = repo;
      })
    ;
    githubApiClient
      .getRepositoryStats($routeParams.owner2, $routeParams.repo2)
      .then(function (repo) {
        $scope.repo2 = repo;
      })
    ;
  })
;
