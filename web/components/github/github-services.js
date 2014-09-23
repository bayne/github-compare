angular.module('GithubServices', ['oauth.io'])
  .config(function (OAuthProvider, $httpProvider) {
    OAuthProvider.setPublicKey('CKyIhlzMQQ3uA3hHEr2sSPmQl8Q');
    OAuthProvider.setHandler('github', function (OAuthData) {
      window.localStorage.setItem('accessToken', OAuthData.result.access_token);
    });
    $httpProvider.interceptors.push(function ($q, ratelimitDispatcher) {
      return {
        request: function (config) {
          if (window.localStorage.getItem('accessToken')) {
            config.headers.Authorization = 'token ' + window.localStorage.getItem('accessToken');
          }
          return config;
        },
        responseError: function (rejection) {
          if (rejection.status == 403 && rejection.headers('X-RateLimit-Remaining') === '0') {
            ratelimitDispatcher.dispatch(rejection);
          }
          return $q.reject(rejection);
        }
      };
    });
  })
  .service('ratelimitDispatcher', function () {
    var listeners = [];
    return {
      addListener: function (listener) {
        listeners.push(listener);
      },
      dispatch: function (event) {
        angular.forEach(listeners, function (listener) {
          listener(event);
        });
      }
    };
  })
  .service('githubApiClient', function ($http, $q) {
    var baseUrl = 'https://api.github.com';

    function GithubApiClient () {
    }

    GithubApiClient.prototype.getRepositoryStats = function (owner, repo) {
      var deferred = $q.defer();
      var stats = {
        stargazers_count: 'NOT_LOADED',
        full_name: 'NOT_LOADED',
        forks_count: 'NOT_LOADED',
        created_at: 'NOT_LOADED',
        pushed_at: 'NOT_LOADED'
      };
      $http({method: 'GET', url: baseUrl+'/repos/'+owner+'/'+repo})
        .then(function (response) {
          stats = angular.extend(stats, response.data);
          deferred.notify(stats);
          return $q.all([
            $http.get(stats.contributors_url),
            $http.get(stats.languages_url)
          ]);
        })
        .then(function (promises) {
          stats.contributors = promises[0].data;
          stats.languages = promises[1].data;
          return deferred.resolve(stats);
        })
      ;
      return deferred.promise;
    };

    return new GithubApiClient();
  })
;
