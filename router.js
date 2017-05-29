(function() {
  var express, router, validateInput;

  validateInput = require('./util/jsonschema_validator').validateInput;

  express = require('express');

  router = express.Router();

  module.exports = (function() {
    var addRoute;
    addRoute = function(method, url, schema, cb) {
      return router[method]("" + process.knapp_params.api_base_url + url, function(req, res) {
        var dataRaw, err;
        dataRaw = ['get', 'delete'].indexOf(method) === -1 ? req.body : req.query;
        if (schema != null) {
          err = validateInput(dataRaw, schema);
          if (err) {
            return res.json(err);
          }
        }
        return cb(req, res);
      });
    };
    return {
      get: function(url, schema, cb) {
        if (schema == null) {
          schema = null;
        }
        return addRoute('get', url, schema, cb);
      },
      put: function(url, schema, cb) {
        if (schema == null) {
          schema = null;
        }
        return addRoute('put', url, schema, cb);
      },
      post: function(url, schema, cb) {
        if (schema == null) {
          schema = null;
        }
        return addRoute('post', url, schema, cb);
      },
      update: function(url, schema, cb) {
        if (schema == null) {
          schema = null;
        }
        return addRoute('update', url, schema, cb);
      },
      "delete": function(url, schema, cb) {
        if (schema == null) {
          schema = null;
        }
        return addRoute('delete', url, schema, cb);
      },
      getRouter: function() {
        return router;
      }
    };
  })();

}).call(this);
