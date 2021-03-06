angular.module('CompareDirectives', [])
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
