(function() {
  var validateInput;

  validateInput = require('knode-jsv').validateInput;

  module.exports = function(router) {
    var _getRequestData, addRoute;
    _getRequestData = function(req) {
      if (['get', 'delete'].indexOf(req.method.toLowerCase()) === -1) {
        return req.body;
      } else {
        return req.query;
      }
    };
    addRoute = function(method, url, meta, cb) {
      if (process.routes == null) {
        process.routes = {
          get: {},
          put: {},
          post: {},
          update: {},
          "delete": {}
        };
      }
      process.routes[method][url] = meta;
      return router[method]("" + process.knapp_params.api_base_url + url, function(req, res) {
        var dataRaw, err;
        dataRaw = _getRequestData(req);
        if ((meta != null ? meta.inSchema : void 0) != null) {
          err = validateInput(dataRaw, meta.inSchema);
          if (err) {
            return process.request_validation_error_handler(err, res);
          }
        }
        return cb(req, res);
      });
    };
    return {
      get: function(url, meta, cb) {
        if (meta == null) {
          meta = null;
        }
        return addRoute('get', url, meta, cb);
      },
      put: function(url, meta, cb) {
        if (meta == null) {
          meta = null;
        }
        return addRoute('put', url, meta, cb);
      },
      post: function(url, meta, cb) {
        if (meta == null) {
          meta = null;
        }
        return addRoute('post', url, meta, cb);
      },
      update: function(url, meta, cb) {
        if (meta == null) {
          meta = null;
        }
        return addRoute('update', url, meta, cb);
      },
      "delete": function(url, meta, cb) {
        if (meta == null) {
          meta = null;
        }
        return addRoute('delete', url, meta, cb);
      },
      getRequestData: _getRequestData,
      getRouter: function() {
        return router;
      }
    };
  };

}).call(this);
