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
        "https://github.com/zurb/foundation-sites"
      ];
      if (form.$dirty === false) {
        compareRepositories(defaults[0], defaults[1]);
      } else {
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
;angular.module('CompareControllers', [])
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
      $scope.trendsEmbedUrl = addParameters("https://www.google.com/trends/fetchComponent", parameters);
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
;angular.module('CompareDirectives', [])
  .directive('languageList', function () {
    return {
      restrict: 'E',
      templateUrl: 'app/compare/fragment/language-list.tpl.html',
      scope: {
        data: '='
      },
      link: function (scope, elem, attrs) {
        scope.greaterThan = function (prop, val) {
          return function (item) {
            return item[prop] > val;
          };
        };
        scope.$watch('data', function (data) {
          var totalLines = 0;
          angular.forEach(data, function (value) {
            totalLines += value;
          });
          scope.languages = [];
          angular.forEach(data, function (value, key) {
            scope.languages.push({
              name: key,
              lines: value,
              percent: Math.round(100*value/totalLines)
            });
          });
          scope.languages.sort(function (a, b) {
            return b.lines - a.lines;
          });
        });
      }
    };
  })
;
;angular.module('Compare', ['ngRoute', 'CompareControllers', 'CompareDirectives'], function ($routeProvider) {
  "use strict";
  $routeProvider.when('/compare/:owner1/:repo1/:owner2/:repo2', {templateUrl: 'app/compare/compare.html'});
});;angular.module('GithubServices', ['oauth.io', 'uri-template'])
  .config(function (OAuthProvider, $httpProvider) {
    OAuthProvider.setPublicKey('CKyIhlzMQQ3uA3hHEr2sSPmQl8Q');
    OAuthProvider.setHandler('github', function (OAuthData, ratelimitDispatcher) {
      window.localStorage.setItem('accessToken', OAuthData.result.access_token);
      ratelimitDispatcher.dispatch(OAuthData);
    });
    $httpProvider.interceptors.push(function ($q, ratelimitDispatcher, paginatedDispatcher) {
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
        },
        response: function (response) {
          if (Array.isArray(response.data) && response.config.stopPropagate === undefined) {
            if (response.headers('Link')) {
              paginatedDispatcher.dispatch(response);
            } else {
              var deferred = $q.defer();
              deferred.resolve(response.data.length);
              response.data.total_count = deferred.promise;
            }
          }
          return response;
        }
      };
    });
  })
  .run(function ($q, $http, paginatedDispatcher, urlParser) {
    function parse_link_header(header) {
      if (!header) {
        return {};
      }
      if (header.length === 0) {
        throw new Error("input must not be of zero length");
      }

      // Split parts by comma
      var parts = header.split(',');
      var links = {};
      // Parse each part into a named link
      angular.forEach(parts, function(p) {
        var section = p.split(';');
        if (section.length != 2) {
          throw new Error("section could not be split on ';'");
        }
        var url = section[0].replace(/<(.*)>/, '$1').trim();
        var name = section[1].replace(/rel="(.*)"/, '$1').trim();
        links[name] = url;
      });

      return links;
    }
    paginatedDispatcher.addListener(function (response) {
      var deferred = $q.defer();
      var url = response.config.url;
      var parsedUrl = urlParser(response.config.url);
      var snoopUrl = parsedUrl.addToSearch('per_page', '1').url;

      function getUpperbound(callback) {
        var deferred = $q.defer();
        var i = 1;
        var loop = function (result) {
          if (result < 0) {
            i = i * 10;
            callback(i).then(loop);
          } else {
            deferred.resolve(i);
          }
        };

        callback(i).then(loop);

        return deferred.promise;
      }

      function binarySearch(lower, upper, callback) {
        var deferred = $q.defer();
        function recurse(lower, upper) {
          var midpoint = Math.ceil((lower+upper)/2);
          callback(midpoint).then(function (result) {
            if (result < 0) {
              recurse(midpoint + 1, upper);
            } else if (result > 0) {
              recurse(lower, midpoint - 1);
            } else {
              deferred.resolve(midpoint);
            }
          });
          return deferred.promise;
        }
        return recurse(lower, upper);
      }

      $http.get(snoopUrl, {stopPropagate: true}).then(function (response) {
        var last = parse_link_header(response.headers('Link')).last;
        var params = {};
        if (last !== undefined) {
          angular.forEach(last.split('?')[1].split('&'), function (value) {
            var keyValue = value.split('=');
            params[keyValue[0]] = keyValue[1];
          });
          deferred.resolve(params.page);
        } else {
          // Have to traverse
          var compare = function (page) {
            var deferred = $q.defer();
            $http.get(
              urlParser(url)
                .addToSearch('page', page)
                .url+'&per_page=100',
              {stopPropagate: true}
            ).then(function (response) {
                var next = parse_link_header(response.headers('Link')).next;
                var result;
                if (response.data.length === 0) {
                  result = 1;
                } else if (response.data.length == 100 && next !== undefined) {
                  result = -1;
                } else {
                  result = 0;
                }
                deferred.resolve(result);
            });
            return deferred.promise;
          };
          getUpperbound(compare).then(function (upperBound) {
            binarySearch(1, upperBound, compare).then(function (lastPage) {
              $http.get(
                urlParser(url)
                  .addToSearch('page', lastPage)
                  .url+'&per_page=100',
                {stopPropagate: true}
              ).then(function (response) {
                  deferred.resolve(response.data.length+(lastPage-1)*100);
              });
            });
          });
        }
      });

      response.data.total_count = deferred.promise;
    });
  })
  .service('urlParser', function () {
    return function (string) {
      var e = document.createElement('a');
      e.href = string;
      return {
        url: e.href,
        protocol: e.protocol,
        host: e.host,
        hostname: e.hostname,
        port: e.port,
        pathname: e.pathname,
        hash: e.hash,
        search: e.search,
        addToSearch: function (key, value) {
          if (this.search !== '') {
            this.url = this.url+'&'+key+'='+value;
          } else {
            this.url = this.url+'?'+key+'='+value;
          }
          return this;
        }
      };
    };
  })
  .service('dispatcherFactory', function () {
    return function () {
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
    };
  })
  .service('ratelimitDispatcher', function (dispatcherFactory) {
    return dispatcherFactory();
  })
  .service('paginatedDispatcher', function (dispatcherFactory) {
    return dispatcherFactory();
  })
  .service('githubApiClient', function ($http, $q, UriTemplate) {
    var baseUrl = 'https://api.github.com';

    function GithubApiClient () {
    }

    GithubApiClient.prototype.getRepositoryStats = function (owner, repo) {
      var deferred = $q.defer();
      var stats = {};
      function expand(link, attrName) {
        return $http.get(link).then(function (response) {
          stats[attrName] = response.data;
          if (Array.isArray(response.data)) {
            stats[attrName].total_count.then (function (total_count) {
              stats[attrName].total_count = total_count;
              deferred.notify(stats);
            });
            stats[attrName].total_count = 'Loading...';
          }
          deferred.notify(stats);
        });
      }
      $http({method: 'GET', url: baseUrl+'/repos/'+owner+'/'+repo})
        .then(function (response) {
          stats = response.data;
          deferred.notify(stats);

          return $q.all([
            expand(stats.contributors_url, 'contributors'),
            expand(stats.languages_url, 'languages'),
            expand(stats.tags_url, 'tags'),
            expand(baseUrl+"/repos/"+owner+"/"+repo+"/pulls?state=open", 'open_pulls'),
            expand(baseUrl+"/repos/"+owner+"/"+repo+"/pulls?state=closed", 'closed_pulls'),
            expand(UriTemplate.parse(stats.releases_url).expand({"id": ''}), 'releases'),
            expand(UriTemplate.parse(stats.commits_url).expand({"id": ''}), 'commits'),
          ]);
        })
        .then(function () {
          deferred.resolve(stats);
        })
      ;
      return deferred.promise;
    };

    return new GithubApiClient();
  })
;
