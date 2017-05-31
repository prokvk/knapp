module.exports = do () -> (req, res, next)->
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

	next()