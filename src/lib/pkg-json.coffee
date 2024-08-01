# pkg-json.coffee

import {
	undef, defined, notdefined, isEmpty, nonEmpty, hasKey,
	assert, croak, OL, getOptions,
	} from '@jdeighan/llutils'
import {
	slurpPkgJSON, slurpJSON, barfJSON, barfPkgJSON,
	createFile, touch,
	} from '@jdeighan/llutils/fs'

# ---------------------------------------------------------------------------
# --- 1. Read in current package.json
#     2. If option 'fix':
#        - get keys from env var PROJECT_PACKAGE_JSON
#        - overwrite keys in package.json
#        - adjust name if env var PROJECT_NAME_PREFIX is set

export class PkgJson

	constructor: (hOptions={}) ->

		{fix} = getOptions hOptions, {
			fix: false
			}
		@hJson = slurpPkgJSON()
		if fix
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

# ---------------------------------------------------------------------------

getVersion = (pkg) =>

	switch pkg
		when 'coffeescript'
			return "^2.7.0"
		when 'ava'
			return "^6.1.3"
		when 'svelte'
			return "^5.0.0-next.200"
		when 'gulp'
			return "^5.0.0"
		when 'parcel'
			return "^2.12.0"
		else
			return 'latest'

