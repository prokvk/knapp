_ = require 'lodash'
ns = require './lib/nodestack'
async = require 'async'

defaults =
	env_path: './config/.env'
	config_path: './config/config.cson'
	api_base_url: '/api/v1'

loadConfig = (params, extend = true) ->
	require('dotenv').config {path: params.env_path}
	require('cson-config').load(params.config_path)

	defaults.sentry = if process.env.KNAPP_SENTRY? then process.env.KNAPP_SENTRY else ""
	defaults.auth = if process.env.KNAPP_AUTH? then process.env.KNAPP_AUTH else "none"

	params = _.extend defaults, params if extend
	process.knapp_params = params

setMode = (explicitMode = null) ->
	if explicitMode?
		process.knapp_params.mode = explicitMode
		return

	mode = null
	for item in process.argv
		if item.match /^mode=/
			mode = item.replace /^mode=/, ''
			break

	process.knapp_params.mode = mode

generateSwaggerFile = () -> require('./lib/gendoc').generateSwaggerFile()

generateDocumentation = () -> require('./lib/gendoc').generateDocumentation()

runTests = (done = null) -> require('./lib/tests').runTests(done)

requestValidationErrorHandler = (err, res) ->
	res.status 400
	res.json err

testBeforeHandler = (done) -> done()
testAfterHandler = (done) -> done()

initRoutes = (routes) ->
	process.app.all '/*', (req, res, next)->
		# CORS headers
		res.header 'Access-Control-Allow-Origin', '*' # restrict it to the required domain
		res.header 'Access-Control-Allow-Methods', 'GET,PUT,POST,UPDATE,DELETE,OPTIONS'

		allowHeaders = if process.knapp_params.allow_headers? then ",#{process.knapp_params.allow_headers.join(',')}" else ""

		# Set custom headers for CORS
		res.header 'Access-Control-Allow-Headers', "Content-type,Accept,X-Access-Token,X-Key#{allowHeaders}"

		if process.knapp_params.expose_headers?
			res.header 'Access-Control-Expose-Headers', process.knapp_params.expose_headers.join(',')

		if req.method is 'OPTIONS'
			res.status(200).end()
		else
			next()

	if process.knapp_params.auth isnt 'none'
		# Auth Middleware - This will check if the token is valid
		# Only the requests that start with /api/v1/* will be checked for the token.
		# Any URL's that do not follow the below pattern should be avoided unless you
		# are sure that authentication is not needed
		process.app.all "#{process.knapp_params.api_base_url}/*", [ require('./middlewares/validateRequest') ]

	process.app.use '/', routes

	# If no route is matched by now, it must be a 404
	process.app.use (req, res, next)->
		next res.status(404).send {error: '404 Not found'}

exports.init = (params) ->
	loadConfig params

	express = require('express')
	logger = require('morgan')
	bodyParser = require('body-parser')

	explicitMode = params.mode || null
	setMode explicitMode

	app = express()
	app.use logger('dev')
	app.use bodyParser.json()

	process.app = app
	process.request_validation_error_handler = requestValidationErrorHandler
	process.test_before_handler = testBeforeHandler
	process.test_after_handler = testAfterHandler
	process.router = require('./lib/router') express.Router()

exports.setRequestValidationErrorHandler = (handler) -> process.request_validation_error_handler = handler
exports.setTestBeforeHandler = (handler) -> process.test_before_handler = handler
exports.setTestAfterHandler = (handler) -> process.test_after_handler = handler

exports.setRoutes = (routes) ->
	initRoutes routes

	if process.knapp_params.sentry? and process.knapp_params.sentry is 'on'
		raven = require 'raven'
		raven.config(process.env.SENTRY_URL).install()

		process.app.use raven.requestHandler()
		process.app.use raven.errorHandler()

exports.getMode = () -> process.knapp_params.mode

exports.start = (port) ->
	if process.knapp_params.mode is 'tests'
		port = process.env.TESTS_PORT if process.env.TESTS_PORT?
		process.app.listen port, ()->
			_res = 1

			async.series [
				(cb) ->
					process.test_before_handler cb
				(cb) ->
					runTests (err, res) ->
						return cb err if err
						_res = res
						cb()
				(cb) ->
					process.test_after_handler cb
			], (err) ->
				process.exit _res
	else if process.knapp_params.mode is 'genswaggerfile'
		generateSwaggerFile()
	else if process.knapp_params.mode is 'gendoc'
		generateDocumentation()
	else
		process.app.listen port, ()->
			console.log "knapp server listening on port '#{port}'"

exports.loadConfig = loadConfig

exports.getNsConf = ns.getNodestackConfigVals

exports.getRouter = () -> process.router
