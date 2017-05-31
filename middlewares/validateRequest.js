(function() {
  module.exports = (function() {
    return function(req, res, next) {
      var token;
      if (process.knapp_params.auth === 'none') {
        return next();
      }
      token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
      if (process.knapp_params.auth === 'static_token') {
        if (process.config.knapp.static_tokens.indexOf(token) === -1) {
          res.status(400);
          res.json({
            "status": 400,
            "message": "Invalid Token"
          });
          return;
        } else {
          return next();
        }
      }
      return next();
    };
  })();

}).call(this);
