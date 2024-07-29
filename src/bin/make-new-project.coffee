# make-new-project.coffee

# --- Before running, set these environment variables:
#        PROJECT_ROOT_DIR - directory where you add projects
#        PROJECT_PACKAGE_JSON - JSON string or file path
#           - should have 'author' key
#        PROJECT_INSTALLS - comma sep list of pkgs to install
#        PROJECT_DEV_INSTALLS - comma sep list of dev pkgs to install
#        PROJECT_NAME_PREFIX - e.g. '@jdeighan/' to prepend this to proj name
#
#     Usage: mnp <dirname>
#        -c - clear out any existing directory
#        -type=(website|electron|codemirror|parcel)
#        -libs=<comma sep stubs>
#        -bins=<comma sep stubs>
#        -install=<comma sep pkgs>
#        -installdev=<comma sep pkgs>

import {
	undef, defined, notdefined, execCmd, OL, nonEmpty, keys,
	assert, croak, words, hasKey, execAndLogCmd, getOptions,
	} from '@jdeighan/llutils'
import {getArgs} from '@jdeighan/llutils/cmd-args'
import {
	mkpath, isDir, mkDir, slurp, barf, clearDir,
	slurpJSON, barfJSON, touch, createFile,
	} from '@jdeighan/llutils/fs'
import {
	PkgJson,
	} from '@jdeighan/llutils/pkg-json'

console.log "Starting make-new-project"

type = undef
lValidTypes = ['electron', 'codemirror', 'website', 'parcel']
author = 'unknown'

# ---------------------------------------------------------------------------
# --- For example, isType('electron') will return true
#     when type is 'codemirror'

isType = (t) =>
	switch t
		when 'parcel'
			return (type == 'parcel')
		when 'electron'
			return (type == 'electron') || (type == 'codemirror')
		when 'codemirror'
			return (type == 'codemirror')
		when 'website'
			return (type == 'parcel') || (type == 'vite')
		else
			return false

# ---------------------------------------------------------------------------

main = () =>
	{_, c: clear, type, lib, bin, libs, bins, install, installdev
		} = getArgs(undef, {
		_: [1,1]
		c: 'boolean'
		type: 'string'
		lib: 'string'     # comma separated stubs
		bin: 'string'     # comma separated stubs
		libs: 'string'    # comma separated stubs
		bins: 'string'    # comma separated stubs
		install: 'string' # comma separated packages to install
		installdev: 'string' # comma separated packages to dev install
		})

	[dirname] = _
	if notdefined(libs) then libs = lib
	if notdefined(bins) then bins = bin

	if defined(type)
		console.log "type = #{OL(type)}"
		if (type == 'website')
			type = 'parcel'   # --- default website type
		assert lValidTypes.includes(type), "Bad type: #{OL(type)}"

	# .............................................................

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
			process.exit()
	else
		console.log "Creating directory #{newDir}"
		mkDir newDir

	process.chdir newDir

	# === Initialize npm, set up package.json file

	console.log "Initializing npm"
	execCmd "npm init -y"

	# === Create package.json file

	console.log "Creating package.json"
	pj = new PkgJson()
	pj.setField 'description', "A #{type} app"

	if (type == 'electron')
		pj.setField 'main', 'src/main.js'
		pj.addScript 'start', 'npm run build && electron .'
	else if (type == 'parcel')
		pj.addDevDep 'parcel'

		pj.setField 'main', 'src/index.html'
		pj.setField 'source', 'src/index.html'

		pj.addScript 'start', 'parcel'
		pj.addScript 'build', 'parcel build'

	if defined(libs)
		console.log "Creating new libs"
		for name in libs.split(',').map((str) => str.trim())
			createFile "./src/lib/#{name}.coffee", """
				# --- #{name}.coffee
				"""
			if pj.isInstalled('@jdeighan/llutils')
				createFile "./test/#{name}.test.coffee", """
					# --- #{name}.test.offee

					import * as lib from '#{hJson.name}/#{name}'
					Object.assign(global, lib)
					import * as lib2 from '@jdeighan/llutils/utest'
					Object.assign(global, lib2)

					equal 2+2, 4
					"""
			else
				createFile "./test/#{name}.test.coffee", """
					# --- #{name}.test.offee

					import * as lib from '#{hJson.name}/#{name}'
					Object.assign(global, lib)
					import test from 'ava'

					test "line 7", (t) =>
						t.is 2+2, 4

					"""
			pj.addExport "./#{name}", "./src/lib/#{name}.js"
		pj.addExport "./package.json", "./package.json"

	if defined(bins)
		console.log "Creating new bins"
		for name in bins.split(',').map((str) => str.trim())
			touch "./src/bin/#{name}.coffee"
			pj.addBin name, "./src/bin/#{name}.js"

	# === Install libraries specified via env vars

	installs = process.env.PROJECT_INSTALLS
	if nonEmpty(installs)
		for pkg in words(installs)
			pj.addDep pkg

	dev_installs = process.env.PROJECT_DEV_INSTALLS
	if nonEmpty(dev_installs)
		for pkg in words(dev_installs)
			pj.addDevDep pkg

	pj.addDevDep 'ava'

	# === Add libraries specified on command line

	if defined(install)
		console.log "Installing npm libs from cmd line"
		lNames = install.split(',').map((str) => str.trim())
		assert (lNames.length > 0), "No names in 'install'"
		for name in lNames
			pj.addDep name

	if defined(installdev)
		console.log "Installing npm libs for dev from cmd line"
		lNames = installdev.split(',').map((str) => str.trim())
		assert (lNames.length > 0), "No names in 'installdev'"
		for name in lNames
			pj.addDevDep name

	# === Initialize git

	console.log "Initializing git"
	execCmd "git init"
	execCmd "git branch -m main"

	# === Create standard directories

	console.log "Making directories"
	mkDir './src'
	mkDir './src/lib'
	mkDir './src/bin'
	mkDir './src/elements'
	mkDir './test'

	# === Create file README.md

	console.log "Creating README.md"
	barf """
		README.md file
		==============


		""", "./README.md"

	# === Create file .gitignore

	console.log "Creating .gitignore"
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

	# === Create file .npmrc

	console.log "Creating .npmrc"
	barf """
	engine-strict=true
	# --- loglevel can be silent or warn
	loglevel=silent
		""", "./.npmrc"

	if isType('electron')

		console.log "Creating src/main.coffee"
		barf """
		import pathLib from 'node:path'
		import {app, BrowserWindow} from 'electron'

		dir = import.meta.dirname
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
			win.loadURL("file://#{dir}/index.html")
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

		# ..........................................................

	if isType('electron')
		console.log "Installing (dev) \"electron\""
		pj.addDevDep 'electron'

	if isType('website')
		console.log "Creating src/index.html"
		barf """
			<!DOCTYPE html>
			<html lang="en">
				<head>
					<meta charset="utf-8">
					<title>Parcel App</title>
				</head>
				<body>
					<h1>Hello, World!</h1>
				</body>
			</html>
			""", "./src/index.html"


	console.log "DONE"

# ---------------------------------------------------------------------------

main()
