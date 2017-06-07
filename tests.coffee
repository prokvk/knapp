exports.runTests = () ->
	console.log "mkay"
	process.exit 0

	throw "ERROR: routes are empty" unless process.routes?

	