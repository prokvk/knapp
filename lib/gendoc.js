(function() {
  var fs, getEndpointDefinition, getHeader, ns;

  fs = require('fs');

  ns = require('./nodestack');

  getHeader = function() {
    var conf;
    conf = ns.getNodestackConfigVals();
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
    if (meta.description != null) {
      data.description = meta.description;
    }
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
          type: base.type,
          description: base.description ? base.description : null
        };
        if (bodyParam) {
          delete val.type;
          val.schema = {
            type: base.type
          };
        }
        data.parameters.push(val);
      }
      if (process.knapp_params.auth === 'static_token') {
        data.parameters.push({
          name: "x-access-token",
          "in": 'header',
          type: 'string',
          required: true,
          description: "AUTH_TOKEN for accessing this API"
        });
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
    conf = ns.getNodestackConfigVals();
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

  exports.generateDocumentation = function() {
    var data, endpoints, getCss, getCurlCall, getEndpointAnchorTag, getEndpointParametersHtml, getEndpointResponsesHtml, getEndpointsDocHtml, getEndpointsMenuHtml, getHtmlTemplate, getMethodLabel, html, menu, pairs, reg, replace, srch;
    getMethodLabel = function(method) {
      var map, type;
      map = {
        'get': 'success',
        'put': 'warning',
        'delete': 'danger'
      };
      type = map[method] != null ? map[method] : 'default';
      return "<span class=\"label label-" + type + "\">" + (method.toUpperCase()) + "</span>";
    };
    getEndpointAnchorTag = function(method, path) {
      return method + "_" + (path.replace(/\//g, '_'));
    };
    getEndpointsMenuHtml = function(paths) {
      var method, methods, out, path, pathData;
      out = "";
      for (path in paths) {
        methods = paths[path];
        for (method in methods) {
          pathData = methods[method];
          out += "<li><h4><a href=\"#" + (getEndpointAnchorTag(method, path)) + "\">" + (getMethodLabel(method)) + " " + path + "</a></h4></li>";
        }
      }
      return out;
    };
    getCurlCall = function(swaggerData, method, path) {
      var data, i, item, len, pData, pairs, params, ref, str, token, uriParams;
      token = process.knapp_params.auth === 'static_token' ? " -H \"x-access-token: AUTH_TOKEN\"" : "";
      params = (ref = swaggerData.paths[path][method].parameters) != null ? ref.filter(function(item) {
        return item.required === true && item["in"] !== 'header';
      }) : void 0;
      data = "";
      uriParams = "";
      if (params) {
        if (['get', 'delete'].indexOf(method) !== -1) {
          pairs = params.map(function(item) {
            return item.name + "=VALUE";
          });
          uriParams = "?" + (pairs.join('&'));
        } else {
          pData = {};
          for (i = 0, len = params.length; i < len; i++) {
            item = params[i];
            pData[item.name] = 'VALUE';
          }
          str = JSON.stringify(pData).replace(/"VALUE"/g, 'VALUE');
          data = " -d '" + str + "'";
        }
      }
      return "curl -X" + (method.toUpperCase()) + " -H \"Content-Type: " + swaggerData.consumes + "\"" + token + data + " " + swaggerData.host + path + uriParams;
    };
    getEndpointParametersHtml = function(swaggerData, method, path) {
      var _getParamType, _getParamsTable, headerParams, out, params, ref, ref1;
      _getParamType = function(param) {
        var i, item, len, opts, ref, ref1, routeData;
        routeData = process.routes[method][path].inSchema.properties[param.name];
        if ((routeData != null ? routeData.oneOf : void 0) != null) {
          opts = [];
          ref = routeData.oneOf;
          for (i = 0, len = ref.length; i < len; i++) {
            item = ref[i];
            if (item.type === 'array') {
              opts.push("array of " + item.items.type + "s");
            } else {
              opts.push(item.type);
            }
          }
          return opts.join('|');
        } else {
          if (param.type != null) {
            return param.type;
          }
          if (((ref1 = param.schema) != null ? ref1.type : void 0) != null) {
            return param.schema.type;
          }
          return null;
        }
      };
      _getParamsTable = function(params) {
        var i, item, len, req, rows, type;
        rows = "";
        for (i = 0, len = params.length; i < len; i++) {
          item = params[i];
          req = item.required ? "<span class=\"label label-danger\">REQUIRED</span>" : "";
          type = _getParamType(item);
          rows += "<tr> <th scope=\"row\">" + item.name + "</th> <td>" + type + "</td> <td>" + req + "</td> <td>" + (item.description || '') + "</td> </tr>";
        }
        return "<table class=\"table table-striped m-0\"> <thead> <tr> <th>Name</th> <th>Type</th> <th>Required</th> <th>Description</th> </tr> </thead> <tbody>" + rows + "</tbody> </table>";
      };
      out = "";
      params = (ref = swaggerData.paths[path][method].parameters) != null ? ref.filter(function(item) {
        return item["in"] !== 'header';
      }) : void 0;
      headerParams = (ref1 = swaggerData.paths[path][method].parameters) != null ? ref1.filter(function(item) {
        return item["in"] === 'header';
      }) : void 0;
      if (headerParams) {
        out += "<h4 style=\"padding-top:15px;\">Header parameters</h4>";
        out += _getParamsTable(headerParams);
      }
      if (params) {
        if (['get', 'delete'].indexOf(method) !== -1) {
          out += "<h4 style=\"padding-top:15px;\">URI parameters</h4>";
        } else {
          out += "<h4 style=\"padding-top:15px;\">Body parameters</h4>";
        }
        out += _getParamsTable(params);
      }
      return out;
    };
    getEndpointResponsesHtml = function(swaggerData, method, path) {
      var _formatResponseSchema, name, out, ref, response, schema, str;
      _formatResponseSchema = function(schema) {
        var item, name, outSchema, ref;
        if (schema.type === 'object') {
          outSchema = {};
          ref = schema.properties;
          for (name in ref) {
            item = ref[name];
            if (['object', 'array'].indexOf(item.type) !== -1) {
              outSchema[name] = _formatResponseSchema(item);
            } else {
              outSchema[name] = "VALUE";
            }
          }
        } else if (schema.type === 'array') {
          outSchema = [];
          if (['object', 'array'].indexOf(schema.items.type) !== -1) {
            outSchema.push(_formatResponseSchema(schema.items));
          } else {
            outSchema.push("VALUE");
          }
        } else {
          outSchema = "VALUE";
        }
        return outSchema;
      };
      out = "<h4 style=\"padding-top:15px;\">Responses</h4>";
      ref = swaggerData.paths[path][method].responses;
      for (name in ref) {
        response = ref[name];
        if (response.description != null) {
          name += " (" + response.description + ")";
        }
        schema = _formatResponseSchema(response.schema);
        str = JSON.stringify(schema).replace(/"VALUE"/g, 'VALUE');
        out += "<p>" + name + ":</p><pre>" + str + "</pre>";
      }
      return out;
    };
    getEndpointsDocHtml = function(swaggerData) {
      var curl, desc, method, methods, out, params, path, pathData, ref, responses;
      out = "";
      ref = swaggerData.paths;
      for (path in ref) {
        methods = ref[path];
        for (method in methods) {
          pathData = methods[method];
          curl = getCurlCall(swaggerData, method, path);
          params = getEndpointParametersHtml(swaggerData, method, path);
          responses = getEndpointResponsesHtml(swaggerData, method, path);
          desc = pathData.description != null ? "<p style=\"padding-top: 15px;\">" + pathData.description + "</p>" : "";
          out += "<div class=\"card-box\"> <h3 id=\"" + (getEndpointAnchorTag(method, path)) + "\"> " + (getMethodLabel(method)) + " " + path + " </h3> " + desc + " <pre style=\"margin-top: 30px; font-weight: bold;\">" + curl + "</pre> " + params + " " + responses + " </div>";
        }
      }
      return out;
    };
    getCss = function() {
      return fs.readFileSync('./doc.css').toString();
    };
    getHtmlTemplate = function() {
      return "<!DOCTYPE html> <html> <head> <title>__PROJECT_NAME__ - documentation</title> <meta http-equiv=\"Content-Type\" content=\"text/html; charset=MacRoman\"> <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\"> <style>__CSS__</style> </head> <body style=\"padding-bottom: 0;\"> <div class=\"container\"> <div class=\"row\"> <div class=\"menu col-md-3\"> <h2>Endpoints</h2> <ul>__ENDPOINTS_MENU__</ul> </div> <div class=\"col-md-9\"> <h1>__PROJECT_NAME__ - documentation</h1> <div class=\"card-box\"> <h2>API Version</h2> <p>__API_VERSION__</p> <h2>Description</h2> <p>__API_DESCRIPTION__</p> <h2>Consumes</h2> <p>__CONSUMES__</p> <h2>Produces</h2> <p>__PRODUCES__</p> <h2>Base URL</h2> <p>__BASE_URL__</p> </div> __ENDPOINTS_DOC__ </div> </div> </div> </body> </html>";
    };
    data = ns.getSwaggerData('swagger.json');
    menu = getEndpointsMenuHtml(data.paths);
    endpoints = getEndpointsDocHtml(data);
    html = getHtmlTemplate();
    pairs = {
      '__PROJECT_NAME__': data.info.title,
      '__CSS__': getCss(),
      '__ENDPOINTS_MENU__': menu,
      '__API_VERSION__': data.info.version,
      '__API_DESCRIPTION__': data.info.description,
      '__CONSUMES__': data.consumes,
      '__PRODUCES__': data.produces,
      '__BASE_URL__': data.host,
      '__ENDPOINTS_DOC__': endpoints
    };
    for (srch in pairs) {
      replace = pairs[srch];
      reg = new RegExp(srch, 'g');
      html = html.replace(reg, replace);
    }
    fs.writeFileSync('doc.html', html, 'utf8');
    return process.exit(0);
  };

}).call(this);
