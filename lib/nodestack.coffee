fs = require 'fs'
_ = require 'lodash'

exports.getNodestackConfigVals = (path) ->
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