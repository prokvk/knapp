jwt = require('jwt-simple')

module.exports = (config, auth) -> (req, res, next)->
	validateUser = auth.validateUser
	
	token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token']
	key = (req.body && req.body.x_key) || (req.query && req.query.x_key) || req.headers['x-key']
	
	return next() if (key is config.node.tests.x_key && token is config.node.tests.x_access_token)

	try
		decoded = jwt.decode token, require('../config/secret.coffee')()
		if decoded.exp <= Date.now()
			res.status 400
			res.json {
				"status": 400,
				"message": "Token Expired"
			}
			return

		# Authorize the user to see if s/he can access our resources
		if decoded.username isnt key
			res.status 401
			res.json {
				"status": 401,
				"message": "Invalid User"
			}
			return

		dbUser = validateUser key # The key would be the logged in user's username
		unless dbUser
			res.status 403
			res.json {
				"status": 403,
				"message": "Not Authorized"
			}
			return

		next()
	catch err
		res.status 500
		res.json {
			"status": 500,
			"message": "Oops something went wrong",
			"error": err
		}