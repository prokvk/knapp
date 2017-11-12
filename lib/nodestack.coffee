fs = require 'fs'
_ = require 'lodash'
yaml = require 'js-yaml'

exports.getNodestackConfigVals = () ->
	return yaml.safeLoad(fs.readFileSync('nsconf.yml', 'utf8')) if fs.existsSync('nsconf.yml')
	path = '.nodestack'
	data = fs.readFileSync path
	lines = data.toString().split("\n").filter((item) -> _.trim(item) isnt '' and !item.match /^#/).map (item) -> _.trim item
	res = {}
	block = null
	for item in lines
		if item.match /^\[([^\]]+)\]$/
			block = _.trim item, '[]'
			res[block] ?= {}
		else
			if block?
				name = item.replace /^([^=]+)=(.+)$/, '$1'
				val = _.trim item.replace(/^([^=]+)=(.+)$/, '$2'), '\'"'
				res[block][name] = val

	res

exports.getSwaggerData = (path) ->
	data = fs.readFileSync path
	JSON.parse data
