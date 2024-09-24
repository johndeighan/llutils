// proj-utils.coffee
var getVersion, hSetUpFuncs, make_dirs, setUpCodeMirror, setUpElectron, setUpElm, setUpParcel, setUpVite, setUpWebSite;

import prompts from 'prompts';

import {
  undef,
  defined,
  notdefined,
  OL,
  LOG,
  getOptions,
  assert,
  croak,
  words,
  isEmpty,
  nonEmpty,
  hasKey,
  LOG_indent,
  LOG_undent,
  isArray
} from '@jdeighan/llutils';

import {
  execCmd,
  execCmdY
} from '@jdeighan/llutils/exec-utils';

import {
  BOX
} from '@jdeighan/llutils/dump';

import {
  mkpath,
  isDir,
  mkDir,
  slurp,
  barf,
  clearDir,
  slurpJSON,
  barfJSON,
  slurpPkgJSON,
  barfPkgJSON,
  touch,
  insertLinesAfter,
  fileExt
} from '@jdeighan/llutils/fs';

export var lValidTypes = ['electron', 'codemirror', 'elm', 'parcel', 'vite', 'none'];

// ---------------------------------------------------------------------------
export var checkIfInstalled = (...lCmds) => {
  var cmd, err, i, len, output;
  for (i = 0, len = lCmds.length; i < len; i++) {
    cmd = lCmds[i];
    try {
      output = execCmd(`${cmd} --version`);
      return output;
    } catch (error) {
      err = error;
      LOG(`ERROR: ${cmd} is not installed`);
      process.exit();
    }
  }
};

// ---------------------------------------------------------------------------
export var promptForProjType = async() => {
  var hResponse;
  hResponse = (await prompts({
    type: 'select',
    name: 'type',
    message: 'Which type of project?',
    choices: [
      {
        title: 'Bare',
        description: 'Bare project',
        value: 'none'
      },
      {
        title: 'parcel',
        description: 'parcel web site',
        value: 'parcel'
      },
      {
        title: 'vite',
        description: 'vite web site',
        value: 'vite'
      },
      {
        title: 'electron',
        description: 'electron app',
        value: 'electron'
      },
      {
        title: 'codemirror',
        description: 'codeMirror editor',
        value: 'codemirror'
      }
    ]
  }));
  return type;
};

// ---------------------------------------------------------------------------
export var makeProjDir = (dirname, hOptions = {}) => {
  var clear, newDir, rootDir;
  ({clear} = getOptions(hOptions, {
    clear: false
  }));
  rootDir = process.env.PROJECT_ROOT_DIR;
  if (!isDir(rootDir)) {
    LOG(`Please set env var PROJECT_ROOT_DIR to a valid directory`);
    process.exit();
  }
  // === Create the new directory and cd to it
  newDir = mkpath(rootDir, dirname);
  if (isDir(newDir)) {
    if (clear) {
      LOG(`Directory ${OL(newDir)} exists, clearing it out`);
      clearDir(newDir);
    } else {
      LOG(`Directory ${OL(newDir)} already exists`);
      LOG("Aborting...");
      process.exit();
    }
  } else {
    LOG(`Creating directory ${newDir}`);
    mkDir(newDir);
  }
  process.chdir(newDir);
  make_dirs();
};

// ---------------------------------------------------------------------------
make_dirs = () => {
  LOG("Making directories");
  LOG("   ./src");
  mkDir('./src');
  LOG("   ./src/lib");
  mkDir('./src/lib');
  LOG("   ./src/bin");
  mkDir('./src/bin');
  LOG("   ./test");
  mkDir('./test');
};

// ---------------------------------------------------------------------------
// --- Used in bins addUserBin, addUserLib, addUserElement
// ---------------------------------------------------------------------------
// --- valFunc is a validation function
//        return undef if valid
//        else return error message
export var promptForNames = async(prompt, valFunc = undef) => {
  var hResponse, lNames, msg, name;
  lNames = [];
  while (true) {
    hResponse = (await prompts({
      type: 'text',
      name: 'name',
      message: prompt
    }));
    name = hResponse.name;
    if (name) {
      if (validFunc && (msg = validFunc(name))) {
        LOG(msg);
      } else {
        lNames.push(name);
      }
    } else {
      return lNames;
    }
  }
};

