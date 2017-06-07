(function() {
  var async, getTestRoutes, req, testRoute, validateInput;

  req = require('knode-request');

  validateInput = require('knode-jsv').validateInput;

  async = require('async');

  getTestRoutes = function() {
    var base, i, j, len, len1, method, ref, ref1, res, route, url;
    res = [];
    ref = Object.keys(process.routes);
    for (i = 0, len = ref.length; i < len; i++) {
      method = ref[i];
      ref1 = Object.keys(process.routes[method]);
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        url = ref1[j];
        route = process.routes[method][url];
        base = "http://172.17.0.4:8911/api/v1";
        if (route.testRequest != null) {
          res.push({
            url: "" + base + url,
            path: url,
            method: method,
            meta: route
          });
        }
      }
    }
    return res;
  };

  testRoute = function(route, authHeaderToken, checkSchema, expectedResponseCode, validResponseSuffix, done) {
    var getResultObject, headers, meta, method, url;
    getResultObject = function(isValid, route, message) {
      var meta, method, path, suffix, url;
      url = route.url, method = route.method, meta = route.meta, path = route.path;
      suffix = validResponseSuffix && isValid ? " (" + validResponseSuffix + ")" : "";
      console.log((method.toUpperCase()) + " " + path + ": " + message + suffix);
      return {
        ok: isValid,
        route: route,
        message: message
      };
    };
    url = route.url, method = route.method, meta = route.meta;
    if (authHeaderToken != null) {
      headers = {
        'x-access-token': authHeaderToken
      };
    } else {
      headers = null;
    }
    return req.send(method, url, meta.testRequest, headers, function(err, res) {
      if (checkSchema) {
        err = validateInput(res.body, meta.outSchema);
        if (err) {
          return done(null, getResultObject(false, route, "Defined output schema doesn't match the actual reponse"));
        }
      }
      if (expectedResponseCode != null) {
        if (expectedResponseCode !== res.statusCode) {
          return done(null, getResultObject(false, route, "Expected statuscode " + expectedResponseCode + ", got " + res.statusCode));
        }
      }
      return done(null, getResultObject(true, route, "Endpoint returned a valid response"));
    });
  };

  exports.runTests = function() {
    var authHeaderToken, routes;
    routes = getTestRoutes();
    if (routes.length === 0) {
      throw "ERROR: routes don't have any tests defined";
    }
    if (process.knapp_params.auth === 'static_token') {
      authHeaderToken = process.config.knapp.static_tokens[0];
    } else {
      authHeaderToken = null;
    }
    return async.series([
      function(cb) {
        return cb();
      }, function(cb) {
        if (process.knapp_params.auth === 'none') {
          return cb();
        }
        return testRoute(routes[0], null, false, 400, 'Expected 400 error for missing auth token', cb);
      }, function(cb) {
        if (process.knapp_params.auth === 'none') {
          return cb();
        }
        return testRoute(routes[0], 'invalid token', false, 400, 'Expected 400 error for invalid auth token', cb);
      }, function(cb) {
        return async.eachSeries(routes, function(route, cb) {
          return testRoute(route, authHeaderToken, true, 200, null, cb);
        }, cb);
      }
    ], function(err) {
      if (err) {
        console.log("ERROR: " + err);
      }
      if (err) {
        console.log(err);
      }
      if (err) {
        process.exit(1);
      }
      console.log("all good :)");
      return process.exit(0);
    });
  };

}).call(this);
