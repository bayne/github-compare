angular.module('App', ['ngRoute', 'GithubServices', 'Compare', 'angularMoment', 'mm.foundation'], function ($routeProvider) {
  "use strict";
    $routeProvider
      .when('/', {templateUrl: 'app/app.html'})
      .otherwise({redirectTo: '/'})
    ;
  })
  .controller('App_githubModalCtrl', function ($scope, OAuth) {
    $scope.signin = function () {
      OAuth.popup('github');
    };
  })
  .controller('App_searchCtrl', function ($scope, $location, githubApiClient, OAuth) {
    $scope.form = {
      repo1: '',
      repo2: ''
    };

    $scope.compare = function (form) {
      var repo1 = form.repo1.replace('https://github.com/', '');
      var repo2 = form.repo2.replace('https://github.com/', '');
      $location.url('/compare/'+repo1+'/'+repo2);
    };
  })
  .run(function ($modal, ratelimitDispatcher) {
    console.log('hi');
    ratelimitDispatcher.addListener(function (rejection) {
      $modal.open({
        templateUrl: 'github-modal-content.html',
        controller: 'App_githubModalCtrl'
      });
    });
  })
;
