angular.module('App', ['ngRoute', 'GithubServices', 'Compare', 'angularMoment', 'mm.foundation', 'angulartics', 'angulartics.google.analytics'], function ($routeProvider) {
  "use strict";
    $routeProvider
      .when('/', {templateUrl: 'app/app.html'})
      .otherwise({redirectTo: '/'})
    ;
  })
  .service('compareRepositories', function ($location) {
    return function (repoUrl1, repoUrl2) {
      var repo1 = repoUrl1.replace('https://github.com/', '');
      var repo2 = repoUrl2.replace('https://github.com/', '');
      $location.url('/compare/'+repo1+'/'+repo2);
    };
  })
  .controller('App_githubModalCtrl', function ($scope, OAuth) {
    $scope.signin = function () {
      OAuth.popup('github');
    };
  })
  .controller('App_searchCtrl', function ($scope, $location, compareRepositories) {
    $scope.form = {
      repo1: '',
      repo2: ''
    };

    $scope.compare = function (form) {
      if (form.$dirty === false) {
        compareRepositories("https://github.com/twbs/bootstrap", "https://github.com/zurb/foundation");
      } else {
        compareRepositories(form.repo1, form.repo2);
      }
    };
  })
  .run(function ($modal, ratelimitDispatcher) {
    ratelimitDispatcher.addListener(function () {
      $modal.open({
        templateUrl: 'github-modal-content.html',
        controller: 'App_githubModalCtrl'
      });
    });
  })
;
