(function() {
  exports.init = function(params) {
    var app, bodyParser, express, logger;
    require('dotenv').config({
      path: params.envPath
    });
    require('cson-config').load(params.configPath);
    express = require('express');
    logger = require('morgan');
    bodyParser = require('body-parser');
    app = express();
    app.use(logger('dev'));
    app.use(bodyParser.json());
    process.app = app;
    console.log('---------------------------');
    console.log(Object.keys(process));
    return console.log('---------------------------');
  };

  exports.test = function() {
    return console.log(process.config);
  };

}).call(this);
