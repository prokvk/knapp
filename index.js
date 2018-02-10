(function() {
  var _, async, defaults, generateDocumentation, generateSwaggerFile, initRoutes, loadConfig, ns, requestValidationErrorHandler, runTests, setMode, testAfterHandler, testBeforeHandler;

  _ = require('lodash');

  ns = require('./lib/nodestack');

  async = require('async');

  defaults = {
    env_path: './config/.env',
    config_path: './config/config.cson',
    api_base_url: '/api/v1',
    auth: 'none'
  };

  loadConfig = function(params, extend) {
    if (extend == null) {
      extend = true;
    }
    if (extend) {
      params = _.extend(defaults, params);
    }
    process.knapp_params = params;
    require('dotenv').config({
      path: params.env_path
    });
    return require('cson-config').load(params.config_path);
  };

  setMode = function(explicitMode) {
    var i, item, len, mode, ref;
    if (explicitMode == null) {
      explicitMode = null;
    }
    if (explicitMode != null) {
      process.knapp_params.mode = explicitMode;
      return;
    }
    mode = null;
    ref = process.argv;
    for (i = 0, len = ref.length; i < len; i++) {
      item = ref[i];
      if (item.match(/^mode=/)) {
        mode = item.replace(/^mode=/, '');
        break;
      }
    }
    return process.knapp_params.mode = mode;
  };

  generateSwaggerFile = function() {
    return require('./lib/gendoc').generateSwaggerFile();
  };

  generateDocumentation = function() {
    return require('./lib/gendoc').generateDocumentation();
  };

  runTests = function(done) {
    if (done == null) {
      done = null;
    }
    return require('./lib/tests').runTests(done);
  };

  requestValidationErrorHandler = function(err, res) {
    res.status(400);
    return res.json(err);
  };

  testBeforeHandler = function(done) {
    return done();
  };

  testAfterHandler = function(done) {
    return done();
  };

  initRoutes = function(routes) {
    process.app.all('/*', function(req, res, next) {
      var allowHeaders;
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,UPDATE,DELETE,OPTIONS');
      allowHeaders = process.knapp_params.allow_headers != null ? "," + (process.knapp_params.allow_headers.join(',')) : "";
      res.header('Access-Control-Allow-Headers', "Content-type,Accept,X-Access-Token,X-Key" + allowHeaders);
      if (req.method === 'OPTIONS') {
        return res.status(200).end();
      } else {
        return next();
      }
    });
    if (process.knapp_params.auth !== 'none') {
      process.app.all(process.knapp_params.api_base_url + "/*", [require('./middlewares/validateRequest')]);
    }
    process.app.use('/', routes);
    return process.app.use(function(req, res, next) {
      return next(res.status(404).send({
        error: '404 Not found'
      }));
    });
  };

  exports.init = function(params) {
    var app, bodyParser, explicitMode, express, logger;
    params = _.extend(defaults, params);
    loadConfig(params, false);
    express = require('express');
    logger = require('morgan');
    bodyParser = require('body-parser');
    explicitMode = params.mode || null;
    setMode(explicitMode);
    app = express();
    app.use(logger('dev'));
    app.use(bodyParser.json());
    process.app = app;
    process.request_validation_error_handler = requestValidationErrorHandler;
    process.test_before_handler = testBeforeHandler;
    process.test_after_handler = testAfterHandler;
    return process.router = require('./lib/router')(express.Router());
  };

  exports.setRequestValidationErrorHandler = function(handler) {
    return process.request_validation_error_handler = handler;
  };

  exports.setTestBeforeHandler = function(handler) {
    return process.test_before_handler = handler;
  };

  exports.setTestAfterHandler = function(handler) {
    return process.test_after_handler = handler;
  };

  exports.setRoutes = function(routes) {
    return initRoutes(routes);
  };

  exports.getMode = function() {
    return process.knapp_params.mode;
  };

  exports.start = function(port) {
    if (process.knapp_params.mode === 'tests') {
      if (process.env.TESTS_PORT != null) {
        port = process.env.TESTS_PORT;
      }
      return process.app.listen(port, function() {
        var _res;
        _res = 1;
        return async.series([
          function(cb) {
            return process.test_before_handler(cb);
          }, function(cb) {
            return runTests(function(err, res) {
              if (err) {
                return cb(err);
              }
              _res = res;
              return cb();
            });
          }, function(cb) {
            return process.test_after_handler(cb);
          }
        ], function(err) {
          return process.exit(_res);
        });
      });
    } else if (process.knapp_params.mode === 'genswaggerfile') {
      return generateSwaggerFile();
    } else if (process.knapp_params.mode === 'gendoc') {
      return generateDocumentation();
    } else {
      return process.app.listen(port, function() {
        return console.log("knapp server listening on port '" + port + "'");
      });
    }
  };

  exports.loadConfig = loadConfig;

  exports.getNsConf = ns.getNodestackConfigVals;

  exports.getRouter = function() {
    return process.router;
  };

}).call(this);
