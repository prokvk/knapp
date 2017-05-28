(function() {
  var _, defaults, initRoutes, loadConfig;

  _ = require('lodash');

  defaults = {
    env_path: './config/.env',
    config_path: './config/config.cson',
    api_base_url: '/api/v1',
    auth: false
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

  initRoutes = function(routes) {
    var router;
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
    if (process.knapp_params.auth === true) {
      process.app.all(process.knapp_params.api_base_url + "/*", [require('./middlewares/validateRequest')(config, auth)]);
    }
    router = require('./router');
    process.app.use('/', routes);
    return process.app.use(function(req, res, next) {
      var err;
      err = new Error('Not Found');
      err.status = 404;
      return next(res.json({
        success: false,
        message: 'ERROR: 404 Not found'
      }));
    });
  };

  exports.init = function(params) {
    var app, bodyParser, express, logger;
    params = _.extend(defaults, params);
    loadConfig(params, false);
    express = require('express');
    logger = require('morgan');
    bodyParser = require('body-parser');
    app = express();
    app.use(logger('dev'));
    app.use(bodyParser.json());
    return process.app = app;
  };

  exports.setRoutes = function(routes) {
    return initRoutes(routes);
  };

  exports.start = function(port) {
    return process.app.listen(port, function() {
      return console.log("knapp server listening on port '" + port + "'");
    });
  };

  exports.loadConfig = loadConfig;

  exports.router = require('./router');

}).call(this);
