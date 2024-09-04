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
	touch, insertLinesAfter, fileExt,
	} from '@jdeighan/llutils/fs'

export lValidTypes = [
	'electron'
	'codemirror'
	'elm'
	'parcel'
	'vite'
	'none'
	]
type = 'none'
subtype = undef

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

export setProjType = (t, subt) =>

	if (t == 'website')
		type = 'parcel'    # default web site type
	assert defined(t), "type is undef"
	assert lValidTypes.includes(t), "Bad type: #{OL(t)}"
	type = t
	subtype = if nonEmpty(subt) then subt else undef
	return

# ---------------------------------------------------------------------------
# --- For example, isType('electron') will return true
#     when type is 'codemirror'

export isOfType = (t) =>

	switch t
		when 'electron'
			lMembers = ['electron','codemirror']
		when 'website'
			lMembers = ['parcel','vite']
		else
			lMembers = [t]
	return lMembers.includes(type)

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
	if isOfType('elm')
		setUpElm(nodeEnv)
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

setUpWebSite = (nodeEnv) =>

	nodeEnv.addDevDependency 'svelte'

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
					import './main.js';
					// --- Custom Element Imports
				</script>
			</body>
		</html>
		""", "./src/index.html"

	barf """
		# --- main.coffee

		import {escapeStr} from '@jdeighan/llutils'
		console.log escapeStr("\t\tabc\r\n")
		""", "./src/main.coffee"
	return

# ---------------------------------------------------------------------------

export importCustomElement = (name) =>

	insertLinesAfter(
		"./src/main.coffee",
		/Custom Element Imports/,
		"\t\t\timport ./elements/#{name}.js"
		)
	return

# ---------------------------------------------------------------------------

setUpElm = (nodeEnv) =>

	checkIfInstalled 'elm'

	console.log "setUpElm(): subtype = #{OL(subtype)}"

	nodeEnv.addDevDependency 'svelte'
	nodeEnv.addDevDependency 'elm-live'

	nodeEnv.addScript 'build',  "npm run build:coffee && elm make src/Main.elm --output=main.js"
	nodeEnv.addScript 'dev',    "elm-live src/Main.elm -- --debug --output=main.js"

	nodeEnv.addFile "./elm.json", """
		{
			"type": "application",
			"source-directories": [
				"src"
			],
			"elm-version": "0.19.1",
			"dependencies": {
					"direct": {
						"elm/browser": "1.0.2",
						"elm/core": "1.0.5",
						"elm/html": "1.0.0",
						"elm/http": "2.0.0",
						"elm/json": "1.1.3",
						"elm/svg": "1.0.1",
						"elm/url": "1.0.0",
						"krisajenkins/remotedata": "6.0.1",
						"mdgriffith/elm-ui": "1.1.8"
					},
					"indirect": {
						"elm/bytes": "1.0.8",
						"elm/file": "1.0.5",
						"elm/time": "1.0.0",
						"elm/url": "1.0.0",
						"elm/virtual-dom": "1.0.3"
					}
				},
			"test-dependencies": {
				"direct": {},
				"indirect": {}
			}
		}
			""".replaceAll("\t", "   ")

	nodeEnv.addFile "./index.html",  """
		<!DOCTYPE html>
		<html lang="en">
		<head>
			<meta charset="utf-8">
			<meta http-equiv="X-UA-Compatible" content="IE=edge">
			<meta name="viewport" content="width=device-width">
			<title>Elm Web Site</title>
			<script src="main.js"></script>
		</head>

		<body>
			<main></main>
			<script>
				Elm.Main.init({
					node: document.querySelector('main')
					});
			</script>
		</body>
		</html>
		"""

	if (subtype == 'dog')
		console.log "Creating elm site 'dog'"
		nodeEnv.addFile "./src/Main.elm", """
			module Main exposing (main)

			import Browser
			import Element exposing(
				layoutWith, text, paragraph, column, image,
				width, fill, rgb255, padding, paddingXY,
				maximum, centerX
				)
			import Element.Font exposing(bold)
			import Element.Background

			fontColor = Element.Font.color
			fontSize = Element.Font.size
			bkgColor = Element.Background.color

			color = {
				blue = rgb255 100 100 200,
				lightGray = rgb255 180 180 180
				}

			main = Browser.sandbox {
				init = 0,
				view = vLayout,
				update = update
				}

			update msg model = model

			vLayout model = layoutWith {
				options = []
				}
				[
					bkgColor color.lightGray,
					padding 22
					]
				( column [] [
					vTitle,
					vSubtitle,
					vDog
					])

			vTitle = paragraph
				[
					bold,
					fontColor color.blue,
					fontSize 48,
					paddingXY 0 20
					]
				[text "My Awesome Dog"]

			vSubtitle = paragraph [padding 5] [
				text "A web page for my dog"
				]

			vDog = image
				[
					width (maximum 300 fill),
					centerX
					]
				{
					src = "dog.jpg",
					description = "a picture of my dog"
					}
			"""
	else if (subtype == 'json')
		console.log "Creating elm site 'json'"
		nodeEnv.addFile "./src/Main.elm", """
			module Main exposing (..)

			import Browser exposing(element)
			import Html exposing(text)
			import Http
			import Json.Decode
			import RemoteData exposing (RemoteData)


			main : Program () Model Msg
			main =
				element
					{ init = initModel
					, view = view
					, update = update
					, subscriptions = subscriptions
					}


			initModel : () -> ( Model, Cmd Msg )
			initModel _ =
				( { result = RemoteData.NotAsked }, getTitle )


			view : Model -> Html.Html msg
			view model =
				case model.result of
					RemoteData.Failure error ->
						text (getErrorMessage error)

					RemoteData.Success title ->
						text title

					RemoteData.Loading ->
						text "Loading ..."

					RemoteData.NotAsked ->
						text "Where everything starts"


			update : Msg -> Model -> ( Model, Cmd Msg )
			update msg model =
				case msg of
					MsgGotTitle result ->
						( { model | result = result }, Cmd.none )


			getErrorMessage errorDetail =
				case errorDetail of
					Http.NetworkError ->
						"Connection error"

					Http.BadStatus errorStatus ->
						"Invalid server response " ++ String.fromInt errorStatus

					Http.Timeout ->
						"Request time out"

					Http.BadUrl reasonError ->
						"Invalid request URL " ++ reasonError

					Http.BadBody invalidData ->
						"Invalid data " ++ invalidData


			subscriptions : Model -> Sub msg
			subscriptions _ =
				Sub.none


			type alias Model =
				{ result : RemoteData Http.Error String
				}


			type Msg
				= MsgGotTitle (RemoteData Http.Error String)


			getTitle : Cmd Msg
			getTitle =
				Http.get
					{ url = "https://jsonplaceholder.typicode.com/posts/2"
					, expect = Http.expectJson upgradeToRemoteData dataTitleDecoder
					}


			upgradeToRemoteData result =
				MsgGotTitle (RemoteData.fromResult result)


			dataTitleDecoder : Json.Decode.Decoder String
			dataTitleDecoder =
				Json.Decode.field "title" Json.Decode.string
		"""
	else
		console.log "Creating bare elm site"
		nodeEnv.addFile "./src/Main.elm", """
			module Main exposing (main)

			import Browser exposing(sandbox)
			import Html exposing(Html)
			import Element exposing(..)

			main = sandbox {
				 init = {
					  title = "Hello"
					  },
				view = \\model -> layout [] (text model.title),
				update = \\msg -> \\model -> model
				}

			"""
	return

# ---------------------------------------------------------------------------

setUpParcel = (nodeEnv) =>

	nodeEnv.addDevDependency 'parcel'
	nodeEnv.setField  'source', 'src/index.html'
	nodeEnv.addScript 'dev',    'concurrently --kill-others "llb -w" "parcel"'
	nodeEnv.addScript 'build',  'llb && parcel build'
	return

# ---------------------------------------------------------------------------

setUpVite = (nodeEnv) =>

	nodeEnv.addDevDependency 'vite'
	nodeEnv.addDevDependency 'vite-plugin-top-level-await'
	nodeEnv.setField  'source', 'src/index.html'
	nodeEnv.addScript 'dev',    'concurrently --kill-others "llb -w" "vite -c src/vite.config.js src"'
	nodeEnv.addScript 'build',  'llb && vite build'
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

setUpElectron = (nodeEnv) =>

	nodeEnv.setField 'main', 'src/main.js'
	nodeEnv.addScript 'start', 'npm run build && electron .'

	console.log "Installing (dev) \"electron\""
	nodeEnv.addDevDependency 'electron'

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

setUpCodeMirror = (nodeEnv) =>

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
			console.log "ADD FILE #{OL(fileName)}"

		if defined(contents)
			if (fileExt(fileName) == '.elm')
				contents = contents.replaceAll("\t", "   ")
			barf contents, fileName
			return

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
		when 'elm-live'
			return "^4.0.2"
		when 'vite-plugin-top-level-await'
			return "^1.4.3"
		else
			return '*'
