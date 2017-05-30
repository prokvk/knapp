(function() {
  var jwt;

  jwt = require('jwt-simple');

  module.exports = function(auth) {
    return function(req, res, next) {
      var dbUser, decoded, err, error, key, token;
      if (process.knapp_params.auth === 'none') {
        return next();
      }
      token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token'];
      key = (req.body && req.body.x_key) || (req.query && req.query.x_key) || req.headers['x-key'];
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
      try {
        decoded = jwt.decode(token, process.env.APP_SECRET);
        if (decoded.exp <= Date.now()) {
          res.status(400);
          res.json({
            "status": 400,
            "message": "Token Expired"
          });
          return;
        }
        if (decoded.username !== key) {
          res.status(401);
          res.json({
            "status": 401,
            "message": "Invalid User"
          });
          return;
        }
        dbUser = auth.validateUser(key);
        if (!dbUser) {
          res.status(403);
          res.json({
            "status": 403,
            "message": "Not Authorized"
          });
          return;
        }
        return next();
      } catch (error) {
        err = error;
        res.status(500);
        return res.json({
          "status": 500,
          "message": "Oops something went wrong",
          "error": err
        });
      }
    };
  };

}).call(this);
