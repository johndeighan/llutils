# make-new-project.coffee

import {
	undef, defined, notdefined, execCmd, OL, nonEmpty,
	assert, croak, words, hasKey, execAndLogCmd,
	} from '@jdeighan/llutils'
import {getArgs} from '@jdeighan/llutils/cmd-args'
import {
	mkpath, isDir, mkDir, slurp, barf, clearDir,
	slurpJSON, barfJSON, touch, createFile,
	} from '@jdeighan/llutils/fs'

console.log "Starting make-new-project"

type = undef
lValidTypes = ['electron', 'codemirror']
author = 'unknown'

# ---------------------------------------------------------------------------
# --- For example, isType('electron') will return true
#     when type is 'codemirror'

isType = (t) =>
	switch t
		when 'electron'
			return (type == 'electron') || (type == 'codemirror')
		when 'codemirror'
			return (type == 'codemirror')
		else
			return false

# ---------------------------------------------------------------------------

{_, c: clear, type, lib, bin, libs, bins, install, installdev
	} = getArgs(undef, {
	_: [1,1]
	c: 'boolean'
	type: 'string'
	lib: 'string'    # comma separated stubs
	bin: 'string'    # comma separated stubs
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
	assert lValidTypes.includes(type), "Bad type: #{OL(type)}"

# .............................................................

rootDir = process.env.PROJECT_ROOT_DIR
if ! isDir(rootDir)
	console.log """
		Please set env var PROJECT_ROOT_DIR to a valid directory
		"""
	process.exit()

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

console.log "Initializing npm"
execCmd "npm init -y"

llutils_installed = false

if defined(install)
	console.log "Installing npm libs"
	lNames = install.split(',').map((str) => str.trim())
	assert (lNames.length > 0), "No names in 'install'"
	for name in lNames
		if (name == 'llutils')
			llutils_installed = true
		execCmd "npm install #{name}"

if defined(installdev)
	console.log "Installing npm libs for development"
	lNames = installdev.split(',').map((str) => str.trim())
	assert (lNames.length > 0), "No names in 'installdev'"
	for name in lNames
		if (name == 'llutils')
			llutils_installed = true
		execCmd "npm install #{name}"

if ! llutils_installed
	execCmd "npm install ava"

console.log "Initializing git"
execCmd "git init"
execCmd "git branch -m main"

console.log "Making directories"
mkDir './src'
mkDir './src/lib'
mkDir './src/bin'
mkDir './test'

console.log "Fixing package.json"
hJson = slurpJSON('./package.json')
pkgJson = process.env.PROJECT_PACKAGE_JSON
if nonEmpty(pkgJson)
	# --- Can be either a JSON string or a file path
	if (pkgJson.indexOf('{') == 0)
		hSetKeys = JSON.parse(pkgJson)
	else
		hSetKeys = JSON.parse(slurp(pkgJson))
	Object.assign hJson, hSetKeys
	prefix = process.env.PROJECT_NAME_PREFIX
	if nonEmpty(prefix)
		hJson.name = "#{prefix}#{hJson.name}"

	hJson.description = "A #{type} app"
	if isType('electron')
		hJson.main = "src/main.js"
		hJson.scripts.start = "npm run build && electron ."

	if defined(libs)
		console.log "Creating libs and 'export' key"
		if ! hasKey(hJson, 'exports')
			hJson.exports = {}
		lNames = libs.split(',').map((str) => str.trim())
		assert (lNames.length > 0), "No names in 'libs'"
		if ! hasKey(hJson.exports, ".")
			hJson.exports["."] = "./src/lib/#{lNames[0]}.js"
		for name in lNames
			createFile "./src/lib/#{name}.coffee", """
				# --- #{name}.coffee
				"""
			if llutils_installed
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
			hJson.exports["./#{name}"] = "./src/lib/#{name}.js"
		hJson.exports["./package.json"] = "./package.json"

	if defined(bins)
		console.log "Creating bins and 'bin' key"
		if ! hasKey(hJson, 'bin')
			hJson.bin = {}
		lNames = bins.split(',').map((str) => str.trim())
		assert (lNames.length > 0), "No names in 'bins'"
		for name in lNames
			touch "./src/bin/#{name}.coffee"
			hJson.bin[name] = "./src/bin/#{name}.js"

barfJSON(hJson, './package.json')

if hasKey(hJson, 'author')
	author = hJson.author

installs = process.env.PROJECT_INSTALLS
if nonEmpty(installs)
	for pkg in words(installs)
		console.log "Installing #{OL(pkg)}"
		execCmd "npm install #{pkg}"

dev_installs = process.env.PROJECT_DEV_INSTALLS
if nonEmpty(dev_installs)
	for pkg in words(dev_installs)
		console.log "Installing (dev) #{OL(pkg)}"
		execCmd "npm install -D #{pkg}"

console.log "Creating README.md"
barf """
	README.md file
	==============


	""", "./README.md"

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

	console.log "Installing (dev) \"electron\""
	execCmd "npm install -D electron"

console.log "DONE"
