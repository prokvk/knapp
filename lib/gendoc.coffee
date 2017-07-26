fs = require 'fs'
ns = require './nodestack'

getHeader = () ->
	conf = ns.getNodestackConfigVals '.nodestack'

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

	data.description = meta.description if meta.description?

	if meta?.inSchema?.properties? and Object.keys(meta.inSchema.properties).length > 0
		bodyParam = ['get', 'delete'].indexOf(method) is -1

		for item in Object.keys meta.inSchema.properties
			base = meta.inSchema.properties[item]
			val =
				name: item
				in: if bodyParam then 'body' else 'query'
				required: base.required || false
				type: base.type
				description: if base.description then base.description else null

			if bodyParam
				delete val.type
				val.schema = {type: base.type}

			data.parameters.push val

		if process.knapp_params.auth is 'static_token'
			data.parameters.push {
				name: "x-access-token"
				in: 'header'
				type: 'string'
				required: true
				description: "AUTH_TOKEN for accessing this API"
			}
	else
		delete data.parameters

	data

exports.generateSwaggerFile = () ->
	throw "ERROR: routes are empty" unless process.routes?

	conf = ns.getNodestackConfigVals '.nodestack'

	data = getHeader()
	data.paths = {}

	for method in Object.keys process.routes
		for url in Object.keys process.routes[method]
			data.paths[url] ?= {}

			data.paths[url][method] = getEndpointDefinition method, url

	fs.writeFileSync conf.swagger.source_file, JSON.stringify data, 'utf8'
	process.exit 0

