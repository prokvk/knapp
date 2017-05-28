validateInput = require( './util/jsonschema_validator' ).validateInput
express = require('express')
router = express.Router()

module.exports = do () ->
	addRoute = () ->
		#prefix
		#schema validation
		1

	get: (url, schema = null, cb) ->
		router.get url, cb

	put: (url, schema = null, cb) ->
		router.put url, cb

	post: (url, schema = null, cb) ->
		router.post url, cb

	update: (url, schema = null, cb) ->
		router.update url, cb

	delete: (url, schema = null, cb) ->
		router.delete url, cb

	getRouter: () -> router