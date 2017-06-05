validateInput = require( 'knode-jsv' ).validateInput

module.exports = (router) ->
	addRoute = (method, url, meta, cb) ->
		process.routes ?= {get: {},put: {},post: {},update: {},delete: {}}
		process.routes[method][url] = meta

		router[method] "#{process.knapp_params.api_base_url}#{url}", (req, res) ->
			dataRaw = if ['get', 'delete'].indexOf(method) is -1 then req.body else req.query
			if meta?.inSchema?
				err = validateInput dataRaw, meta.inSchema
				return res.json err if err
			cb req, res

	get: (url, meta = null, cb) ->
		addRoute 'get', url, meta, cb

	put: (url, meta = null, cb) ->
		addRoute 'put', url, meta, cb

	post: (url, meta = null, cb) ->
		addRoute 'post', url, meta, cb

	update: (url, meta = null, cb) ->
		addRoute 'update', url, meta, cb

	delete: (url, meta = null, cb) ->
		addRoute 'delete', url, meta, cb

	getRouter: () -> router