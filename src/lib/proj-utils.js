// proj-utils.coffee
var lValidTypes, make_dirs, type;

import prompts from 'prompts';

import {
  undef,
  defined,
  notdefined,
  OL,
  getOptions,
  assert,
  execCmd,
  words
} from '@jdeighan/llutils';

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
  barfPkgJSON,
  touch
} from '@jdeighan/llutils/fs';

// --- type 'website' will change to 'parcel' for now
lValidTypes = words('electron codemirror parcel vite none');

type = undef;

// ---------------------------------------------------------------------------
export var setProjType = (t) => {
  if (t === 'vite') {
    console.log("Type 'vite' not implemented yet");
    process.exit();
  }
  assert(defined(t), "type is undef");
  type = t;
  assert(lValidTypes.includes(type), `Bad type: ${OL(type)}`);
};

// ---------------------------------------------------------------------------
// --- For example, isType('electron') will return true
//     when type is 'codemirror'
export var isOfType = (t) => {
  switch (t) {
    case 'parcel':
      return type === 'parcel';
    case 'electron':
      return (type === 'electron') || (type === 'codemirror');
    case 'codemirror':
      return type === 'codemirror';
    case 'website':
      return (type === 'parcel') || (type === 'vite');
    default:
      return false;
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
export var init_git = () => {
  console.log("Initializing git");
  execCmd("git init");
  execCmd("git branch -m main");
};

// ---------------------------------------------------------------------------
// --- Used in bins addUserBin, addUserLib, addUserElement
// ---------------------------------------------------------------------------
export var promptForNames = async(prompt) => {
  var hResponse, lNames;
  lNames = [];
  while (true) {
    hResponse = (await prompts({
      type: 'text',
      name: 'name',
      message: prompt
    }));
    if (hResponse.name) {
      lNames.push(hResponse.name);
    } else {
      return;
    }
  }
};

// ---------------------------------------------------------------------------
export var typeSpecificSetup = () => {
  if (isOfType('website')) {
    setUpWebSite();
  }
  if (isOfType('parcel')) {
    setUpParcel();
  }
  if (isOfType('electron')) {
    setUpElectron();
  }
  if (isOfType('codemirror')) {
    setUpCodeMirror();
  }
};

// ---------------------------------------------------------------------------
export var setUpWebSite = (pj) => {
  console.log("Creating src/index.html");
  barf(`<!DOCTYPE html>
<html lang="en">
	<head>
		<meta charset="utf-8">
		<title>Parcel App</title>
	</head>
	<body>
		<h1>Hello, World!</h1>
	</body>
</html>`, "./src/index.html");
};

// ---------------------------------------------------------------------------
export var setUpParcel = () => {
  pj.addDevDep('parcel');
  pj.setField('source', 'src/index.html');
  pj.addScript('start', 'parcel');
  pj.addScript('build', 'parcel build');
};

// ---------------------------------------------------------------------------
export var setUpElectron = () => {
  pj.setField('main', 'src/main.js');
  pj.addScript('start', 'npm run build && electron .');
  console.log("Installing (dev) \"electron\"");
  pj.addDevDep('electron');
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
export var setUpCodeMirror = () => {};

//# sourceMappingURL=proj-utils.js.map
