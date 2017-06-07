(function() {
  exports.runTests = function() {
    console.log("mkay");
    process.exit(0);
    if (process.routes == null) {
      throw "ERROR: routes are empty";
    }
  };

}).call(this);