exports.generateDocumentation = () ->
	getMethodLabel = (method) ->
		map =
			'get': 'success'
			'put': 'warning'
			'delete': 'danger'

		type = if map[method]? then map[method] else 'default'
		"<span class=\"label label-#{type}\">#{method.toUpperCase()}</span>"

	getEndpointAnchorTag = (method, path) -> "#{method}_#{path.replace /\//g, '_'}"

	getEndpointsMenuHtml = (paths) ->
		out = ""
		for path, methods of paths
			for method, pathData of methods
				out += "<li><h4><a href=\"##{getEndpointAnchorTag(method, path)}\">#{getMethodLabel(method)} #{path}</a></h4></li>"
		out

	getCurlCall = (swaggerData, method, path) ->
		token = if process.knapp_params.auth is 'static_token' then " -H \"x-access-token: AUTH_TOKEN\"" else ""
		params = swaggerData.paths[path][method].parameters?.filter (item) -> item.required is true and item.in isnt 'header'
		data = ""
		uriParams = ""
		if params
			if ['get', 'delete'].indexOf(method) isnt -1
				pairs = params.map (item) -> "#{item.name}=VALUE"
				uriParams = "?#{pairs.join('&')}"
			else
				pData = {}
				pData[item.name] = 'VALUE' for item in params
				str = JSON.stringify(pData).replace /"VALUE"/g, 'VALUE'
				data = " -d '#{str}'"
		"curl -X#{method.toUpperCase()} -H \"Content-Type: #{swaggerData.consumes}\"#{token}#{data} #{swaggerData.host}#{path}#{uriParams}"

	getEndpointParametersHtml = (swaggerData, method, path) ->
		_getParamType = (param) ->
			routeData = process.routes[method][path].inSchema.properties[param.name]
			if routeData?.oneOf? #not read from swaggerfile since swagger doesn't support `oneOf`. for purpose of generating DOC this is taken from routes meta directly
				opts = []
				for item in routeData.oneOf
					if item.type is 'array'
						opts.push "array of #{item.items.type}s"
					else
						opts.push item.type
				return opts.join '|'
			else
				return param.type if param.type?
				return param.schema.type if param.schema?.type?
				null

		_getParamsTable = (params) ->
			rows = ""
			for item in params
				req = if item.required then "<span class=\"label label-danger\">REQUIRED</span>" else ""
				type = _getParamType item
				rows += "<tr>
							<th scope=\"row\">#{item.name}</th>
							<td>#{type}</td>
							<td>#{req}</td>
							<td>#{item.description || ''}</td>
						</tr>"

			"<table class=\"table table-striped m-0\">
					<thead>
						<tr>
							<th>Name</th>
							<th>Type</th>
							<th>Required</th>
							<th>Description</th>
						</tr>
					</thead>
					<tbody>#{rows}</tbody>
				</table>"

		out = ""
		params = swaggerData.paths[path][method].parameters?.filter (item) -> item.in isnt 'header'
		headerParams = swaggerData.paths[path][method].parameters?.filter (item) -> item.in is 'header'

		if headerParams
			out += "<h4 style=\"padding-top:15px;\">Header parameters</h4>"
			out += _getParamsTable headerParams

		if params
			if ['get', 'delete'].indexOf(method) isnt -1
				out += "<h4 style=\"padding-top:15px;\">URI parameters</h4>"
			else
				out += "<h4 style=\"padding-top:15px;\">Body parameters</h4>"

			out += _getParamsTable params

		out

	getEndpointResponsesHtml = (swaggerData, method, path) ->
		_formatResponseSchema = (schema) ->
			if schema.type is 'object'
				outSchema = {}

				for name, item of schema.properties
					if ['object', 'array'].indexOf(item.type) isnt -1
						outSchema[name] = _formatResponseSchema item
					else
						outSchema[name] = "VALUE"
			else if schema.type is 'array'
				outSchema = []

				if ['object', 'array'].indexOf(schema.items.type) isnt -1
					outSchema.push _formatResponseSchema schema.items
				else
					outSchema.push "VALUE"
			else
				outSchema = "VALUE"

			outSchema

		out = "<h4 style=\"padding-top:15px;\">Responses</h4>"
		for name, response of swaggerData.paths[path][method].responses
			name += " (#{response.description})" if response.description?
			schema = _formatResponseSchema response.schema
			str = JSON.stringify(schema).replace /"VALUE"/g, 'VALUE'
			out += "<p>#{name}:</p><pre>#{str}</pre>"

		out

	getEndpointsDocHtml = (swaggerData) ->
		out = ""
		for path, methods of swaggerData.paths
			for method, pathData of methods
				curl = getCurlCall swaggerData, method, path
				params = getEndpointParametersHtml swaggerData, method, path
				responses = getEndpointResponsesHtml swaggerData, method, path
				desc = if pathData.description? then "<p style=\"padding-top: 15px;\">#{pathData.description}</p>" else ""

				out += "<div class=\"card-box\">
					<h3 id=\"#{getEndpointAnchorTag(method, path)}\">
						#{getMethodLabel(method)} #{path}
					</h3>

					#{desc}

					<pre style=\"margin-top: 30px; font-weight: bold;\">#{curl}</pre>

					#{params}
					#{responses}
				</div>"
		out

	getCss = () -> fs.readFileSync('./doc.css').toString()

	getHtmlTemplate = () ->
		"<!DOCTYPE html>
		<html>
			<head>
				<title>__PROJECT_NAME__ - documentation</title>
				<meta http-equiv=\"Content-Type\" content=\"text/html; charset=MacRoman\">
				<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">

				<style>__CSS__</style>
			</head>
			<body style=\"padding-bottom: 0;\">
				<div class=\"container\">
					<div class=\"row\">
						<div class=\"menu col-md-3\">
							<h2>Endpoints</h2>

							<ul>__ENDPOINTS_MENU__</ul>
						</div>

						<div class=\"col-md-9\">
							<h1>__PROJECT_NAME__ - documentation</h1>

							<div class=\"card-box\">
								<h2>API Version</h2>
								<p>__API_VERSION__</p>

								<h2>Description</h2>
								<p>__API_DESCRIPTION__</p>

								<h2>Consumes</h2>
								<p>__CONSUMES__</p>

								<h2>Produces</h2>
								<p>__PRODUCES__</p>

								<h2>Base URL</h2>
								<p>__BASE_URL__</p>
							</div>

							__ENDPOINTS_DOC__
						</div>
					</div>
				</div>
			</body>
		</html>"

	data = ns.getSwaggerData 'swagger.json'
	menu = getEndpointsMenuHtml data.paths
	endpoints = getEndpointsDocHtml data
	html = getHtmlTemplate()
	pairs =
		'__PROJECT_NAME__': data.info.title
		'__CSS__': getCss()
		'__ENDPOINTS_MENU__': menu
		'__API_VERSION__': data.info.version
		'__API_DESCRIPTION__': data.info.description
		'__CONSUMES__': data.consumes
		'__PRODUCES__': data.produces
		'__BASE_URL__': data.host
		'__ENDPOINTS_DOC__': endpoints

	for srch, replace of pairs
		reg = new RegExp srch, 'g'
		html = html.replace reg, replace

	fs.writeFileSync 'doc.html', html, 'utf8'

	process.exit 0
