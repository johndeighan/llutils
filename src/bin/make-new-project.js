// create-new-project.coffee
var _, author, bin, bins, clear, dev_installs, dirname, hJson, hSetKeys, i, install, installdev, installs, isType, j, k, l, lNames, lValidTypes, len, len1, len2, len3, len4, len5, lib, libs, llutils_installed, m, n, name, newDir, pkg, pkgJson, prefix, ref, ref1, rootDir, type;

import {
  undef,
  defined,
  notdefined,
  execCmd,
  OL,
  nonEmpty,
  assert,
  croak,
  words,
  hasKey
} from '@jdeighan/llutils';

import {
  getArgs
} from '@jdeighan/llutils/cmd-args';

import {
  mkpath,
  isDir,
  mkDir,
  slurp,
  barf,
  clearDir,
  slurpJSON,
  barfJSON,
  touch,
  createFile
} from '@jdeighan/llutils/fs';

console.log("Starting create-new-project");

type = undef;

lValidTypes = ['electron', 'codemirror'];

author = 'unknown';

// ---------------------------------------------------------------------------
// --- For example, isType('electron') will return true
//     when type is 'codemirror'
isType = (t) => {
  switch (t) {
    case 'electron':
      return (type === 'electron') || (type === 'codemirror');
    case 'codemirror':
      return type === 'codemirror';
    default:
      return false;
  }
};

({
  // ---------------------------------------------------------------------------
  _,
  c: clear,
  type,
  lib,
  bin,
  libs,
  bins,
  install,
  installdev
} = getArgs(undef, {
  _: [1, 1],
  c: 'boolean',
  type: 'string',
  lib: 'string', // comma separated stubs
  bin: 'string', // comma separated stubs
  libs: 'string', // comma separated stubs
  bins: 'string', // comma separated stubs
  install: 'string', // comma separated packages to install
  installdev: 'string' // comma separated packages to dev install
}));

[dirname] = _;

if (notdefined(libs)) {
  libs = lib;
}

if (notdefined(bins)) {
  bins = bin;
}

if (defined(type)) {
  console.log(`type = ${OL(type)}`);
  assert(lValidTypes.includes(type), `Bad type: ${OL(type)}`);
}

// .............................................................
rootDir = process.env.PROJECT_ROOT_DIR;

if (!isDir(rootDir)) {
  console.log(`Please set env var PROJECT_ROOT_DIR to a valid directory`);
  process.exit();
}

newDir = mkpath(rootDir, dirname);

if (isDir(newDir)) {
  if (clear) {
    clearDir(newDir);
  } else {
    console.log(`Directory ${OL(newDir)} already exists`);
    process.exit();
  }
}

console.log(`Creating directory ${newDir}`);

mkDir(newDir);

process.chdir(newDir);

console.log("Initializing npm");

execCmd("npm init -y");

llutils_installed = false;

if (defined(install)) {
  console.log("Installing npm libs");
  lNames = install.split(',').map((str) => {
    return str.trim();
  });
  assert(lNames.length > 0, "No names in 'install'");
  for (i = 0, len = lNames.length; i < len; i++) {
    name = lNames[i];
    if (name === 'llutils') {
      llutils_installed = true;
    }
    execCmd(`npm install ${name}`);
  }
}

if (defined(installdev)) {
  console.log("Installing npm libs for development");
  lNames = installdev.split(',').map((str) => {
    return str.trim();
  });
  assert(lNames.length > 0, "No names in 'install'");
  for (j = 0, len1 = lNames.length; j < len1; j++) {
    name = lNames[j];
    if (name === 'llutils') {
      llutils_installed = true;
    }
    execCmd(`npm install ${name}`);
  }
}

if (!llutils_installed) {
  execCmd("npm install ava");
}

console.log("Initializing git");

execCmd("git init");

execCmd("git branch -m main");

console.log("Making directories");

mkDir('./src');

mkDir('./src/lib');

mkDir('./src/bin');

mkDir('./test');

console.log("Fixing package.json");

hJson = slurpJSON('./package.json');

pkgJson = process.env.PROJECT_PACKAGE_JSON;

