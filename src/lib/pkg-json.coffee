# pkg-json.coffee

import {
	undef, defined, notdefined, isEmpty, nonEmpty, getOptions, hasKey,
	assert, croak, OL,
	} from '@jdeighan/llutils'
import {
	slurpPkgJSON, slurpJSON, barfJSON, barfPkgJSON,
	createFile, touch,
	} from '@jdeighan/llutils/fs'

hVersions = {
	coffeescript: "^2.7.0"
	ava: "^6.1.3"
	svelte: "^5.0.0-next.200"
	gulp: "^5.0.0"
	parcel: "^2.12.0"
	'@jdeighan/llutils': "^1.0.8"
	}

# ---------------------------------------------------------------------------

getVersion = (pkg) =>

	if hasKey(hVersions, pkg)
		return hVersions[pkg]
	else
		return 'latest'

# ---------------------------------------------------------------------------
# --- 1. Read in current package.json
#     2. get keys from env var PROJECT_PACKAGE_JSON
#     3. overwrite keys in package.json with #2 keys
#     4. adjust name if env var PROJECT_NAME_PREFIX is set

export class PkgJson

	constructor: () ->

		@hJson = slurpPkgJSON()
		@mergeKeysFromEnv()
		prefix = process.env.PROJECT_NAME_PREFIX
		if nonEmpty(prefix)
			@setField 'name', "#{prefix}#{@hJson.name}"
		@setField 'license', 'MIT'
		@addDep '@jdeighan/llutils'

	# ..........................................................

	mergeKeysFromEnv: () ->

		pkgJson = process.env.PROJECT_PACKAGE_JSON
		if nonEmpty(pkgJson)
			# --- Can be either a JSON string or a file path
			if (pkgJson.indexOf('{') == 0)
				hSetKeys = JSON.parse(pkgJson)
			else
				hSetKeys = slurpJSON(pkgJson)
			Object.assign @hJson, hSetKeys
		return

	# ..........................................................

	name: () ->

		return @hJson.name

	# ..........................................................

	setField: (name, value) ->

		@hJson[name] = value
		console.log "   #{name} = #{OL(value)}"
		return

	# ..........................................................

	addScript: (name, str) ->

		if ! hasKey(@hJson, 'scripts')
			@hJson.scripts = {}
		@hJson.scripts[name] = str
		console.log "   SCRIPT #{name} = #{OL(str)}"
		return

	# ..........................................................

	addExport: (name, str) ->

		if ! hasKey(@hJson, 'exports')
			@hJson.exports = {}
		@hJson.exports[name] = str
		console.log "   EXPORT #{name} = #{OL(str)}"
		return

	# ..........................................................

	addBin: (name, str) ->

		if ! hasKey(@hJson, 'bin')
			@hJson.bin = {}
		@hJson.bin[name] = str
		console.log "   BIN #{name} = #{OL(str)}"
		return

	# ..........................................................

	addDep: (pkg) ->

		if ! hasKey(@hJson, 'dependencies')
			@hJson.dependencies = {}
		if @hJson?.devDependencies?.pkg
			delete @hJson.devDependencies.pkg
		version = getVersion(pkg)
		@hJson.dependencies[pkg] = version
		console.log "   DEP #{pkg} = #{OL(version)}"
		return

	# ..........................................................

	addDevDep: (pkg) ->

		if ! hasKey(@hJson, 'devDependencies')
			@hJson.devDependencies = {}
		if @hJson?.dependencies.pkg
			delete @hJson.dependencies.pkg
		version = getVersion(pkg)
		@hJson.devDependencies[pkg] = version
		console.log "   DEV DEP #{pkg} = #{OL(version)}"
		return

	# ..........................................................

	isInstalled: (pkg) ->

		return hasKey(@hJson.dependencies, pkg) \
				|| hasKey(@hJson.devDependencies, pkg)

	# ..........................................................

	write: () ->

		barfPkgJSON @hJson
		return
