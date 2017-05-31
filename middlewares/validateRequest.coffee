jwt = require('jwt-simple')

module.exports = (auth) -> (req, res, next)->
	return next() if process.knapp_params.auth is 'none'

	token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token']
	
	if process.knapp_params.auth is 'static_token'
		if process.config.knapp.static_tokens.indexOf(token) is -1
			res.status 400
			res.json {
				"status": 400,
				"message": "Invalid Token"
			}
			return
		else
			return next()

	# if process.knapp_params.auth is 'user'
	# 	key = (req.body && req.body.x_key) || (req.query && req.query.x_key) || req.headers['x-key']

	# 	try
	# 		decoded = jwt.decode token, process.env.APP_SECRET
	# 		if decoded.exp <= Date.now()
	# 			res.status 400
	# 			res.json {
	# 				"status": 400,
	# 				"message": "Token Expired"
	# 			}
	# 			return

	# 		# Authorize the user to see if s/he can access our resources
	# 		if decoded.username isnt key
	# 			res.status 401
	# 			res.json {
	# 				"status": 401,
	# 				"message": "Invalid User"
	# 			}
	# 			return

	# 		dbUser = auth.validateUser key # The key would be the logged in user's username
	# 		unless dbUser
	# 			res.status 403
	# 			res.json {
	# 				"status": 403,
	# 				"message": "Not Authorized"
	# 			}
	# 			return

	# 		next()
	# 	catch err
	# 		res.status 500
	# 		res.json {
	# 			"status": 500,
	# 			"message": "Oops something went wrong",
	# 			"error": err
	# 		}

	next()