// ---------------------------------------------------------------------------
export var basicSetUp = (dirname, hOptions = {}) => {
  var clear, env_dev_installs, env_installs, i, j, len, len1, nodeEnv, pkg, ref, ref1, subtype, type;
  ({clear, type, subtype} = getOptions(hOptions, {
    clear: false,
    type: undef,
    subtype: undef
  }));
  makeProjDir(dirname, {clear}); // also cd's to proj dir
  execCmd("git init");
  execCmd("git branch -m main");
  execCmd("npm init -y");
  nodeEnv = new NodeEnv('fixPkgJson');
  nodeEnv.addDependency('@jdeighan/llutils');
  nodeEnv.addDevDependency('concurrently');
  nodeEnv.setField('description', `A ${type} app`);
  nodeEnv.setField('packageManager', 'yarn@1.22.22');
  nodeEnv.addFile('README.md');
  nodeEnv.addFile('.gitignore');
  nodeEnv.addFile('.npmrc');
  // === Install libraries specified via env vars
  env_installs = process.env.PROJECT_INSTALLS;
  if (nonEmpty(env_installs)) {
    ref = words(env_installs);
    for (i = 0, len = ref.length; i < len; i++) {
      pkg = ref[i];
      nodeEnv.addDependency(pkg);
    }
  }
  env_dev_installs = process.env.PROJECT_DEV_INSTALLS;
  if (nonEmpty(env_dev_installs)) {
    ref1 = words(env_dev_installs);
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      pkg = ref1[j];
      nodeEnv.addDevDependency(pkg);
    }
  }
  nodeEnv.addDevDependency('coffeescript');
  nodeEnv.addDevDependency('ava');
  return nodeEnv;
};

// ---------------------------------------------------------------------------
setUpWebSite = (nodeEnv, subtype = undef) => {
  LOG("mkdir ./src/elements");
  mkDir('./src/elements');
  nodeEnv.addDevDependency('svelte');
  LOG("Creating src/index.html");
  barf(`<!DOCTYPE html>
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
</html>`, "./src/index.html");
  barf(`# --- main.coffee

import {escapeStr} from '@jdeighan/llutils'
LOG escapeStr("\t\tabc\r\n")`, "./src/main.coffee");
};

// ---------------------------------------------------------------------------
export var importCustomElement = (name) => {
  insertLinesAfter("./src/main.coffee", /Custom Element Imports/, `\t\t\timport ./elements/${name}.js`);
};

