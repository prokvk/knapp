fs = require 'fs'
_ = require 'lodash'

getNodestackConfigVals = (path) ->
	data = fs.readFileSync path
	lines = data.toString().split("\n").filter (item) -> _.trim(item) isnt '' and !item.match /^#/
	lines = lines.map (item) -> _.trim item
	res = {}
	block = null
	for item in lines
		if item.match /^\[([^\)]+)\]$/
			block = _.trim item, '[]' if item.match /^\[([^\)]+)\]$/
			res[block] ?= {}
		else
			if block?
				name = item.replace /^([^=]+)=(.+)$/, '$1'
				val = item.replace /^([^=]+)=(.+)$/, '$2'
				res[block][name] = val

	res

getHeader = () ->
	conf = getNodestackConfigVals '.nodestack'

	swagger: conf.swagger.swagger_version
	info:
		version: conf.swagger.info_version
		title: conf.swagger.info_title
		description: conf.swagger.info_description
	host: conf.swagger.host
	consumes: conf.swagger.consumes
	produces: conf.swagger.produces

exports.generateSwaggerFile = () ->
	throw "ERROR: routes are empty" unless process.routes?

	data = getHeader()

	console.log data
	process.exit 0