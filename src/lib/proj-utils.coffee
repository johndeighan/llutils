# proj-utils.coffee

import prompts from 'prompts'

import {
	undef, defined, notdefined, OL, getOptions,
	assert, execCmd, words,
	} from '@jdeighan/llutils'
import {BOX} from '@jdeighan/llutils/dump'
import {
	mkpath, isDir, mkDir, slurp, barf, clearDir,
	slurpJSON, barfJSON, barfPkgJSON, touch, createFile,
	} from '@jdeighan/llutils/fs'
import {
	PkgJson,
	} from '@jdeighan/llutils/pkg-json'

# --- type 'website' will change to 'parcel' for now
lValidTypes = words('electron codemirror parcel vite none')
type = undef
pj = undef     # PkgJson object
lDeps = []
lDevDeps = []

# ---------------------------------------------------------------------------

export isDep = (pkg) =>

	return lDeps.includes(pkg) || lDevDeps.includes(pkg)

# ---------------------------------------------------------------------------

export setProjType = (t) =>

	if (t == 'vite')
		console.log "Type 'vite' not implemented yet"
		process.exit()
	assert defined(t), "type is undef"
	type = t
	assert lValidTypes.includes(type), "Bad type: #{OL(type)}"
	return

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

export promptForLibs = () =>

	loop
		hResponse = await prompts {
			type: 'text',
			name: 'name',
			message: 'New library name (Enter to end)'
			}
		if hResponse.name
			addLib hResponse.name
		else
			return

# ---------------------------------------------------------------------------

export promptForBins = () =>

	loop
		hResponse = await prompts {
			type: 'text',
			name: 'name',
			message: 'New binary name (Enter to end)'
			}
		if hResponse.name
			addBin hResponse.name
		else
			return

# ---------------------------------------------------------------------------
# --- For example, isType('electron') will return true
#     when type is 'codemirror'

export isOfType = (t) =>

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
	return

# ---------------------------------------------------------------------------

export init_git = () =>

	console.log "Initializing git"
	execCmd "git init"
	execCmd "git branch -m main"
	return

# ---------------------------------------------------------------------------

export make_dirs = () =>

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
# --- Returns PkgJson object

export init_npm = () =>

	console.log "Initializing npm"
	execCmd "npm init -y"

	console.log "Creating package.json"
	pj = new PkgJson('fix')
	pj.setField 'description', "A #{type} app"
	return pj

# ---------------------------------------------------------------------------
# --- Returns PkgJson object

export read_pkg_json = () =>

	console.log "Reading package.json"
	pj = new PkgJson()
	return pj

# ---------------------------------------------------------------------------

export addLib = (name) =>

	createFile "./src/lib/#{name}.coffee", """
		# --- #{name}.coffee
		"""

	# --- Add a unit test
	if pj.isInstalled('@jdeighan/llutils')
		createFile "./test/#{name}.test.coffee", """
			# --- #{name}.test.offee

			import * as lib from '#{pj.name}/#{name}'
			Object.assign(global, lib)
			import * as lib2 from '@jdeighan/llutils/utest'
			Object.assign(global, lib2)

			equal 2+2, 4
			"""
	else
		createFile "./test/#{name}.test.coffee", """
			# --- #{name}.test.offee

			import * as lib from '#{pj.name}/#{name}'
			Object.assign(global, lib)
			import test from 'ava'

			test "line 7", (t) =>
				t.is 2+2, 4

			"""
	pj.addExport "./#{name}", "./src/lib/#{name}.js"
	return

# ---------------------------------------------------------------------------

export addBin = (name) =>

	createFile "./src/bin/#{name}.coffee", """
		# --- #{name}.coffee
		"""

	pj.addBin name, "./src/bin/#{name}.js"
	return

# ---------------------------------------------------------------------------

export addDep = (pkg) =>

	assert !isDep(pkg), "Package #{pkg} already installed"
	pj.addDep pkg
	lDeps.push pkg
	return

# ---------------------------------------------------------------------------

export addDevDep = (pkg) =>

	assert !isDep(pkg), "Package #{pkg} already installed"
	pj.addDevDep pkg
	lDevDeps.push pkg
	return

# ---------------------------------------------------------------------------

export addReadMe = () =>

	console.log "Creating README.md"
	barf """
		README.md file
		==============


		""", "./README.md"
	return

# ---------------------------------------------------------------------------

export addGitIgnore = () =>

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

	return

# ---------------------------------------------------------------------------

export addNpmRc = () =>

	console.log "Creating .npmrc"
	barf """
		engine-strict=true
		# --- loglevel can be silent or warn
		loglevel=silent
		""", "./.npmrc"
	return

# ---------------------------------------------------------------------------

export setUpWebSite = (pj) =>

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
	return

# ---------------------------------------------------------------------------

export setUpParcel = () =>

	pj.addDevDep 'parcel'
	pj.setField 'source', 'src/index.html'
	pj.addScript 'start', 'parcel'
	pj.addScript 'build', 'parcel build'
	return

# ---------------------------------------------------------------------------

export setUpElectron = () =>

	pj.setField 'main', 'src/main.js'
	pj.addScript 'start', 'npm run build && electron .'

	console.log "Installing (dev) \"electron\""
	pj.addDevDep 'electron'

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

export setUpCodeMirror = () =>

	return

# ---------------------------------------------------------------------------

export typeSpecificSetup = () =>

	if isOfType('website')
		setUpWebSite()
	if isOfType('parcel')
		setUpParcel()
	if isOfType('electron')
		setUpElectron()
	if isOfType('codemirror')
		setUpCodeMirror()
	return

# ---------------------------------------------------------------------------

export write_pkg_json = () =>

	console.log "Writing package.json"
	pj.addExport "./package.json", "./package.json"
	pj.write()
	return
