// proj-utils.coffee
var getVersion, make_dirs, setUpCodeMirror, setUpElectron, setUpElm, setUpParcel, setUpVite, setUpWebSite, type;

import prompts from 'prompts';

import {
  undef,
  defined,
  notdefined,
  OL,
  getOptions,
  assert,
  croak,
  words,
  isEmpty,
  nonEmpty,
  hasKey
} from '@jdeighan/llutils';

import {
  execCmd
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
  insertLinesAfter
} from '@jdeighan/llutils/fs';

export var lValidTypes = ['electron', 'codemirror', 'elm', 'parcel', 'vite', 'none'];

type = 'none';

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
      console.log(`ERROR ${cmd} is not installed`);
      process.exit();
    }
  }
};

// ---------------------------------------------------------------------------
export var setProjType = (t) => {
  if (t === 'website') {
    type = 'parcel'; // default web site type
  }
  assert(defined(t), "type is undef");
  assert(lValidTypes.includes(t), `Bad type: ${OL(t)}`);
  type = t;
};

// ---------------------------------------------------------------------------
// --- For example, isType('electron') will return true
//     when type is 'codemirror'
export var isOfType = (t) => {
  var lMembers;
  switch (t) {
    case 'electron':
      lMembers = ['electron', 'codemirror'];
      break;
    case 'website':
      lMembers = ['parcel', 'vite'];
      break;
    default:
      lMembers = [t];
  }
  return lMembers.includes(type);
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
  setProjType(hResponse.type);
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
    console.log(`Please set env var PROJECT_ROOT_DIR to a valid directory`);
    process.exit();
  }
  // === Create the new directory and cd to it
  newDir = mkpath(rootDir, dirname);
  if (isDir(newDir)) {
    if (clear) {
      console.log(`Directory ${OL(newDir)} exists, clearing it out`);
      clearDir(newDir);
    } else {
      console.log(`Directory ${OL(newDir)} already exists`);
      console.log("Aborting...");
      process.exit();
    }
  } else {
    console.log(`Creating directory ${newDir}`);
    mkDir(newDir);
  }
  process.chdir(newDir);
  make_dirs();
};

// ---------------------------------------------------------------------------
make_dirs = () => {
  console.log("Making directories");
  console.log("   ./src");
  mkDir('./src');
  console.log("   ./src/lib");
  mkDir('./src/lib');
  console.log("   ./src/bin");
  mkDir('./src/bin');
  if (isOfType('website')) {
    console.log("   ./src/elements");
    mkDir('./src/elements');
  }
  console.log("   ./test");
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
        console.log(msg);
      } else {
        lNames.push(name);
      }
    } else {
      return lNames;
    }
  }
};

// ---------------------------------------------------------------------------
export var typeSpecificSetup = (nodeEnv) => {
  if (isOfType('website')) {
    setUpWebSite(nodeEnv);
  }
  if (isOfType('elm')) {
    setUpElm(nodeEnv);
  }
  if (isOfType('parcel')) {
    setUpParcel(nodeEnv);
  }
  if (isOfType('vite')) {
    setUpVite(nodeEnv);
  }
  if (isOfType('electron')) {
    setUpElectron(nodeEnv);
  }
  if (isOfType('codemirror')) {
    setUpCodeMirror(nodeEnv);
  }
};

// ---------------------------------------------------------------------------
setUpWebSite = (nodeEnv) => {
  nodeEnv.addDevDependency('svelte');
  console.log("Creating src/index.html");
  barf(`<!DOCTYPE html>
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
</html>`, "./src/index.html");
  barf(`# index.coffee

import {escapeStr} from '@jdeighan/llutils'
console.log escapeStr("\t\tabc\r\n")`, "./src/index.coffee");
};

// ---------------------------------------------------------------------------
export var importCustomElement = (name) => {
  insertLinesAfter("./src/index.coffee", /Custom Element Imports/, `\t\t\timport ./elements/${name}.js`);
};

// ---------------------------------------------------------------------------
setUpElm = (nodeEnv) => {
  checkIfInstalled('elm');
  // execCmd "echo y | elm init"
  nodeEnv.addDevDependency('svelte');
  nodeEnv.addScript('build', "npm run build:coffee && elm make src/Main.elm --output=main.js");
  nodeEnv.addScript('dev', "npm run build && elm reactor");
  nodeEnv.addFile("./src/Main.elm", `import Main exposing (..)
import Html exposing (text)

main =
  text "Hello!"`);
  nodeEnv.addFile("./src/index.html", `<!DOCTYPE html>
<html lang="en">
<head>
	<meta charset="utf-8">
	<title>Elm Web Site</title>
	<script src="main.js"></script>
</head>

<body>
	<div id="myapp"></div>
	<script>
		var app = Elm.Main.init({
			node: document.getElementById('myapp')
			});
	</script>
</body>
</html>`);
};

// ---------------------------------------------------------------------------
setUpParcel = (nodeEnv) => {
  nodeEnv.addDevDependency('parcel');
  nodeEnv.setField('source', 'src/index.html');
  nodeEnv.addScript('dev', 'concurrently --kill-others "llb -w" "parcel"');
  nodeEnv.addScript('build', 'llb && parcel build');
};

// ---------------------------------------------------------------------------
setUpVite = (nodeEnv) => {
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
setUpElectron = (nodeEnv) => {
  nodeEnv.setField('main', 'src/main.js');
  nodeEnv.addScript('start', 'npm run build && electron .');
  console.log("Installing (dev) \"electron\"");
  nodeEnv.addDevDependency('electron');
  console.log("Creating src/main.coffee");
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
  console.log("Creating src/index.html");
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
  console.log("Creating src/preload.coffee");
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
  console.log("Creating src/renderer.coffee");
  barf(`# --- preload.coffee has access to window and document

elem = document.getElementById('myname')
if elem
	elem.innerText = '${author}'
else
	console.log "No element with id 'myname'"`, "./src/renderer.coffee");
};

// ---------------------------------------------------------------------------
setUpCodeMirror = (nodeEnv) => {};

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
      console.log(`   SET ${name} = ${OL(value)}`);
    }
  }

  // ..........................................................
  addScript(name, str) {
    if (!hasKey(this.hJson, 'scripts')) {
      this.hJson.scripts = {};
    }
    this.hJson.scripts[name] = str;
    if (this.echo) {
      console.log(`   ADD SCRIPT ${name} = ${OL(str)}`);
    }
  }

  // ..........................................................
  addExport(name, str) {
    if (!hasKey(this.hJson, 'exports')) {
      this.hJson.exports = {};
    }
    this.hJson.exports[name] = str;
    if (this.echo) {
      console.log(`   ADD EXPORT ${name} = ${OL(str)}`);
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
      console.log(`   ADD BIN ${name}`);
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
      console.log(`   ADD BIN ${name}`);
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
      console.log(`   ADD ELEMENT ${name}`);
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
      console.log(`   DEP ${pkg} = ${OL(version)}`);
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
      console.log(`   DEV DEP ${pkg} = ${OL(version)}`);
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
      console.log(`ADD FILE ${OL(fileName)}`);
    }
    if (defined(contents)) {
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
    case 'vite-plugin-top-level-await':
      return "^1.4.3";
    default:
      return '*';
  }
};

//# sourceMappingURL=proj-utils.js.map
