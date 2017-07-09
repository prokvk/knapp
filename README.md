knapp
=====

is an application wrapper for Node API. It covers:

- logging ([morgan](https://www.npmjs.com/package/morgan))
- request handling ([express](https://www.npmjs.com/package/express), [body-parser](https://www.npmjs.com/package/body-parser), 404 errors)
- loading configs ([dotenv](https://www.npmjs.com/package/dotenv) + [cson-config](https://www.npmjs.com/package/cson-config))
- auth (currently just static tokens)
- router (with automatic validation [knode-jsv](https://www.npmjs.com/package/knode-jsv))
- documentation generator (feature of [nodestack](https://github.com/prokvk/node-stack))
- automated tests of routes (feature of [nodestack](https://github.com/prokvk/node-stack))

# Install:

```
npm install --save knapp
```

# API filesystem structure (recommended)

```
|——config
   |——.env
   |——config.cson
|——lib
   |——lib.js
|——log
|——node_modules
|——index.js
|——package.json
|——routes.js
```

`.env` file adhers to style described in [dotenv](https://www.npmjs.com/package/dotenv) module

`config.cson` adhers to [CSON](https://github.com/bevry/cson) format

# Sample .env file

```
AUTH_TOKEN="your.secret.token.goes.here"
KNAPP_PORT=8888
MYSQL_USER=user
MYSQL_PASS="secret.pass"
MYSQL_HOST=http://host.domain
MYSQL_DB=mydb
```

# Sample config.cson file

```
knapp:
	port: process.env.KNAPP_PORT
	static_tokens: [
		process.env.AUTH_TOKEN
	]

mysql:
	connection: "mysql://#{process.env.MYSQL_USER}:#{process.env.MYSQL_PASS}@#{process.env.MYSQL_HOST}/{process.env.MYSQL_DB}"
```

If you want to use `static_token` auth, you need to define your tokens in an array as shown above.

# index.js template

```javascript
var app = require('knapp');

app.init({
  env_path: './config/.env',
  config_path: './config/config.cson',
  api_base_url: '/api/v1',
  auth: 'static_token'
});

app.setRoutes(require('./routes')(app.getRouter()));

app.start(process.config.knapp.port);
``` 

This is the full configuration of knapp, initialized and listening on given port. You should only change the object given to the `app.init()` call. If you leave any of the keys out the defaults will be used, these are:

```javascript
var defaults = {
  env_path: './config/.env',
  config_path: './config/config.cson',
  api_base_url: '/api/v1',
  auth: 'none'
};
```

After you call `app.init()` you have the following process variables available:

```
process.app - knapp initialized object
process.knapp_params - the object passed to app in app.init() call
process.config - config.cson with env vars applied
```

`app.setRoutes()` call in the `index.js` template requires `routes` module which takes the router argument (this needs to be knapp router). Here is a template routes file:

# routes.js template

```javascript
module.exports = function(router) {
  //sample route START
  var meta = {
    inSchema: {
      type: 'object',
      required: true,
      properties: {
        importantField: {
          type: 'string',
          required: true
        },
        limit: {
          type: 'integer'
        }
      }
    }
  };
  router.post('/test', meta, function(req, res) {
    return res.json({
      success: true
    });
  });
  //sample route END

  //we need to return router like this in order for knapp to work
  return router.getRouter();
};
```

When defining routes, the router accepts `meta` object, full example of this object:

```javascript
var meta = {
  description: 'Endpoint description',
  inSchema: {
    type: 'object',
    required: true,
    properties: {
      importantField: {
        type: 'string',
        required: true,
        description: 'Field description'
      },
      limit: {
        type: 'integer'
      }
    }
  },
  outSchema: {
    type: 'object',
    properties: {
      success: {
        type: 'boolean'
      }
    }
  },
  testRequest: {
    importantField: 'test'
  }
};
```

The `inSchema` key, if provided, is used for automatic request validation. The `outSchema` and `testRequest` are used by documentation generator and automated tests.

Documentation generator and automated tests are currently de facto designed to work with [nodestack](https://github.com/prokvk/node-stack). They are not prepared to work out of the box.

# Getting request data

As with `express` you need to distinguish between requests with body (POST, PUT, UPDATE) and query requests (GET, DELETE). To get data from requests with body you use `req.body`, otherwise `req.query`. Or you can use router's method `getRequestData` like this (again sample `routes` module) which does it for you:

```javascript
module.exports = function(router) {
  //sample route START
  var meta = {
    inSchema: {
      type: 'object',
      required: true,
      properties: {
        importantField: {
          type: 'string',
          required: true
        },
        limit: {
          type: 'integer'
        }
      }
    }
  };
  router.post('/test', meta, function(req, res) {
    var data = router.getRequestData(req); //<<< HERE <<<
    return res.json({
      success: true
    });
  });
  //sample route END

  //we need to return router like this in order for knapp to work
  return router.getRouter();
};
```