validateInput = require( 'knode-jsv' ).validateInput

module.exports = (router) ->
	_getRequestData = (req) ->
		if ['get', 'delete'].indexOf(req.method.toLowerCase()) is -1
			return req.body
		else
			return req.query

	addRoute = (method, url, meta, cb) ->
		process.routes ?= {get: {},put: {},post: {},update: {},delete: {}}
		process.routes[method][url] = meta

		router[method] "#{process.knapp_params.api_base_url}#{url}", (req, res) ->
			dataRaw = _getRequestData req
			if meta?.inSchema?
				err = validateInput dataRaw, meta.inSchema
				if err
					res.status 400
					return res.json err
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

	getRequestData: _getRequestData

	getRouter: () -> router