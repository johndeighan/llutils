# proj-utils.coffee

import prompts from 'prompts'

import {
	undef, defined, notdefined, OL, getOptions,
	assert, croak, words, isEmpty, nonEmpty, hasKey
	} from '@jdeighan/llutils'
import {execCmd} from '@jdeighan/llutils/exec-utils'
import {BOX} from '@jdeighan/llutils/dump'
import {
	mkpath, isDir, mkDir, slurp, barf, clearDir,
	slurpJSON, barfJSON, slurpPkgJSON, barfPkgJSON,
	touch, insertLinesAfter,
	} from '@jdeighan/llutils/fs'

lValidTypes = [
	'electron'
	'codemirror'
	'parcel'
	'vite'
	'none'
	]
type = 'none'

# ---------------------------------------------------------------------------

export checkIfInstalled = (...lCmds) =>

	for cmd in lCmds
		try
			output = execCmd "#{cmd} --version"
			return output
		catch err
			console.log "ERROR #{cmd} is not installed"
			process.exit()

# ---------------------------------------------------------------------------

export setProjType = (t) =>

	if (t == 'website')
		type = 'parcel'    # default web site type
	assert defined(t), "type is undef"
	assert lValidTypes.includes(t), "Bad type: #{OL(t)}"
	type = t
	return

# ---------------------------------------------------------------------------
# --- For example, isType('electron') will return true
#     when type is 'codemirror'

export isOfType = (t) =>

	switch t
		when 'electron'
			return (type == 'electron') || (type == 'codemirror')
		when 'website'
			return (type == 'parcel') || (type == 'vite')
		else
			return (type == t)

# ---------------------------------------------------------------------------

export promptForProjType = () =>

	hResponse = await prompts({
		type: 'select'
		name: 'type'
		message: 'Which type of project?'
		choices: [
			{
				title: 'Bare'
				description: 'Bare project'
				value: 'none'
				}
			{
				title: 'parcel'
				description: 'parcel web site'
				value: 'parcel'
				},
			{
				title: 'vite'
				description: 'vite web site'
				value: 'vite'
				},
			{
				title: 'electron'
				description: 'electron app'
				value: 'electron'
				}
			{
				title: 'codemirror'
				description: 'codeMirror editor'
				value: 'codemirror'
				}
			],
		});
	setProjType hResponse.type
	return type

# ---------------------------------------------------------------------------

export makeProjDir = (dirname, hOptions={}) =>

	{clear} = getOptions hOptions, {
		clear: false
		}

	rootDir = process.env.PROJECT_ROOT_DIR
	if ! isDir(rootDir)
		console.log """
			Please set env var PROJECT_ROOT_DIR to a valid directory
			"""
		process.exit()

	# === Create the new directory and cd to it

	newDir = mkpath(rootDir, dirname)
	if isDir(newDir)
		if clear
			console.log "Directory #{OL(newDir)} exists, clearing it out"
			clearDir newDir
		else
			console.log "Directory #{OL(newDir)} already exists"
			console.log "Aborting..."
			process.exit()
	else
		console.log "Creating directory #{newDir}"
		mkDir newDir

	process.chdir newDir
	make_dirs()
	return

# ---------------------------------------------------------------------------

make_dirs = () =>

	console.log "Making directories"
	console.log "   ./src"
	mkDir './src'

	console.log "   ./src/lib"
	mkDir './src/lib'

	console.log "   ./src/bin"
	mkDir './src/bin'

	if isOfType('website')
		console.log "   ./src/elements"
		mkDir './src/elements'

	console.log "   ./test"
	mkDir './test'
	return

# ---------------------------------------------------------------------------
# --- Used in bins addUserBin, addUserLib, addUserElement
# ---------------------------------------------------------------------------
# --- valFunc is a validation function
#        return undef if valid
#        else return error message

export promptForNames = (prompt, valFunc=undef) =>

	lNames = []
	loop
		hResponse = await prompts {
			type: 'text',
			name: 'name',
			message: prompt
			}
		name = hResponse.name
		if name
			if validFunc && (msg = validFunc(name))
				console.log msg
			else
				lNames.push name
		else
			return lNames

