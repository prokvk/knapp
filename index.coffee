_ = require 'lodash'

defaults =
	env_path: './config/.env'
	config_path: './config/config.cson'
	api_base_url: '/api/v1'
	auth: 'none'

loadConfig = (params, extend = true) ->
	params = _.extend defaults, params if extend
	process.knapp_params = params

	require('dotenv').config {path: params.env_path}
	require('cson-config').load(params.config_path)

setMode = () ->
	mode = null
	for item in process.argv
		if item.match /^mode=/
			mode = item.replace /^mode=/, ''
			break

	process.knapp_params.mode = mode

generateSwaggerFile = () -> require('./gendoc').generateSwaggerFile()

initRoutes = (routes) ->
	process.app.all '/*', (req, res, next)->
		# CORS headers
		res.header 'Access-Control-Allow-Origin', '*' # restrict it to the required domain
		res.header 'Access-Control-Allow-Methods', 'GET,PUT,POST,UPDATE,DELETE,OPTIONS'
		# Set custom headers for CORS
		res.header 'Access-Control-Allow-Headers', 'Content-type,Accept,X-Access-Token,X-Key'
		
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
	params = _.extend defaults, params
	loadConfig params, false

	express = require('express')
	logger = require('morgan')
	bodyParser = require('body-parser')

	app = express()
	app.use logger('dev')
	app.use bodyParser.json()

	setMode()

	process.app = app

exports.setRoutes = (routes) -> initRoutes routes

exports.getMode = () -> process.knapp_params.mode

exports.start = (port) ->
	if process.knapp_params.mode is 'tests'
		console.log 'do tests'
		process.exit 0
	else if process.knapp_params.mode is 'gendoc'
		generateSwaggerFile()
		process.exit 0
	else
		process.app.listen port, ()->
			console.log "knapp server listening on port '#{port}'"

exports.loadConfig = loadConfig

exports.router = require('./router')