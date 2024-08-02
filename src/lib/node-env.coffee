# node-env.coffee

import {
	undef, defined, notdefined, isEmpty, nonEmpty, hasKey,
	assert, croak, OL, getOptions, execCmd,
	} from '@jdeighan/llutils'
import {
	slurpPkgJSON, slurpJSON, barfJSON, barfPkgJSON,
	touch, slurp, barf,
	} from '@jdeighan/llutils/fs'

# ---------------------------------------------------------------------------
# --- 1. Read in current package.json
#     2. If option 'fix':
#        - get keys from env var PROJECT_PACKAGE_JSON
#        - overwrite keys in package.json
#        - adjust name if env var PROJECT_NAME_PREFIX is set

export class NodeEnv

	constructor: (hOptions={}) ->

		{fix} = getOptions hOptions, {
			fix: false
			}
		@hJson = slurpPkgJSON()
		if fix
			@mergeKeysFromEnv()
			prefix = process.env.PROJECT_NAME_PREFIX
			if nonEmpty(prefix) && ! @hJson.name.startsWith(prefix)
				@setField 'name', "#{prefix}#{@hJson.name}"
			@setField 'license', 'MIT'
			@addDependency '@jdeighan/llutils'

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

	getField: (name) ->

		return @hJson[name]

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

	addUserBin: (name) ->

		barf """
			# --- #{name}.coffee


			""", "./src/bin/#{name}.coffee"

		if ! hasKey(@hJson, 'bin')
			@hJson.bin = {}
		@hJson.bin[name] = "./src/bin/#{name}.js"
		console.log "   ADD BIN #{name}"
		return

	# ..........................................................

	addUserLib: (name) ->

		barf """
			# --- #{name}.coffee


			""", "./src/lib/#{name}.coffee"

		# --- Add a unit test
		barf """
			# --- #{name}.test.offee

			import * as lib from '#{pj.name}/#{name}'
			Object.assign(global, lib)
			import * as lib2 from '@jdeighan/llutils/utest'
			Object.assign(global, lib2)

			equal 2+2, 4
			""", "./test/#{name}.test.coffee"

		@addExport "./#{name}", "./src/lib/#{name}.js"

		if ! hasKey(@hJson, 'bin')
			@hJson.bin = {}
		@hJson.bin[name] = "./src/bin/#{name}.js"
		console.log "   ADD BIN #{name}"
		return

	# ..........................................................

	addUserElement: (name) ->

		barf """
			<!-- #{name}.svelte -->
			<svelte:options customElement="#{name}" />
			<p>A new element</p>

			""", "./src/elements/#{name}.svelte"

		@addExport "./#{name}", "./src/elements/#{name}.js"
		console.log "   ADD ELEMENT #{name}"
		return

	# ..........................................................

	hasDep: (pkg) ->

		if hasKey(@hJson, 'dependencies')
			return hasKey(@hJson.dependencies, pkg)
		else
			return false

	# ..........................................................

	hasDevDep: (pkg) ->

		if hasKey(@hJson, 'devDependencies')
			return hasKey(@hJson.devDependencies, pkg)
		else
			return false

	# ..........................................................

	removeDep: (pkg) ->

		if @hasDep(pkg)
			delete @hJson.dependencies[pkg]
		if @hasDevDep(pkg)
			delete @hJson.devDependencies[pkg]
		return

	# ..........................................................

	addDependency: (pkg) ->

		if ! hasKey(@hJson, 'dependencies')
			@hJson.dependencies = {}
		@removeDep pkg
		version = getVersion(pkg)
		@hJson.dependencies[pkg] = version
		console.log "   DEP #{pkg} = #{OL(version)}"
		return

	# ..........................................................

	addDevDependency: (pkg) ->

		if ! hasKey(@hJson, 'devDependencies')
			@hJson.devDependencies = {}
		@removeDep pkg
		version = getVersion(pkg)
		@hJson.devDependencies[pkg] = version
		console.log "   DEV DEP #{pkg} = #{OL(version)}"
		return

	# ..........................................................

	isInstalled: (pkg) ->

		return hasKey(@hJson.dependencies, pkg) \
				|| hasKey(@hJson.devDependencies, pkg)

	# ..........................................................

	write_pkg_json: () ->

		@addExport "./package.json", "./package.json"
		barfPkgJSON @hJson
		return

	# ..........................................................

	addFile: (fileName) ->

		console.log "Creating standard file #{OL(fileName)}"

		switch fileName

			when 'README.md'
				barf """
					README.md file
					==============


					""", "./README.md"

			when '.gitignore'
				barf """
					logs/
					node_modules/
					typings/
					*.tsbuildinfo
					.npmrc
					/build
					/public
					/dist

					# dotenv environment variables file
					.env
					.env.test

					test/temp*.*
					/.svelte-kit
					""", "./.gitignore"

			when '.npmrc'
				barf """
					engine-strict=true
					# --- loglevel can be silent or warn
					loglevel=silent
					""", "./.npmrc"

			else
				croak "addFile #{OL(fileName)} not implemented"
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