# ---------------------------------------------------------------------------

export typeSpecificSetup = (nodeEnv) =>

	if isOfType('website')
		setUpWebSite(nodeEnv)
	if isOfType('parcel')
		setUpParcel(nodeEnv)
	if isOfType('vite')
		setUpVite(nodeEnv)
	if isOfType('electron')
		setUpElectron(nodeEnv)
	if isOfType('codemirror')
		setUpCodeMirror(nodeEnv)
	return

# ---------------------------------------------------------------------------

export setUpWebSite = (node) =>

	console.log "Installing svelte"
	node.addDevDependency 'svelte'

	console.log "Creating src/index.html"
	barf """
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="utf-8">
				<title>Web Site</title>
			</head>
			<body>
				<h1>Hello, World!</h1>
				<script type="module">
					import './index.js';
					// --- Custom Element Imports
				</script>
			</body>
		</html>
		""", "./src/index.html"

	barf """
		# index.coffee

		import {escapeStr} from '@jdeighan/llutils'
		console.log escapeStr("\t\tabc\r\n")
		""", "./src/index.coffee"
	return

# ---------------------------------------------------------------------------

export importCustomElement = (name) =>

	insertLinesAfter(
		"./src/index.coffee",
		/Custom Element Imports/,
		"\t\t\timport ./elements/#{name}.js"
		)
	return

# ---------------------------------------------------------------------------

export setUpParcel = (node) =>

	node.addDevDependency 'parcel'
	node.setField  'source', 'src/index.html'
	node.addScript 'dev',    'concurrently --kill-others "llb -w" "parcel"'
	node.addScript 'build',  'llb && parcel build'
	return

# ---------------------------------------------------------------------------

export setUpVite = (node) =>

	node.addDevDependency 'vite'
	node.addDevDependency 'vite-plugin-top-level-await'
	node.setField  'source', 'src/index.html'
	node.addScript 'dev',    'concurrently --kill-others "llb -w" "vite -c src/vite.config.js src"'
	node.addScript 'build',  'llb && vite build'
	barf """
		import topLevelAwait from "vite-plugin-top-level-await";

		export default {
			build: {
				target: 'esnext'
				},
			plugins: [
				topLevelAwait({
					promiseExportName: "__tla",
					promiseImportName: i => `__tla_${i}`
					})
				]
			}
		""", "./src/vite.config.js"
	return

# ---------------------------------------------------------------------------

export setUpElectron = (node) =>

	node.setField 'main', 'src/main.js'
	node.addScript 'start', 'npm run build && electron .'

	console.log "Installing (dev) \"electron\""
	node.addDevDependency 'electron'

	console.log "Creating src/main.coffee"
	barf """
		import pathLib from 'node:path'
		import {app, BrowserWindow} from 'electron'

		app.on 'ready', () =>
			win = new BrowserWindow({
				width: 800,
				height: 600
				webPreferences: {
					nodeIntegration: true
					preload: pathLib.join(import.meta.dirname, 'preload.js')
					}
				})
			# --- win.loadFile('src/index.html')
			win.loadURL("file://#{import.meta.dirname}/index.html")
			""", "./src/main.coffee"

	# ..........................................................

	console.log "Creating src/index.html"
	barf """
		<!DOCTYPE html>
		<html lang="en">
			<head>
				<meta charset="UTF-8">
				<!-- https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP -->
				<meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self'">
				<title>Electron App</title>
			</head>
			<body>
				<h1>Electron App, using:</h1>
				<p span id="node-version">node-version</p>
				<p span id="chrome-version">chrome-version</p>
				<p span id="electron-version">electron-version</p>
				by <p id="myname">My Name Here</p>
				<script src="./renderer.js"></script>
			</body>
		</html>
		""", "./src/index.html"

	# ..........................................................

	console.log "Creating src/preload.coffee"
	barf """
		# --- preload.coffee has access to window,
		#     document and NodeJS globals

		window.addEventListener 'DOMContentLoaded', () =>
			replaceText = (selector, text) =>
				elem = document.getElementById(selector)
				if (elem)
					elem.innerText = text

			for dep in ['chrome','node','electron']
				str = "\#{dep} version \#{process.versions[dep]}"
				replaceText "\#{dep}-version", str
		""", "./src/preload.coffee"

	# ..........................................................

	console.log "Creating src/renderer.coffee"
	barf """
		# --- preload.coffee has access to window and document

		elem = document.getElementById('myname')
		if elem
			elem.innerText = '#{author}'
		else
			console.log "No element with id 'myname'"
		""", "./src/renderer.coffee"

	return

