angular.module('GithubServices', ['oauth.io', 'uri-template'])
  .config(function (OAuthProvider, $httpProvider) {
    OAuthProvider.setPublicKey('CKyIhlzMQQ3uA3hHEr2sSPmQl8Q');
    OAuthProvider.setHandler('github', function (OAuthData) {
      window.localStorage.setItem('accessToken', OAuthData.result.access_token);
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
          var total = 0;
          var count = function (response) {
            var next = parse_link_header(response.headers('Link')).next;
            total += response.data.length;
            if (next) {
              $http.get(next, {stopPropagate: true}).then(count);
            } else {
              deferred.resolve(total);
            }
          };
          $http.get(urlParser(url).addToSearch('per_page', '100').url, {stopPropagate: true}).then(count);
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
      $http({method: 'GET', url: baseUrl+'/repos/'+owner+'/'+repo})
        .then(function (response) {
          stats = response.data;
          return $q.all([
            $http.get(stats.contributors_url),
            $http.get(stats.languages_url),
            $http.get(stats.tags_url),
            $http.get(UriTemplate.parse(stats.releases_url).expand({"id": ''})),
            $http.get(UriTemplate.parse(stats.commits_url).expand({"id": ''}))
          ]);
        })
        .then(function (promises) {

          stats.contributors = promises[0].data;
          stats.languages = promises[1].data;
          stats.tags = promises[2].data;
          stats.releases = promises[3].data;
          stats.commits = promises[4].data;

          return $q.all([
            stats.contributors.total_count,
            stats.tags.total_count,
            stats.releases.total_count,
            stats.commits.total_count
          ]);
        })
        .then(function (promises) {
          stats.contributors.total_count = promises[0];
          stats.tags.total_count = promises[1];
          stats.releases.total_count = promises[2];
          stats.commits.total_count = promises[3];
          deferred.resolve(stats);
        })
      ;
      return deferred.promise;
    };

    return new GithubApiClient();
  })
;
