(function() {
  var _, fs, getHeader, getNodestackConfigVals;

  fs = require('fs');

  _ = require('lodash');

  getNodestackConfigVals = function(path) {
    var block, data, i, item, len, lines, name, res, val;
    data = fs.readFileSync(path);
    lines = data.toString().split("\n").filter(function(item) {
      return _.trim(item) !== '' && !item.match(/^#/);
    });
    lines = lines.map(function(item) {
      return _.trim(item);
    });
    res = {};
    block = null;
    for (i = 0, len = lines.length; i < len; i++) {
      item = lines[i];
      if (item.match(/^\[([^\)]+)\]$/)) {
        if (item.match(/^\[([^\)]+)\]$/)) {
          block = _.trim(item, '[]');
        }
        if (res[block] == null) {
          res[block] = {};
        }
      } else {
        if (block != null) {
          name = item.replace(/^([^=]+)=(.+)$/, '$1');
          val = item.replace(/^([^=]+)=(.+)$/, '$2');
          res[block][name] = val;
        }
      }
    }
    return res;
  };

  getHeader = function() {
    var conf;
    conf = getNodestackConfigVals('.nodestack');
    return {
      swagger: conf.swagger.swagger_version,
      info: {
        version: conf.swagger.info_version,
        title: conf.swagger.info_title,
        description: conf.swagger.info_description
      },
      host: conf.swagger.host,
      consumes: conf.swagger.consumes,
      produces: conf.swagger.produces
    };
  };

  exports.generateSwaggerFile = function() {
    var data;
    if (process.routes == null) {
      throw "ERROR: routes are empty";
    }
    data = getHeader();
    console.log(data);
    return process.exit(0);
  };

}).call(this);
