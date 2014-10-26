angular.module('App', ['ngRoute', 'GithubServices', 'Compare', 'angularMoment', 'mm.foundation', 'angulartics', 'angulartics.google.analytics', 'ngDisqus'], function ($routeProvider) {
  "use strict";
    $routeProvider
      .when('/', {templateUrl: 'app/app.html'})
      .otherwise({redirectTo: '/'})
    ;
  })
  .config(function ($locationProvider, $disqusProvider) {
    $locationProvider.hashPrefix('!');
    $disqusProvider.setShortname('githubcompare');
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
    $scope.formData = {
      repo1: '',
      repo2: ''
    };

    $scope.compare = function (form) {
      var defaults = [
        "https://github.com/twbs/bootstrap",
        "https://github.com/zurb/foundation"
      ];
      if (form.$dirty === false) {
        compareRepositories(defaults[0], defaults[1]);
      } else {
        console.log(defaults[0]);
        compareRepositories(form.repo1 || defaults[0], form.repo2 || defaults[1]);
      }
    };
  })
  .run(function ($modal, $route, ratelimitDispatcher) {
    ratelimitDispatcher.addListener(function (event) {
      if (event.status === 403) {
        $modal.open({
          templateUrl: 'github-modal-content.html',
          controller: 'App_githubModalCtrl'
        });
      } else {
        window.location.reload(true);
      }
    });
  })
;
