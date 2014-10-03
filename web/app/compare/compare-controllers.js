angular.module('CompareControllers', [])
  .controller('CompareControllers_compareCtrl', function ($scope, $location, $routeParams, githubApiClient, compareRepositories) {
    "use strict";
    $scope.form = {
      repo1: {
        url: ''
      },
      repo2: {
        url: ''
      },
      submit: function () {
        compareRepositories(this.repo1.url, this.repo2.url);
      }
    };
    githubApiClient
      .getRepositoryStats($routeParams.owner1, $routeParams.repo1)
      .then(function (repo) {
        $scope.repo1 = repo;
        $scope.form.repo1.url = repo.html_url;
      }, function () {

      }, function (partialRepo) {
        $scope.repo1 = partialRepo;
      })
    ;
    githubApiClient
      .getRepositoryStats($routeParams.owner2, $routeParams.repo2)
      .then(function (repo) {
        $scope.repo2 = repo;
        $scope.form.repo2.url = repo.html_url;
      }, function () {

      }, function (partialRepo) {
        $scope.repo2 = partialRepo;
      })
    ;
  })
;
