validateInput = require( 'knode-jsv' ).validateInput
express = require('express')
router = express.Router()

module.exports = do () ->
	addRoute = (method, url, schema, cb) ->
		router[method] "#{process.knapp_params.api_base_url}#{url}", (req, res) ->
			dataRaw = if ['get', 'delete'].indexOf(method) is -1 then req.body else req.query
			if schema?
				err = validateInput dataRaw, schema
				return res.json err if err
			cb req, res

	get: (url, schema = null, cb) ->
		addRoute 'get', url, schema, cb

	put: (url, schema = null, cb) ->
		addRoute 'put', url, schema, cb

	post: (url, schema = null, cb) ->
		addRoute 'post', url, schema, cb

	update: (url, schema = null, cb) ->
		addRoute 'update', url, schema, cb

	delete: (url, schema = null, cb) ->
		addRoute 'delete', url, schema, cb

	getRouter: () -> router