# ---------------------------------------------------------------------------

export setUpCodeMirror = (node) =>

	return

# ---------------------------------------------------------------------------
# --- 1. Read in current package.json
#     2. If option 'fix':
#        - get keys from env var PROJECT_PACKAGE_JSON
#        - overwrite keys in package.json
#        - adjust name if env var PROJECT_NAME_PREFIX is set

export class NodeEnv

	constructor: (hOptions={}) ->

		{fixPkgJson, echo: @echo} = getOptions hOptions, {
			fixPkgJson: false
			echo: true
			}
		@hJson = slurpPkgJSON()
		if fixPkgJson
			@mergeKeysFromEnv()
			prefix = process.env.PROJECT_NAME_PREFIX
			if nonEmpty(prefix) && ! @hJson.name.startsWith(prefix)
				@setField 'name', "#{prefix}#{@hJson.name}"
			@setField 'license', 'MIT'

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
		if @echo
			console.log "   SET #{name} = #{OL(value)}"
		return

	# ..........................................................

	addScript: (name, str) ->

		if ! hasKey(@hJson, 'scripts')
			@hJson.scripts = {}
		@hJson.scripts[name] = str
		if @echo
			console.log "   ADD SCRIPT #{name} = #{OL(str)}"
		return

	# ..........................................................

	addExport: (name, str) ->

		if ! hasKey(@hJson, 'exports')
			@hJson.exports = {}
		@hJson.exports[name] = str
		if @echo
			console.log "   ADD EXPORT #{name} = #{OL(str)}"
		return

	# ..........................................................

	addUserBin: (name) ->

		barf """
			# --- #{name}.coffee


			""", "./src/bin/#{name}.coffee"

		if ! hasKey(@hJson, 'bin')
			@hJson.bin = {}
		@hJson.bin[name] = "./src/bin/#{name}.js"
		if @echo
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

			import * as lib from './#{name}'
			Object.assign(global, lib)
			import * as lib2 from '@jdeighan/llutils/utest'
			Object.assign(global, lib2)

			equal 2+2, 4
			""", "./test/#{name}.test.coffee"

		@addExport "./#{name}", "./src/lib/#{name}.js"

		if ! hasKey(@hJson, 'bin')
			@hJson.bin = {}
		@hJson.bin[name] = "./src/bin/#{name}.js"
		if @echo
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
		if @echo
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
		if @echo
			console.log "   DEP #{pkg} = #{OL(version)}"
		return

	# ..........................................................

	addDevDependency: (pkg) ->

		if ! hasKey(@hJson, 'devDependencies')
			@hJson.devDependencies = {}
		@removeDep pkg
		version = getVersion(pkg)
		@hJson.devDependencies[pkg] = version
		if @echo
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

	addFile: (fileName, contents=undef) ->

		if @echo
			console.log "CREATE FILE #{OL(fileName)}"

		switch fileName

			when 'README.md'
				barf contents || """
					README.md file
					==============


					""", "./README.md"

			when '.gitignore'
				barf contents || """
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
				barf contents || """
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
		when 'concurrently'
			return "^8.2.2"
		when 'ava'
			return "^6.1.3"
		when 'svelte'
			return "^5.0.0-next.200"
		when 'gulp'
			return "^5.0.0"
		when 'parcel'
			return "^2.12.0"
		when 'vite'
			return "^5.4.0"
		when 'vite-plugin-top-level-await'
			return "^1.4.3"
		else
			return '*'
