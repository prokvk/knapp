(function() {
  var express, router, validateInput;

  validateInput = require('./util/jsonschema_validator').validateInput;

  express = require('express');

  router = express.Router();

  module.exports = (function() {
    var addRoute;
    addRoute = function() {
      return 1;
    };
    return {
      get: function(url, schema, cb) {
        if (schema == null) {
          schema = null;
        }
        return router.get(url, cb);
      },
      put: function(url, schema, cb) {
        if (schema == null) {
          schema = null;
        }
        return router.put(url, cb);
      },
      post: function(url, schema, cb) {
        if (schema == null) {
          schema = null;
        }
        return router.post(url, cb);
      },
      update: function(url, schema, cb) {
        if (schema == null) {
          schema = null;
        }
        return router.update(url, cb);
      },
      "delete": function(url, schema, cb) {
        if (schema == null) {
          schema = null;
        }
        return router["delete"](url, cb);
      },
      getRouter: function() {
        return router;
      }
    };
  })();

}).call(this);
