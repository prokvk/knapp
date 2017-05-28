_ = require('lodash')

initRoutes = (params) ->
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

	if params.auth is true
		# Auth Middleware - This will check if the token is valid
		# Only the requests that start with /api/v1/* will be checked for the token.
		# Any URL's that do not follow the below pattern should be avoided unless you 
		# are sure that authentication is not needed
		process.app.all "#{params.apiBaseUrl}/*", [ require('./middlewares/validateRequest') config, auth ]

	process.app.use '/', require('./routes') auth, imgs

	# If no route is matched by now, it must be a 404
	process.app.use (req, res, next)->
		err = new Error('Not Found')
		err.status = 404
		next res.json {success: false, message: 'ERROR: 404 Not found'}

exports.init = (params) ->
		require('dotenv').config {path: params.envPath}
		require('cson-config').load(params.configPath)

		express = require('express')
		logger = require('morgan')
		bodyParser = require('body-parser')

		app = express()
		app.use logger('dev')
		app.use bodyParser.json()

		initRoutes params

		process.app = app

exports.test = () ->
		console.log process.config
