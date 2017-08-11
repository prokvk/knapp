module.exports = do () -> (req, res, next)->
	return next() if process.knapp_params.auth is 'none'

	token = (req.body && req.body.access_token) || (req.query && req.query.access_token) || req.headers['x-access-token']

	if process.knapp_params.auth is 'static_token'
		if process.config.knapp.static_tokens.indexOf(token) is -1
			return process.request_validation_error_handler {message: "Invalid Token"}, res
		else
			return next()

	next()
