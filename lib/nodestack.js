(function() {
  var _, fs, yaml;

  fs = require('fs');

  _ = require('lodash');

  yaml = require('js-yaml');

  exports.getNodestackConfigVals = function() {
    var block, data, i, item, len, lines, name, path, res, val;
    if (fs.existsSync('nsconf.yml')) {
      return yaml.safeLoad(fs.readFileSync('nsconf.yml', 'utf8'));
    }
    path = '.nodestack';
    data = fs.readFileSync(path);
    lines = data.toString().split("\n").filter(function(item) {
      return _.trim(item) !== '' && !item.match(/^#/);
    }).map(function(item) {
      return _.trim(item);
    });
    res = {};
    block = null;
    for (i = 0, len = lines.length; i < len; i++) {
      item = lines[i];
      if (item.match(/^\[([^\]]+)\]$/)) {
        block = _.trim(item, '[]');
        if (res[block] == null) {
          res[block] = {};
        }
      } else {
        if (block != null) {
          name = item.replace(/^([^=]+)=(.+)$/, '$1');
          val = _.trim(item.replace(/^([^=]+)=(.+)$/, '$2'), '\'"');
          res[block][name] = val;
        }
      }
    }
    return res;
  };

  exports.getSwaggerData = function(path) {
    var data;
    data = fs.readFileSync(path);
    return JSON.parse(data);
  };

}).call(this);