// ---------------------------------------------------------------------------
setUpElm = (nodeEnv, subtype = undef) => {
  var i, len, lib, ref;
  checkIfInstalled('elm');
  checkIfInstalled('elm-live');
  LOG("mkdir ./src/elements");
  mkDir('./src/elements');
  nodeEnv.addDevDependency('svelte');
  nodeEnv.addScript('build', "npm run build:all && elm make src/Main.elm --output=main.js");
  nodeEnv.addScript('dev', "npm run build:all && elm-live src/Main.elm -- --debug --output=main.js");
  LOG("initializing elm");
  execCmdY("elm init");
  LOG("elm is initialized");
  ref = ["elm/http", "elm/json", "elm/regex", "mdgriffith/elm-ui"];
  for (i = 0, len = ref.length; i < len; i++) {
    lib = ref[i];
    LOG(`installing elm lib ${lib}`);
    execCmdY(`elm install ${lib}`);
  }
  nodeEnv.addFile("src/global.css", `/* Put your global styles here */`);
  nodeEnv.addFile("./index.html", `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<meta http-equiv="X-UA-Compatible" content="IE=edge">
	<meta name="viewport" content="width=device-width">
	<title>Elm Web Site</title>
	<link rel="stylesheet" href="src/global.css">
	<script src="main.js"></script>
</head>

<body>
	<main></main>
	<script>
		Elm.Main.init({
			node: document.querySelector('main'),
			flags: {
				width: window.innerWidth,
				height: window.innerHeight
				}
			});
	</script>
</body>
</html>`);
  if (subtype === 'json') {
    LOG("installing elm lib krisajenkins/remotedata");
    execCmdY("elm install /krisajenkins/remotedata");
    LOG("Creating elm site 'json'");
    nodeEnv.addFile("./src/Main.elm", `module Main exposing (..)

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
	Json.Decode.field "title" Json.Decode.string`);
  } else {
    LOG("Creating bare elm site");
    nodeEnv.addFile("./src/Main.elm", `module Main exposing(main)

import Browser exposing(element)
import Browser.Events exposing(..)
import Html exposing(Html)
import Element exposing(..)
import Utils exposing(..)

--------------------------------------

type alias Model = {
	width: Int,
	height: Int,
	deviceKind: String,
	title: String
	}

type Msg =
	  WindowResized Int Int

--------------------------------------

main : Program Flags Model Msg
main =
	element {
		init = init,
		view = vMain,
		update = updateFunc,
		subscriptions = subscriptions
		}

--------------------------------------

vMain: Model -> Html Msg
vMain model = layout
	[]
	(row
		[centerX, spacing 25]
		[
			(el
				[centerX, fontSize 32]
				(text model.title)
				),
			(vDevice model)
			]
		)

vDevice: Model -> Element Msg
vDevice model =
	( el
		[fontSize 18]
		(txtDevice model)
		)

txtDevice: Model -> Element msg
txtDevice model =
	(text ("(device: " ++ model.deviceKind ++ ")" ) )

--------------------------------------

init: Flags -> (Model, Cmd arg)
init f =
	(
		{
			width = f.width,
			height = f.height,
			deviceKind = deviceKind f.width f.height,
			title = "Hello there"
			},
		Cmd.none
		)

--------------------------------------

updateFunc : Msg -> Model -> (Model, Cmd arg)
updateFunc msg model =
	case msg of
		WindowResized w h ->
			(
				{model |
					width = w,
					height = h,
					deviceKind = deviceKind w h
					},
				Cmd.none
				)

--------------------------------------

subscriptions: Model -> (Sub Msg)
subscriptions model =
	onResize WindowResized`);
    nodeEnv.addFile("./src/Utils.elm", `module Utils exposing(..)

import Element exposing(..)
import Html.Attributes
import Element.Font as Font

id: String -> Attribute msg
id theID = htmlAttribute (Html.Attributes.id theID)

class: String -> Attribute msg
class theClass = htmlAttribute (Html.Attributes.class theClass)

fontSize: Int -> Attribute msg
fontSize = Font.size

------------------------------

type alias Flags = {
	height: Int,
	width: Int
	}

------------------------------

deviceKind: Int -> Int -> String
deviceKind width height =
	if (width > 2000) then
		"big desktop"
	else if (width > 1200) then
		"desktop"
	else if (width > 700) then
		"tablet"
	else
		"cell phone"`);
  }
};

// ---------------------------------------------------------------------------
setUpParcel = (nodeEnv, subtype = undef) => {
  nodeEnv.addDevDependency('parcel');
  nodeEnv.setField('source', 'src/index.html');
  nodeEnv.addScript('dev', 'concurrently --kill-others "llb -w" "parcel"');
  nodeEnv.addScript('build', 'llb && parcel build');
};

// ---------------------------------------------------------------------------
setUpVite = (nodeEnv, subtype = undef) => {
  nodeEnv.addDevDependency('vite');
  nodeEnv.addDevDependency('vite-plugin-top-level-await');
  nodeEnv.setField('source', 'src/index.html');
  nodeEnv.addScript('dev', 'concurrently --kill-others "llb -w" "vite -c src/vite.config.js src"');
  nodeEnv.addScript('build', 'llb && vite build');
  barf(`import topLevelAwait from "vite-plugin-top-level-await";

export default {
	build: {
		target: 'esnext'
		},
	plugins: [
		topLevelAwait({
			promiseExportName: "__tla",
			promiseImportName: i => \`__tla_\${i}\`
			})
		]
	}`, "./src/vite.config.js");
};

// ---------------------------------------------------------------------------
setUpElectron = (nodeEnv, subtype = undef) => {
  nodeEnv.setField('main', 'src/main.js');
  nodeEnv.addScript('start', 'npm run build && electron .');
  LOG("Installing (dev) \"electron\"");
  nodeEnv.addDevDependency('electron');
  LOG("Creating src/main.coffee");
  barf(`import pathLib from 'node:path'
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
	win.loadURL("file://${import.meta.dirname}/index.html")`, "./src/main.coffee");
  // ..........................................................
  LOG("Creating src/index.html");
  barf(`<!DOCTYPE html>
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
</html>`, "./src/index.html");
  // ..........................................................
  LOG("Creating src/preload.coffee");
  barf(`# --- preload.coffee has access to window,
#     document and NodeJS globals

window.addEventListener 'DOMContentLoaded', () =>
	replaceText = (selector, text) =>
		elem = document.getElementById(selector)
		if (elem)
			elem.innerText = text

	for dep in ['chrome','node','electron']
		str = "\#{dep} version \#{process.versions[dep]}"
		replaceText "\#{dep}-version", str`, "./src/preload.coffee");
  // ..........................................................
  LOG("Creating src/renderer.coffee");
  barf(`# --- preload.coffee has access to window and document

elem = document.getElementById('myname')
if elem
	elem.innerText = '${author}'
else
	LOG "No element with id 'myname'"`, "./src/renderer.coffee");
};

