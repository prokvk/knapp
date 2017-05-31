module.exports = () ->
	users = [{
		name: process.config.knapp.default_user.name
		role: process.config.knapp.default_user.role
		username: process.config.knapp.default_user.username
		password: process.config.knapp.default_user.password
	}]

	getUserByCredentials: (username, password) ->
		for user in users
			if user.username is username && user.password is password
				return user
		return null

	getUserByUserName: (username) ->
		for user in users
			if user.username is username
				return user
		return null