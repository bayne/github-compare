angular.module('CompareControllers', [])
  .controller('CompareControllers_compareCtrl', function ($scope, $location, $routeParams, githubApiClient, compareRepositories) {
    "use strict";
    $scope.repos = [];
    $scope.form = {
      repos: [
        {
          url: ''
        },
        {
          url: ''
        }
      ],
      submit: function () {
        compareRepositories(this.repos[0].url, this.repos[1].url);
      }
    };
    githubApiClient
      .getRepositoryStats($routeParams.owner1, $routeParams.repo1)
      .then(function (repo) {
        $scope.repos[0] = repo;
        $scope.form.repos[0].url = repo.html_url;
      }, function () {

      }, function (partialRepo) {
        $scope.repos[0] = partialRepo;
      })
    ;
    githubApiClient
      .getRepositoryStats($routeParams.owner2, $routeParams.repo2)
      .then(function (repo) {
        $scope.repos[1] = repo;
        $scope.form.repos[1].url = repo.html_url;
      }, function () {

      }, function (partialRepo) {
        $scope.repos[1] = partialRepo;
      })
    ;
  })
;
