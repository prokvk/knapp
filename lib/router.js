(function() {
  var validateInput;

  validateInput = require('knode-jsv').validateInput;

  module.exports = function(router) {
    var addRoute;
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
        dataRaw = ['get', 'delete'].indexOf(method) === -1 ? req.body : req.query;
        if ((meta != null ? meta.inSchema : void 0) != null) {
          err = validateInput(dataRaw, meta.inSchema);
          if (err) {
            res.status(400);
            return res.json(err);
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
      getRouter: function() {
        return router;
      }
    };
  };

}).call(this);
