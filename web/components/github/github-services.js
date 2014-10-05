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

      function findEnd(callback) {
        var ret = $q.defer();
        function findrange(o) {
          var i = 1;
          var deferred = $q.defer();
          var ret = $q.defer();

          var loop = function (result) {
            if (result) {
              i = i * 2;
              callback(i+o).then(loop);
            } else {
              deferred.resolve(true);
            }
          };

          callback(i+o).then(loop);
          deferred.promise.then(function () {
            ret.resolve([i/2+o, i+o]);
          });

          return ret.promise;
        }
        var loop = function (range) {
          if (range[1] - range[0] > 1) {
            findrange(range[0]).then(loop);
          } else {
            ret.resolve(range[1]-1);
          }
        };
        findrange(0).then(loop);
        return ret.promise;
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
          var isNotEmpty = function (page) {
            var deferred = $q.defer();
            $http.get(
              urlParser(url)
                .addToSearch('page', page)
                .url+'&per_page=100',
              {stopPropagate: true}
            ).then(function (response) {
                deferred.resolve(response.data.length > 0);
            });
            return deferred.promise;
          };
          findEnd(isNotEmpty).then(function (lastPage) {
            $http.get(
              urlParser(url)
                .addToSearch('page', lastPage)
                .url+'&per_page=100',
              {stopPropagate: true}
            ).then(function (response) {
                deferred.resolve(response.data.length+(lastPage-1)*100);
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
