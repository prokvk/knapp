(function() {
  var jwt;

  jwt = require('jwt-simple');

  module.exports = (function(_this) {
    return function(usersModel) {
      var _validate, expiresIn, genToken;
      genToken = function(user) {
        var expires, token;
        expires = expiresIn(7);
        token = jwt.encode({
          exp: expires,
          username: user.username
        }, process.env.APP_SECRET);
        return {
          token: token,
          expires: expires,
          user: user
        };
      };
      expiresIn = function(numDays) {
        var dateObj;
        dateObj = new Date();
        return dateObj.setDate(dateObj.getDate() + numDays);
      };
      _validate = function(username, password) {
        return usersModel.getUserByCredentials(username, password);
      };
      return {
        login: function(req, res) {
          var dbUserObj, password, username;
          username = req.body.username || '';
          password = req.body.password || '';
          if (username === '' || password === '') {
            res.status(401);
            res.json({
              "status": 401,
              "message": "Invalid credentials"
            });
            return;
          }
          dbUserObj = _validate(username, password);
          if (!dbUserObj) {
            res.status(401);
            res.json({
              "status": 401,
              "message": "Invalid credentials"
            });
            return;
          }
          if (dbUserObj) {
            return res.json(genToken(dbUserObj));
          }
        },
        validate: function(username, password) {
          return _validate(username, password);
        },
        validateUser: function(username) {
          return usersModel.getUserByUserName(username);
        }
      };
    };
  })(this);

}).call(this);
