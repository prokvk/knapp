(function() {
  var _, async, authErrorCode, getBaseApiUrl, getTestRoutes, invalidSchemaCode, req, routeHasRequiredField, successfulTests, testRoute, testSchemaIntegrity, testsCount, validateInput;

  req = require('knode-request');

  validateInput = require('knode-jsv').validateInput;

  async = require('async');

  _ = require('lodash');

  invalidSchemaCode = 400;

  authErrorCode = 400;

  testsCount = 0;

  successfulTests = 0;

  getBaseApiUrl = function() {
    return "http://172.17.0.4:8911/api/v1";
  };

  getTestRoutes = function() {
    var i, j, len, len1, method, path, ref, ref1, res, route;
    res = [];
    ref = Object.keys(process.routes);
    for (i = 0, len = ref.length; i < len; i++) {
      method = ref[i];
      ref1 = Object.keys(process.routes[method]);
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        path = ref1[j];
        route = process.routes[method][path];
        if (route.testRequest != null) {
          res.push({
            path: path,
            method: method,
            meta: route
          });
        }
      }
    }
    return res;
  };

  routeHasRequiredField = function(route) {
    var i, item, key, len, ref, ref1;
    if ((((ref = route.meta.inSchema) != null ? ref.properties : void 0) != null) && Object.keys(route.meta.inSchema.properties).length > 0) {
      ref1 = Object.keys(route.meta.inSchema.properties);
      for (i = 0, len = ref1.length; i < len; i++) {
        key = ref1[i];
        item = route.meta.inSchema.properties[key];
        if (item.required != null) {
          return true;
        }
      }
    }
    return false;
  };

  testRoute = function(route, authHeaderToken, checkSchema, expectedResponseCode, responseSuffix, done) {
    var _log, headers, meta, method, path, url;
    _log = function(isValid, message) {
      var meta, method, path, suffix;
      method = route.method, meta = route.meta, path = route.path;
      suffix = responseSuffix != null ? " (" + responseSuffix + ")" : "";
      return console.log("- " + (method.toUpperCase()) + " " + path + ": " + message + suffix);
    };
    path = route.path, method = route.method, meta = route.meta;
    headers = authHeaderToken != null ? {
      'x-access-token': authHeaderToken
    } : null;
    url = "" + (getBaseApiUrl()) + path;
    return async.series([
      function(cb) {
        if (!routeHasRequiredField(route) || !checkSchema) {
          return cb();
        }
        testsCount++;
        return req.send(method, url, {}, headers, function(err, res) {
          if (res.statusCode !== invalidSchemaCode) {
            _log(false, "Expected statuscode " + invalidSchemaCode + " for invalid schema, got " + res.statusCode);
            return cb();
          }
          successfulTests++;
          _log(true, "Endpoint returned a valid response (Expected schema validation error)");
          return cb();
        });
      }, function(cb) {
        testsCount++;
        return req.send(method, url, meta.testRequest, headers, function(err, res) {
          if (err) {
            if ((expectedResponseCode == null) || expectedResponseCode !== res.statusCode) {
              return cb(err);
            }
          }
          if (checkSchema) {
            err = validateInput(res.body, meta.outSchema);
            if (err) {
              _log(false, "Defined output schema doesn't match the actual reponse");
              return cb();
            }
          }
          if ((expectedResponseCode != null) && expectedResponseCode !== res.statusCode) {
            _log(false, "Expected statuscode " + expectedResponseCode + ", got " + res.statusCode);
            return cb();
          }
          successfulTests++;
          _log(true, "Endpoint returned a valid response");
          return cb();
        });
      }
    ], done);
  };

  testSchemaIntegrity = function(routes) {
    var err, i, len, meta, method, path, results, route;
    results = [];
    for (i = 0, len = routes.length; i < len; i++) {
      route = routes[i];
      method = route.method, path = route.path, meta = route.meta;
      if (!meta.outSchema) {
        throw "ERROR: schema definition is invalid, route \"" + (method.toUpperCase()) + " " + path + "\" doesn't have \"outSchema\" field required for tests";
      }
      err = validateInput(meta.testRequest, meta.inSchema);
      if (err) {
        throw "ERROR: schema definition is invalid, test request for route \"" + (method.toUpperCase()) + " " + path + "\" doesn't match defined input schema";
      } else {
        results.push(void 0);
      }
    }
    return results;
  };

  exports.runTests = function() {
    var authHeaderToken, routes;
    routes = getTestRoutes();
    if (routes.length === 0) {
      throw "ERROR: routes don't have any tests defined";
    }
    testSchemaIntegrity(routes);
    if (process.knapp_params.auth === 'static_token') {
      authHeaderToken = process.config.knapp.static_tokens[0];
    } else {
      authHeaderToken = null;
    }
    return async.series([
      function(cb) {
        var nonExistingRoute;
        nonExistingRoute = _.extend({}, routes[0], {
          path: '/xxx-invalid-url'
        });
        return testRoute(nonExistingRoute, authHeaderToken, false, 404, 'Expected 404 error for non existing route', cb);
      }, function(cb) {
        if (process.knapp_params.auth === 'none') {
          return cb();
        }
        return testRoute(routes[0], null, false, authErrorCode, "Expected " + authErrorCode + " error for missing auth token", cb);
      }, function(cb) {
        if (process.knapp_params.auth === 'none') {
          return cb();
        }
        return testRoute(routes[0], 'xxx invalid token', false, authErrorCode, "Expected " + authErrorCode + " error for invalid auth token", cb);
      }, function(cb) {
        return async.eachSeries(routes, function(route, cb) {
          return testRoute(route, authHeaderToken, true, 200, null, cb);
        }, cb);
      }
    ], function(err) {
      if (err) {
        console.log(err);
        process.exit(1);
      }
      console.log("all good :)");
      return process.exit(0);
    });
  };

}).call(this);