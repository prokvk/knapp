req = require 'knode-request'
validateInput = require('knode-jsv').validateInput
async = require 'async'

getTestRoutes = () ->
	res = []

	for method in Object.keys process.routes
		for url in Object.keys process.routes[method]
			route = process.routes[method][url]

			#TODO - base API URL!!!
			base = "http://172.17.0.4:8911/api/v1"

			if route.testRequest?
				res.push {
					url: "#{base}#{url}"
					path: url
					method: method
					meta: route
				}

	res

testRoute = (route, authHeaderToken, checkSchema, expectedResponseCode, validResponseSuffix, done) ->
	getResultObject = (isValid, route, message) ->
		{url, method, meta, path} = route
		suffix = if validResponseSuffix and isValid then " (#{validResponseSuffix})" else ""
		console.log "#{method.toUpperCase()} #{path}: #{message}#{suffix}"

		ok: isValid
		route: route
		message: message

	{url, method, meta} = route

	if authHeaderToken?
		headers = {'x-access-token': authHeaderToken}
	else
		headers = null

	req.send method, url, meta.testRequest, headers, (err, res) ->
		if checkSchema
			err = validateInput res.body, meta.outSchema
			if err
				return done null, getResultObject false, route, "Defined output schema doesn't match the actual reponse"
		if expectedResponseCode?
			if expectedResponseCode isnt res.statusCode
				return done null, getResultObject false, route, "Expected statuscode #{expectedResponseCode}, got #{res.statusCode}"

		done null, getResultObject true, route, "Endpoint returned a valid response"

exports.runTests = () ->
	routes = getTestRoutes()

	throw "ERROR: routes don't have any tests defined" if routes.length is 0

	# addAuthHeaderToken = if process.knapp_params.auth is 'none' then false else true
	if process.knapp_params.auth is 'static_token'
		authHeaderToken = process.config.knapp.static_tokens[0]
	else
		authHeaderToken = null

	async.series [
		(cb) ->
			#TODO - non existing route (404), testHeaders func
			cb()
		(cb) ->
			#test missing token
			return cb() if process.knapp_params.auth is 'none'
			testRoute routes[0], null, false, 400, 'Expected 400 error for missing auth token', cb
		(cb) ->
			#test invalid token
			return cb() if process.knapp_params.auth is 'none'
			testRoute routes[0], 'invalid token', false, 400, 'Expected 400 error for invalid auth token', cb
		(cb) ->
			async.eachSeries routes, (route, cb) ->
				testRoute route, authHeaderToken, true, 200, null, cb
			, cb
	], (err) ->
		console.log "ERROR: #{err}" if err
		console.log err if err
		process.exit 1 if err

		console.log "all good :)"
		process.exit 0