if (nonEmpty(pkgJson)) {
  // --- Can be either a JSON string or a file path
  if (pkgJson.indexOf('{') === 0) {
    hSetKeys = JSON.parse(pkgJson);
  } else {
    hSetKeys = JSON.parse(slurp(pkgJson));
  }
  Object.assign(hJson, hSetKeys);
  prefix = process.env.PROJECT_NAME_PREFIX;
  if (nonEmpty(prefix)) {
    hJson.name = `${prefix}${hJson.name}`;
  }
  hJson.description = `A ${type} app`;
  if (isType('electron')) {
    hJson.main = "src/main.js";
    hJson.scripts.start = "npm run build && electron .";
  }
  if (defined(libs)) {
    console.log("Creating libs and 'export' key");
    if (!hasKey(hJson, 'exports')) {
      hJson.exports = {};
    }
    lNames = libs.split(',').map((str) => {
      return str.trim();
    });
    assert(lNames.length > 0, "No names in 'libs'");
    if (!hasKey(hJson.exports, ".")) {
      hJson.exports["."] = `./src/lib/${lNames[0]}.js`;
    }
    for (k = 0, len2 = lNames.length; k < len2; k++) {
      name = lNames[k];
      createFile(`./src/lib/${name}.coffee`, `# --- ${name}.coffee`);
      if (llutils_installed) {
        createFile(`./test/${name}.test.coffee`, `# --- ${name}.test.offee

import * as lib from '${hJson.name}/${name}'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

equal 2+2, 4`);
      } else {
        createFile(`./test/${name}.test.coffee`, `# --- ${name}.test.offee

import * as lib from '${hJson.name}/${name}'
Object.assign(global, lib)
import test from 'ava'

test "line 7", (t) =>
	t.is 2+2, 4
`);
      }
      hJson.exports[`./${name}`] = `./src/lib/${name}.js`;
    }
    hJson.exports["./package.json"] = "./package.json";
  }
  if (defined(bins)) {
    console.log("Creating bins and 'bin' key");
    if (!hasKey(hJson, 'bin')) {
      hJson.bin = {};
    }
    lNames = bins.split(',').map((str) => {
      return str.trim();
    });
    assert(lNames.length > 0, "No names in 'bins'");
    for (l = 0, len3 = lNames.length; l < len3; l++) {
      name = lNames[l];
      touch(`./src/bin/${name}.coffee`);
      hJson.bin[name] = `./src/bin/${name}.js`;
    }
  }
}

barfJSON(hJson, './package.json');

if (hasKey(hJson, 'author')) {
  author = hJson.author;
}

installs = process.env.PROJECT_INSTALLS;

if (nonEmpty(installs)) {
  ref = words(installs);
  for (m = 0, len4 = ref.length; m < len4; m++) {
    pkg = ref[m];
    console.log(`Installing ${OL(pkg)}`);
    execCmd(`npm install ${pkg}`);
  }
}

dev_installs = process.env.PROJECT_DEV_INSTALLS;

if (nonEmpty(dev_installs)) {
  ref1 = words(dev_installs);
  for (n = 0, len5 = ref1.length; n < len5; n++) {
    pkg = ref1[n];
    console.log(`Installing (dev) ${OL(pkg)}`);
    execCmd(`npm install -D ${pkg}`);
  }
}

if (isType('electron')) {
  console.log("Installing (dev) electron");
  execCmd("npm install -D electron");
}

console.log("Creating README.md");

barf(`README.md file
==============

`, "./README.md");

console.log("Creating .gitignore");

barf(`logs/
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

console.log("Creating .npmrc");

barf(`engine-strict=true
# --- loglevel can be silent or warn
loglevel=silent`, "./.npmrc");

if (isType('electron')) {
  console.log("Creating src/main.coffee");
  barf(`import pathLib from 'node:path'
import {app, BrowserWindow} from 'electron'

app.on 'ready', () =>
	win = new BrowserWindow({
		width: 800,
		height: 600
		webPreferences: {
			preload: pathLib.join(import.meta.dirname, 'preload.js')
			}
		})
	win.loadFile('src/index.html')`, "./src/main.coffee");
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
}

//# sourceMappingURL=make-new-project.js.map
