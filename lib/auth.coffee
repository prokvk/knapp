jwt = require('jwt-simple')

module.exports = (usersModel) =>
	genToken = (user)->
		expires = expiresIn 7 # 7 days
		token = jwt.encode { exp: expires, username: user.username }, process.env.APP_SECRET
		{
			token: token,
			expires: expires,
			user: user
		}

	expiresIn = (numDays)->
		dateObj = new Date()
		dateObj.setDate(dateObj.getDate() + numDays)

	_validate = (username, password)->
		usersModel.getUserByCredentials username, password

	login: (req, res)->
		username = req.body.username || ''
		password = req.body.password || ''
		if (username is '' || password is '')
			res.status 401
			res.json {
				"status": 401,
				"message": "Invalid credentials"
			}
			return

		# Fire a query to your DB and check if the credentials are valid
		dbUserObj = _validate username, password
		unless dbUserObj # If authentication fails, we send a 401 back
			res.status 401
			res.json {
				"status": 401,
				"message": "Invalid credentials"
			}
			return

		if dbUserObj
			# If authentication is success, we will generate a token and dispatch it to the client
			res.json genToken(dbUserObj)

	validate: (username, password)-> _validate username, password

	validateUser: (username)->
		usersModel.getUserByUserName username