// ---------------------------------------------------------------------------
setUpCodeMirror = (nodeEnv, subtype = undef) => {};

// ---------------------------------------------------------------------------
// --- 1. Read in current package.json
//     2. If option 'fix':
//        - get keys from env var PROJECT_PACKAGE_JSON
//        - overwrite keys in package.json
//        - adjust name if env var PROJECT_NAME_PREFIX is set
export var NodeEnv = class NodeEnv {
  constructor(hOptions = {}) {
    var fixPkgJson, prefix;
    ({
      fixPkgJson,
      echo: this.echo
    } = getOptions(hOptions, {
      fixPkgJson: false,
      echo: true
    }));
    this.hJson = slurpPkgJSON();
    if (fixPkgJson) {
      this.mergeKeysFromEnv();
      prefix = process.env.PROJECT_NAME_PREFIX;
      if (nonEmpty(prefix) && !this.hJson.name.startsWith(prefix)) {
        this.setField('name', `${prefix}${this.hJson.name}`);
      }
      this.setField('license', 'MIT');
    }
  }

  // ..........................................................
  mergeKeysFromEnv() {
    var hSetKeys, pkgJson;
    pkgJson = process.env.PROJECT_PACKAGE_JSON;
    if (nonEmpty(pkgJson)) {
      // --- Can be either a JSON string or a file path
      if (pkgJson.indexOf('{') === 0) {
        hSetKeys = JSON.parse(pkgJson);
      } else {
        hSetKeys = slurpJSON(pkgJson);
      }
      Object.assign(this.hJson, hSetKeys);
    }
  }

  // ..........................................................
  name() {
    return this.hJson.name;
  }

  // ..........................................................
  getField(name) {
    return this.hJson[name];
  }

  // ..........................................................
  setField(name, value) {
    this.hJson[name] = value;
    if (this.echo) {
      LOG(`   SET ${name} = ${OL(value)}`);
    }
  }

  // ..........................................................
  addScript(name, str) {
    if (!hasKey(this.hJson, 'scripts')) {
      this.hJson.scripts = {};
    }
    this.hJson.scripts[name] = str;
    if (this.echo) {
      LOG(`   ADD SCRIPT ${OL(name)}`);
    }
  }

  // ..........................................................
  addExport(name, str) {
    if (!hasKey(this.hJson, 'exports')) {
      this.hJson.exports = {};
    }
    this.hJson.exports[name] = str;
    if (this.echo) {
      LOG(`   ADD EXPORT ${OL(name)}`);
    }
  }

  // ..........................................................
  addUserBin(name) {
    barf(`# --- ${name}.coffee

`, `./src/bin/${name}.coffee`);
    if (!hasKey(this.hJson, 'bin')) {
      this.hJson.bin = {};
    }
    this.hJson.bin[name] = `./src/bin/${name}.js`;
    if (this.echo) {
      LOG(`   ADD BIN ${OL(name)}`);
    }
  }

  // ..........................................................
  addUserLib(name) {
    barf(`# --- ${name}.coffee

`, `./src/lib/${name}.coffee`);
    // --- Add a unit test
    barf(`# --- ${name}.test.offee

import * as lib from './${name}'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

equal 2+2, 4`, `./test/${name}.test.coffee`);
    this.addExport(`./${name}`, `./src/lib/${name}.js`);
    if (!hasKey(this.hJson, 'bin')) {
      this.hJson.bin = {};
    }
    this.hJson.bin[name] = `./src/bin/${name}.js`;
    if (this.echo) {
      LOG(`   ADD BIN ${name}`);
    }
  }

  // ..........................................................
  addUserElement(name) {
    barf(`<!-- ${name}.svelte -->
<svelte:options customElement="${name}" />
<p>A new element</p>
`, `./src/elements/${name}.svelte`);
    this.addExport(`./${name}`, `./src/elements/${name}.js`);
    if (this.echo) {
      LOG(`   ADD ELEMENT ${name}`);
    }
  }

  // ..........................................................
  hasDep(pkg) {
    if (hasKey(this.hJson, 'dependencies')) {
      return hasKey(this.hJson.dependencies, pkg);
    } else {
      return false;
    }
  }

  // ..........................................................
  hasDevDep(pkg) {
    if (hasKey(this.hJson, 'devDependencies')) {
      return hasKey(this.hJson.devDependencies, pkg);
    } else {
      return false;
    }
  }

  // ..........................................................
  removeDep(pkg) {
    if (this.hasDep(pkg)) {
      delete this.hJson.dependencies[pkg];
    }
    if (this.hasDevDep(pkg)) {
      delete this.hJson.devDependencies[pkg];
    }
  }

  // ..........................................................
  addDependency(pkg) {
    var version;
    if (!hasKey(this.hJson, 'dependencies')) {
      this.hJson.dependencies = {};
    }
    this.removeDep(pkg);
    version = getVersion(pkg);
    this.hJson.dependencies[pkg] = version;
    if (this.echo) {
      LOG(`   DEP ${pkg} = ${OL(version)}`);
    }
  }

  // ..........................................................
  addDevDependency(pkg) {
    var version;
    if (!hasKey(this.hJson, 'devDependencies')) {
      this.hJson.devDependencies = {};
    }
    this.removeDep(pkg);
    version = getVersion(pkg);
    this.hJson.devDependencies[pkg] = version;
    if (this.echo) {
      LOG(`   DEV DEP ${pkg} = ${OL(version)}`);
    }
  }

  // ..........................................................
  isInstalled(pkg) {
    return hasKey(this.hJson.dependencies, pkg) || hasKey(this.hJson.devDependencies, pkg);
  }

  // ..........................................................
  write_pkg_json() {
    this.addExport("./package.json", "./package.json");
    barfPkgJSON(this.hJson);
  }

  // ..........................................................
  addFile(fileName, contents = undef) {
    if (this.echo) {
      LOG(`ADD FILE ${OL(fileName)}`);
    }
    if (defined(contents)) {
      if (fileExt(fileName) === '.elm') {
        contents = contents.replaceAll("\t", "   ");
      }
      barf(contents, fileName);
      return;
    }
    switch (fileName) {
      case 'README.md':
        barf(contents || `README.md file
==============

`, "./README.md");
        break;
      case '.gitignore':
        barf(contents || `logs/
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
/.svelte-kit`, "./.gitignore");
        break;
      case '.npmrc':
        barf(contents || `engine-strict=true
# --- loglevel can be silent or warn
loglevel=silent`, "./.npmrc");
        break;
      default:
        croak(`addFile ${OL(fileName)} not implemented`);
    }
  }

};

