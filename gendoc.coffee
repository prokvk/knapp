fs = require 'fs'
_ = require 'lodash'

getNodestackConfigVals = (path) ->
	data = fs.readFileSync path
	lines = data.toString().split("\n").filter((item) -> _.trim(item) isnt '' and !item.match /^#/).map (item) -> _.trim item
	res = {}
	block = null
	for item in lines
		if item.match /^\[([^\)]+)\]$/
			block = _.trim item, '[]'
			res[block] ?= {}
		else
			if block?
				name = item.replace /^([^=]+)=(.+)$/, '$1'
				val = _.trim item.replace(/^([^=]+)=(.+)$/, '$2'), '\'"'
				res[block][name] = val

	res

getHeader = () ->
	conf = getNodestackConfigVals '.nodestack'

	swagger: conf.swagger.swagger_version
	info:
		version: conf.swagger.info_version
		title: conf.swagger.info_title
		description: conf.swagger.info_description
	host: "#{conf.swagger.host}#{process.knapp_params.api_base_url}"
	consumes: conf.swagger.consumes
	produces: conf.swagger.produces

getEndpointDefinition = (method, url) ->
	meta = process.routes[method][url]

	data =
		operationId: [method, url].map((item) -> item.toLowerCase().replace /[^a-z0-9]/g, '').join '_'
		parameters: []
		responses:
			default:
				description: 'Default response'
				schema: if meta?.outSchema? then meta.outSchema else null 

	if meta?.inSchema?.properties? and Object.keys(meta.inSchema.properties).length > 0
		bodyParam = ['get', 'delete'].indexOf(method) is -1

		for item in Object.keys meta.inSchema.properties
			base = meta.inSchema.properties[item]
			val =
				name: item
				in: if bodyParam then 'body' else 'query'
				required: base.required || false
				type: base.type

			if bodyParam
				delete val.type
				val.schema = {type: base.type}

			data.parameters.push val
	else
		delete data.parameters

	data

exports.generateSwaggerFile = () ->
	throw "ERROR: routes are empty" unless process.routes?

	conf = getNodestackConfigVals '.nodestack'

	data = getHeader()
	data.paths = {}

	for method in Object.keys process.routes
		for url in Object.keys process.routes[method]
			data.paths[url] ?= {}

			data.paths[url][method] = getEndpointDefinition method, url

	fs.writeFileSync conf.swagger.source_file, JSON.stringify data, 'utf8'
