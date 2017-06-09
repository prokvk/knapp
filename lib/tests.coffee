req = require 'knode-request'
validateInput = require('knode-jsv').validateInput
async = require 'async'
_ = require 'lodash'
ns = require './nodestack'

invalidSchemaCode = 400
authErrorCode = 400
testsCount = 0
successfulTests = 0

customColors =
	pass: 90
	fail: 31

symbols =
	ok: '✓'
	err: '✖'

getBaseApiUrl = () ->
	conf = ns.getNodestackConfigVals '.nodestack'
	"#{conf.swagger.host}#{process.knapp_params.api_base_url}"
	
colorStr = (type, str) -> "\u001b[#{customColors[type]}m#{str}\u001b[0m"

getTestRoutes = () ->
	res = []

	for method in Object.keys process.routes
		for path in Object.keys process.routes[method]
			route = process.routes[method][path]

			if route.testRequest?
				res.push {
					path: path
					method: method
					meta: route
				}

	res

routeHasRequiredField = (route) ->
	if route.meta.inSchema?.properties? and Object.keys(route.meta.inSchema.properties).length > 0
		for key in Object.keys(route.meta.inSchema.properties)
			item = route.meta.inSchema.properties[key]
			return true if item.required?

	false

testRoute = (route, authHeaderToken, checkSchema, expectedResponseCode, responseSuffix, done) ->
	_log = (isValid, message) ->
		{method, meta, path} = route
		suffix = if isValid and responseSuffix? then " (#{responseSuffix})" else ""
		symbol = if isValid then colorStr('pass', symbols.ok) else colorStr('fail', symbols.err)
		console.log "#{symbol} #{method.toUpperCase()} #{process.knapp_params.api_base_url}#{path}: #{message}#{suffix}\n"

	{path, method, meta} = route

	headers = if authHeaderToken? then {'x-access-token': authHeaderToken} else null
	url = "#{getBaseApiUrl()}#{path}"

	async.series [
		(cb) ->
			#simulate invalid schema if we have a required field to test on
			return cb() if !routeHasRequiredField(route) or !checkSchema

			testsCount++
			req.send method, url, {}, headers, (err, res) ->
				if res.statusCode isnt invalidSchemaCode
					_log false, "Expected statuscode #{invalidSchemaCode} for invalid schema, got #{res.statusCode}"
					return cb()

				successfulTests++
				_log true, "Endpoint returned a valid response (Expected schema validation error)"
				cb()
		(cb) ->
			#default endpoint test
			testsCount++
			req.send method, url, meta.testRequest, headers, (err, res) ->
				if checkSchema
					err = validateInput res.body, meta.outSchema
					if err
						_log false, "Defined output schema doesn't match the actual reponse"
						return cb()

				if expectedResponseCode? and expectedResponseCode isnt res.statusCode
					_log false, "Expected statuscode #{expectedResponseCode}, got #{res.statusCode}"
					return cb()

				successfulTests++
				_log true, "Endpoint returned a valid response"
				cb()
	], done


testSchemaIntegrity = (routes) ->
	for route in routes
		{method, path, meta} = route

		if !meta.outSchema
			throw """ERROR: schema definition is invalid, route \"#{method.toUpperCase()} #{path}\" doesn't \
			have \"outSchema\" field required for tests"""

		err = validateInput meta.testRequest, meta.inSchema
		if err
			throw """ERROR: schema definition is invalid, test request for \
			route \"#{method.toUpperCase()} #{path}\" doesn't match defined input schema"""

exports.runTests = () ->
	routes = getTestRoutes()

	throw "ERROR: routes don't have any tests defined" if routes.length is 0

	testSchemaIntegrity routes

	if process.knapp_params.auth is 'static_token'
		authHeaderToken = process.config.knapp.static_tokens[0]
	else
		authHeaderToken = null

	async.series [
		(cb) ->
			#test 404 route
			nonExistingRoute = _.extend {}, routes[0], {path: '/xxx-invalid-url'}
			testRoute nonExistingRoute, authHeaderToken, false, 404, 'Expected 404 error for non existing route', cb
		(cb) ->
			#test missing token
			return cb() if process.knapp_params.auth is 'none'
			testRoute routes[0], null, false, authErrorCode, "Expected #{authErrorCode} error for missing auth token", cb
		(cb) ->
			#test invalid token
			return cb() if process.knapp_params.auth is 'none'
			testRoute routes[0], 'xxx invalid token', false, authErrorCode, "Expected #{authErrorCode} error for invalid auth token", cb
		(cb) ->
			#default routes tests
			async.eachSeries routes, (route, cb2) ->
				testRoute route, authHeaderToken, true, 200, null, cb2
			, cb
	], (err) ->
		if err
			console.log err
			process.exit 1

		if testsCount isnt successfulTests
			symbol = colorStr 'fail', symbols.err
			sum = colorStr 'fail', "#{successfulTests}/#{testsCount}"
			console.log "\n#{symbol} Tests completed, there were some errors - #{sum} passing."
			process.exit 1
		else
			symbol = colorStr 'pass', symbols.ok
			sum = colorStr 'pass', "#{successfulTests}/#{testsCount}"
			console.log "\n#{symbol} Tests completed - #{sum} passing."
			process.exit 0
