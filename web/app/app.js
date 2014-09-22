angular.module('App', ['ngRoute', 'GithubServices', 'Compare', 'angularMoment'], function ($routeProvider) {
  "use strict";
    $routeProvider
      .when('/', {templateUrl: 'app/app.html'})
      .otherwise({redirectTo: '/'})
    ;
  })

  .controller('App_searchCtrl', function ($scope, $location, githubApiClient, OAuth) {
    $scope.form = {
      repo1: '',
      repo2: ''
    };

    $scope.signin = function () {
      OAuth.popup('github');
    };

    $scope.compare = function (form) {
      var repo1 = form.repo1.replace('https://github.com/', '');
      var repo2 = form.repo2.replace('https://github.com/', '');
      $location.url('/compare/'+repo1+'/'+repo2);
    };
  })
;
