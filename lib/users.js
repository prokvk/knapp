(function() {
  module.exports = function() {
    var users;
    users = [
      {
        name: process.config.knapp.default_user.name,
        role: process.config.knapp.default_user.role,
        username: process.config.knapp.default_user.username,
        password: process.config.knapp.default_user.password
      }
    ];
    return {
      getUserByCredentials: function(username, password) {
        var i, len, user;
        for (i = 0, len = users.length; i < len; i++) {
          user = users[i];
          if (user.username === username && user.password === password) {
            return user;
          }
        }
        return null;
      },
      getUserByUserName: function(username) {
        var i, len, user;
        for (i = 0, len = users.length; i < len; i++) {
          user = users[i];
          if (user.username === username) {
            return user;
          }
        }
        return null;
      }
    };
  };

}).call(this);
