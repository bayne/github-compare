(function () {
    'use strict';
    angular.module('GithubCompare', ['ngRoute'])
        .config(['$routeProvider', function ($routeProvider) {
            $routeProvider.when('/', {
                templateUrl: 'app/app.html'
            });
        }])
        .service('githubApiClient', ['$http', function ($http) {
            var baseUrl = 'https://api.github.com';

            function GithubApiClient () {
            }

            GithubApiClient.prototype.getRepository = function (owner, repo) {
                return $http.get(baseUrl+'/repos/'+owner+'/'+repo).then(function (response) {
                    return response.data;
                });
            };

            return new GithubApiClient();
        }])
        .controller('tableCtrl', ['$scope', 'githubApiClient', function ($scope, githubApiClient) {
            $scope.form = {
                repo1: '',
                repo2: '',
            };

            function getRepo(string) {
                var match = string.split('/');
                return {
                    owner: match[0],
                    repo: match[1],
                };
            }

            $scope.compare = function (form) {
                githubApiClient.getRepository(
                    getRepo(form.repo1).owner,
                    getRepo(form.repo1).repo
                ).then(function (repository) {
                    $scope.repo1 = repository;
                });

                githubApiClient.getRepository(
                    getRepo(form.repo2).owner,
                    getRepo(form.repo2).repo
                ).then(function (repository) {
                    $scope.repo2 = repository;
                });
            };
        }])
    ;
})();