// ---------------------------------------------------------------------------
hSetUpFuncs = {
  website: [setUpWebSite],
  elm: [setUpElm],
  parcel: [setUpWebSite, setUpParcel],
  vite: [setUpWebSite, setUpVite],
  electron: [setUpElectron],
  codemirror: [setUpElectron, setUpCodeMirror]
};

export var typeSpecificSetup = (nodeEnv, type, subtype = undef) => {
  var func, i, lFuncs, len;
  lFuncs = hSetUpFuncs[type];
  if (isArray(lFuncs)) {
    for (i = 0, len = lFuncs.length; i < len; i++) {
      func = lFuncs[i];
      LOG(`SET UP ${OL(type)}`);
      LOG_indent();
      func(nodeEnv, subtype);
      LOG_undent();
    }
  }
};

// ---------------------------------------------------------------------------
getVersion = (pkg) => {
  switch (pkg) {
    case 'coffeescript':
      return "^2.7.0";
    case 'concurrently':
      return "^8.2.2";
    case 'ava':
      return "^6.1.3";
    case 'svelte':
      return "^5.0.0-next.200";
    case 'gulp':
      return "^5.0.0";
    case 'parcel':
      return "^2.12.0";
    case 'vite':
      return "^5.4.0";
    case 'elm-live':
      return "^4.0.2";
    case 'vite-plugin-top-level-await':
      return "^1.4.3";
    default:
      return '*';
  }
};

//# sourceMappingURL=proj-utils.js.map
