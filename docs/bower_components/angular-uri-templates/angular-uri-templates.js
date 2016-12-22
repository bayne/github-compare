angular.module('uri-template', [])
.service('UriTemplate', function () {

  var operators = ['+', '#', '.', '/', ';', '?', '&'];

  var Expression = {
    append: function (array) {
      if (this.string.length > 0) {
        array.push(this);
      }
    },
    isUnfulfillable: function (params) {
      return false;
    },
    score: function (params) {
      return 0;
    }
  };

  function ConstantExpression (string) {
    this.string = string;
  }

  ConstantExpression.prototype = Object.create(Expression);
  ConstantExpression.prototype.constructor = ConstantExpression;
  ConstantExpression.prototype.expand = function () {
    return this.string;
  };

  function VariableExpression (string) {
    this.string = string;
    if (operators.indexOf(string.charAt(0)) !== -1) {
      this.operator = string.charAt(0);
      string = string.substring(1);
    }
    this.components = [];
    angular.forEach(string.split(','), function (component) {
      this.components.push(new VariableComponent(component, this.operator));
    }, this);
  }

  VariableExpression.prototype = Object.create(Expression);
  VariableExpression.prototype.constructor = VariableExpression;
  VariableExpression.prototype.expand = function (params) {
    var result = [];

    angular.forEach(this.components, function (component) {
      var object = component.expand(params);

      if (component.splat) {
        angular.forEach(object, function (value, key) {
          if (angular.isArray(value)) {
            angular.forEach(value, function (v) {
              if (this.operator === ';' || this.operator === '?' || this.operator === '&') {
                result.push(key+'='+v);
              } else {
                result.push(v);
              }
            }, this);
          } else {
            result.push(key+'='+value);
          }
        }, this);
      } else if (this.operator == ';' || this.operator == '?' || this.operator == '&') {
        angular.forEach(object, function (value, key) {
          if (this.operator == ';' && (typeof value === 'undefined' || value.toString().length < 1)) {
            result.push(key);
          } else if (result.length || typeof value !== 'undefined' && value.toString().length >= 1) {
            result.push(key+'='+value);
          }
        }, this);
      } else {
        angular.forEach(object, function (value) {
          result.push(value);
        });
      }
    }, this);

    if (result.join('').length) {
      if (this.operator == '.' || this.operator == '/' || this.operator == ';' || this.operator == '&') {
        result = result.join(this.operator);
      } else if (this.operator == '?') {
        result = result.join('&');
      } else {
        result = result.join(',');
      }
    } else {
      return '';
    }

    if (typeof this.operator !== 'undefined' && this.operator !== '+') {
      result = this.operator + result;
    }

    return result;
  };

  VariableExpression.prototype.score = function (params) {
    var result = 0;
    angular.forEach(this.components, function (component) {
      result += component.score(params);
    });
    return result;
  };

  VariableExpression.prototype.isUnfulfillable = function (params) {
    if (this.operator !== '+' && typeof this.operator !== 'undefined') {
      return false;
    } else {
      var fulfilled = false;
      angular.forEach(this.components, function (component) {
        if (!fulfilled && component.score(params) > 0) {
          fulfilled = true;
        }
      });
      return !fulfilled;
    }
  };

  function VariableComponent (string, operator) {
    this.operator = operator;
    var withlimit = string.split(':', -2);
    if (withlimit.length > 1) {
      this.name = withlimit[0];
      this.limit = parseInt(withlimit[1], 10);
    } else {
      this.name = string;
    }
    if (this.name.charAt(this.name.length - 1) == '*') {
      this.name = this.name.substring(0, this.name.length - 1);
      this.splat = true;
    }
  }

  VariableComponent.prototype.expand = function (values) {
    var result = {};
    if (typeof values[this.name] !== 'undefined') {
      var array = this.limited(values[this.name]);
      var shoved = false;
      if (!this.splat || angular.isArray(array)) {
        shoved = true;
        result[this.name] = [];
      }
      angular.forEach(array, function (value, index) {
        if (shoved) {
          result[this.name][index] = this.escape(value);
        } else {
          result[index] = this.escape(value);
        }
      }, this);
    }
    return result;
  };

  VariableComponent.prototype.escape = function (string) {
    if (this.operator == '+' || this.operator == '#') {
      return encodeURI(string);
    } else {
      return encodeURIComponent(string).replace(/[!'()]/g, escape).replace(/\*/g, "%2A");
    }
  };

  VariableComponent.prototype.limited = function (string) {
    if (string.length > this.limit) {
      return [string.substring(0, this.limit)];
    } else if (angular.isArray(string)) {
      return string;
    } else if (!this.splat && angular.isObject(string)) {
      var result = [];
      angular.forEach(string, function (value, key) {
        result.push(key);
        result.push(value);
      });
      return result;
    } else if (!angular.isObject(string)) {
      return [string];
    }
    return string;
  };

  VariableComponent.prototype.score = function (params) {
    if (typeof params[this.name] !== 'undefined') {
      return 1;
    }
    return 0;
  };

  function UriTemplate (uri) {
    this.string = uri;
    var pieces = this._expressions = [];
    angular.forEach(uri.split('{'), function (part, index) {
      if (part.indexOf('}') !== -1) {
        part = part.split('}', 2);
        (new VariableExpression(part[0])).append(pieces);
        (new ConstantExpression(part[1])).append(pieces);
      } else {
        (new ConstantExpression(part)).append(pieces);
      }
    });
  }

  UriTemplate.prototype.expand = function (params) {
    var result = [], failed = false;
    params = params ||  {};
    angular.forEach(this._expressions, function (expression) {
      if (!failed) {
        if (expression.isUnfulfillable(params)) {
          failed = true;
        } else {
          result.push(expression.expand(params));
        }
      }
    });
    return failed ? undefined : result.join('');
  };

  UriTemplate.prototype.score = function (params) {
    var result = 0;
    params = params || {};
    angular.forEach(this._expressions, function (expression) {
      if (result != -1) {
        if (expression.isUnfulfillable(params)) {
          result = -1;
        } else {
          result += expression.score(params);
        }
      }
    });
    var keyLength = 0;
    angular.forEach(params, function () { keyLength += 1; });
    keyLength = Math.min(keyLength, result * 2);

    return result - ((keyLength - result) * 0.1);
  };

  UriTemplate.prototype.toString = function () {
    return this.string;
  };

  this.parse = function (uri) {
    return new UriTemplate(uri);
  };
});
