(function() {
  var _, defaults, generateDocumentation, generateSwaggerFile, initRoutes, loadConfig, requestValidationErrorHandler, runTests, setMode;

  _ = require('lodash');

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

  runTests = function() {
    return require('./lib/tests').runTests();
  };

  requestValidationErrorHandler = function(err, res) {
    res.status(400);
    return res.json(err);
  };

  initRoutes = function(routes) {
    process.app.all('/*', function(req, res, next) {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,UPDATE,DELETE,OPTIONS');
      res.header('Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key');
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
    return process.router = require('./lib/router')(express.Router());
  };

  exports.setRequestValidationErrorHandler = function(handler) {
    return process.request_validation_error_handler = handler;
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
        return runTests();
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

  exports.getRouter = function() {
    return process.router;
  };

}).call(this);
