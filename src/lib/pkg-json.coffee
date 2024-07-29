# pkg-json.coffee

import {
	undef, defined, notdefined, isEmpty, nonEmpty, getOptions, hasKey,
	assert, croak,
	} from '@jdeighan/llutils'
import {
	slurpJSON, barfJSON, createFile, touch,
	} from '@jdeighan/llutils/fs'

# ---------------------------------------------------------------------------
# --- 1. Read in current package.json
#     2. get keys from env var PROJECT_PACKAGE_JSON
#     3. overwrite keys in package.json with #2 keys
#     4. adjust name if env var PROJECT_NAME_PREFIX is set

export class PkgJson

	constructor: (hOptions={}) ->

		{llutils} = getOptions hOptions, {
			llutils: true
			}

		@hJson = slurpJSON('./package.json')
		@mergeKeysFromEnv()
		prefix = process.env.PROJECT_NAME_PREFIX
		if nonEmpty(prefix)
			@setField 'name', "#{prefix}#{@hJson.name}"
		if llutils && !isInstalled('@jdeighan/llutils')
			addDep '@jdeighan/llutils', 'latest'

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

	setField: (name, value) =>

		@hJson[name] = value
		return

	# ..........................................................

	addScript: (name, str) =>

		if ! hasKey(hJson, 'scripts')
			@hJson.scripts = {}
		@hJson.scripts[name] = str
		return

	# ..........................................................

	addExport: (name, str) =>

		if ! hasKey(hJson, 'exports')
			@hJson.exports = {}
		@hJson.exports[name] = str
		return

	# ..........................................................

	addBin: (name, str) =>

		if ! hasKey(hJson, 'bin')
			@hJson.bin = {}
		@hJson.bin[name] = str
		return

	# ..........................................................

	addDep: (pkg, version) =>

		if ! hasKey(hJson, 'dependencies')
			@hJson.dependencies = {}
		if @hJson?.devDependencies.pkg
			delete @hJson.devDependencies.pkg
		@hJson.dependencies[pkg] = version
		return

	# ..........................................................

	addDevDep: (pkg, version) =>

		if ! hasKey(hJson, 'devDependencies')
			@hJson.devDependencies = {}
		if @hJson?.dependencies.pkg
			delete @hJson.dependencies.pkg
		@hJson.devDependencies[pkg] = version
		return

	# ..........................................................

	isInstalled: (hJson, pkg) =>

		return hasKey(hJson.dependencies, pkg) \
				|| hasKey(hJson.devDependencies, pkg)

# ---------------------------------------------------------------------------
