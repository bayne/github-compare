angular.module('CompareControllers', [])
  .controller('CompareControllers_compareCtrl', function ($scope, $location, $q, $routeParams, githubApiClient, compareRepositories) {
    "use strict";
    $scope.repos = [];
    $scope.formData = {
      repos: [
        {
          url: ''
        },
        {
          url: ''
        }
      ]
    };
    $scope.submit = function () {
      compareRepositories($scope.formData.repos[0].url, $scope.formData.repos[1].url);
    };
    function addParameters(url, parameters) {
      var keyValues = [];
      angular.forEach(parameters, function (value, key) {
        keyValues.push(key+'='+value);
      });
      var parameterString = keyValues.join('&');

      return url+'?'+parameterString;
    }

    var promises = [
      githubApiClient.getRepositoryStats($routeParams.owner1, $routeParams.repo1),
      githubApiClient.getRepositoryStats($routeParams.owner2, $routeParams.repo2)
    ];

    $q.all(promises).then(function (repos) {
      $scope.repos = repos;
      $scope.formData.repos[0].url = repos[0].html_url;
      $scope.formData.repos[1].url = repos[1].html_url;

      // get oldest repository and find the amount of time in months since today
      function getOldestRepo(repos) {
        if (repos[0].created_at < repos[1].created_at) {
          return repos[0];
        } else {
          return repos[1];
        }
      }

      var monthsSinceToday = moment().diff(getOldestRepo(repos).created_at, 'months');

      var parameters = {
        hl: 'en-US',
        q: $scope.repos[0].name+','+$scope.repos[1].name,
        geo: 'US',
        date: 'today '+monthsSinceToday+'-m',
        cmpt: 'q',
        content: '1',
        cat: '0-5-31',
        cid: 'TIMESERIES_GRAPH_0',
        export: '5',
        w: '720',
        h: '480'
      };
      $scope.trendsEmbedUrl = addParameters("http://www.google.com/trends/fetchComponent", parameters);
    });

    angular.forEach(promises, function (value, key) {
      value.then(null, null, function (partial) {
        $scope.repos[key] = partial;
      });
    });

  })
  .filter('trustAsResourceUrl', function ($sce) {
    return function (val) {
      return $sce.trustAsResourceUrl(val);
    };
  })
;
