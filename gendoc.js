(function() {
  var _, fs, getEndpointDefinition, getHeader, getNodestackConfigVals;

  fs = require('fs');

  _ = require('lodash');

  getNodestackConfigVals = function(path) {
    var block, data, i, item, len, lines, name, res, val;
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
      if (item.match(/^\[([^\)]+)\]$/)) {
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
      host: "" + conf.swagger.host + process.knapp_params.api_base_url,
      consumes: conf.swagger.consumes,
      produces: conf.swagger.produces
    };
  };

  getEndpointDefinition = function(method, url) {
    var base, bodyParam, data, i, item, len, meta, ref, ref1, val;
    meta = process.routes[method][url];
    data = {
      operationId: [method, url].map(function(item) {
        return item.toLowerCase().replace(/[^a-z0-9]/g, '');
      }).join('_'),
      parameters: [],
      responses: {
        "default": {
          description: 'Default response',
          schema: (meta != null ? meta.outSchema : void 0) != null ? meta.outSchema : null
        }
      }
    };
    if (((meta != null ? (ref = meta.inSchema) != null ? ref.properties : void 0 : void 0) != null) && Object.keys(meta.inSchema.properties).length > 0) {
      bodyParam = ['get', 'delete'].indexOf(method) === -1;
      ref1 = Object.keys(meta.inSchema.properties);
      for (i = 0, len = ref1.length; i < len; i++) {
        item = ref1[i];
        base = meta.inSchema.properties[item];
        val = {
          name: item,
          "in": bodyParam ? 'body' : 'query',
          required: base.required || false,
          type: base.type
        };
        if (bodyParam) {
          delete val.type;
          val.schema = {
            type: base.type
          };
        }
        data.parameters.push(val);
      }
    } else {
      delete data.parameters;
    }
    return data;
  };

  exports.generateSwaggerFile = function() {
    var base1, conf, data, i, j, len, len1, method, ref, ref1, url;
    if (process.routes == null) {
      throw "ERROR: routes are empty";
    }
    conf = getNodestackConfigVals('.nodestack');
    data = getHeader();
    data.paths = {};
    ref = Object.keys(process.routes);
    for (i = 0, len = ref.length; i < len; i++) {
      method = ref[i];
      ref1 = Object.keys(process.routes[method]);
      for (j = 0, len1 = ref1.length; j < len1; j++) {
        url = ref1[j];
        if ((base1 = data.paths)[url] == null) {
          base1[url] = {};
        }
        data.paths[url][method] = getEndpointDefinition(method, url);
      }
    }
    fs.writeFileSync(conf.swagger.source_file, JSON.stringify(data, 'utf8'));
    return process.exit(0);
  };

}).call(this);
