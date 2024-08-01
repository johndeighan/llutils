#!/usr/bin/env node
// low-level-build.coffee

// --- Designed to run in ANY project that installs @jdeighan/llutils
var doLog, echo, ext, fileFilter, force, glob, hBin, hFilesProcessed, hJson, hMetaData, hOptions, jsPath, key, lNonOptions, nCielo, nCoffee, nPeggy, oneFilePath, ref, ref1, ref2, ref3, ref4, relPath, short_name, stub, tla, value, w, x, x1, y, y1, z;

import {
  compile
} from 'svelte/compiler';

import {
  watch
} from 'node:fs';

import chokidar from 'chokidar';

import {
  undef,
  defined,
  notdefined,
  assert,
  npmLogLevel,
  isEmpty,
  nonEmpty,
  add_s,
  OL,
  execCmd
} from '@jdeighan/llutils';

import {
  getArgs
} from '@jdeighan/llutils/cmd-args';

import {
  isProjRoot,
  barfJSON,
  barfPkgJSON,
  isFile,
  slurpJSON,
  slurpPkgJSON,
  fileExt,
  withExt,
  mkpath,
  allFilesMatching,
  readTextFile,
  newerDestFileExists
} from '@jdeighan/llutils/fs';

import {
  brewFile
} from '@jdeighan/llutils/llcoffee';

import {
  peggifyFile
} from '@jdeighan/llutils/peggy';

import {
  blessFile
} from '@jdeighan/llutils/cielo';

import {
  createElemFile
} from '@jdeighan/llutils/create-elem';

hFilesProcessed = {
  coffee: 0,
  peggy: 0,
  cielo: 0,
  svelte: 0
};

echo = npmLogLevel() !== 'silent';

doLog = (str) => {
  if (echo) {
    console.log(str);
  }
};

// ---------------------------------------------------------------------------
// Usage:   node src/bin/low-level-build.js

// ---------------------------------------------------------------------------
// 1. Make sure we're in a project root directory
assert(isProjRoot('.', 'strict'), "Not in package root dir");

({
  _: lNonOptions,
  e: echo,
  f: force,
  w
} = getArgs(undef, {
  _: [0, 1],
  e: 'boolean',
  f: 'boolean',
  w: 'boolean'
}));

doLog("-- low-level-build --");

if (oneFilePath = lNonOptions[0]) {
  ext = fileExt(oneFilePath);
  doLog(oneFilePath);
  switch (ext) {
    case '.coffee':
      brewFile(oneFilePath);
      break;
    case '.peggy':
      peggifyFile(oneFilePath);
      break;
    case '.cielo':
      blessFile(oneFilePath);
      break;
    case '.svelte':
      createElemFile(oneFilePath);
  }
  process.exit();
}

// ---------------------------------------------------------------------------
// --- A file is out of date unless a *.js file exists
//        that's newer than the original file
// --- But ignore files inside node_modules
fileFilter = ({filePath}) => {
  var jsFile;
  if (filePath.match(/node_modules/i)) {
    return false;
  }
  if (force) {
    return true;
  }
  jsFile = withExt(filePath, '.js');
  return !newerDestFileExists(filePath, jsFile);
};

ref = allFilesMatching('**/*.coffee', {fileFilter});
// ---------------------------------------------------------------------------
// 2. Search project for *.coffee files and compile them
//    unless newer *.js file exists
for (x of ref) {
  ({relPath} = x);
  doLog(relPath);
  brewFile(relPath);
  hFilesProcessed.coffee += 1;
}

ref1 = allFilesMatching('**/*.{pegjs,peggy}', {fileFilter});
// ---------------------------------------------------------------------------
// 3. Search src folder for *.peggy files and compile them
//    unless newer *.js file exists
for (y of ref1) {
  ({relPath} = y);
  doLog(relPath);
  peggifyFile(relPath);
  hFilesProcessed.peggy += 1;
}

ref2 = allFilesMatching('**/*.cielo', {fileFilter});
// ---------------------------------------------------------------------------
// 4. Search src folder for *.cielo files and compile them
//    unless newer *.js file exists
for (z of ref2) {
  ({relPath} = z);
  doLog(relPath);
  blessFile(relPath);
  hFilesProcessed.cielo += 1;
}

ref3 = allFilesMatching('**/*.svelte', {fileFilter});
// ---------------------------------------------------------------------------
// 5. Search src folder for *.svelte files and compile them
//    unless newer *.js file exists
for (x1 of ref3) {
  ({relPath} = x1);
  doLog(relPath);
  createElemFile(relPath);
  hFilesProcessed.svelte += 1;
}

// ---------------------------------------------------------------------------
hBin = {}; // --- keys to add in package.json / bin


// ---------------------------------------------------------------------------
// --- generate a 3 letter acronym if file stub is <str>-<str>-<str>
tla = (stub) => {
  var _, a, b, c, lMatches;
  if (lMatches = stub.match(/^([a-z])(?:[a-z]*)\-([a-z])(?:[a-z]*)\-([a-z])(?:[a-z]*)$/)) {
    [_, a, b, c] = lMatches;
    return a + b + c;
  } else {
    return undef;
  }
};

ref4 = allFilesMatching('./src/bin/**/*.coffee');
// ---------------------------------------------------------------------------
// 4. For every *.coffee file in the 'src/bin' directory that
//       has key "shebang" set:
//       - save <stub>: <jsPath> in hBin
//       - if has a tla, save <tla>: <jsPath> in hBin
for (y1 of ref4) {
  ({relPath, stub} = y1);
  ({hMetaData} = readTextFile(relPath));
  if (hMetaData != null ? hMetaData.shebang : void 0) {
    jsPath = withExt(relPath, '.js');
    hBin[stub] = jsPath;
    short_name = tla(stub);
    if (defined(short_name)) {
      hBin[short_name] = jsPath;
    }
  }
}

// ---------------------------------------------------------------------------
// 5. Add sub-keys to key 'bin' in package.json
//    (create if not exists)
if (nonEmpty(hBin)) {
  hJson = slurpPkgJSON();
  if (!hasKey(hJson, 'bin')) {
    doLog("   - add key 'bin'");
    hJson.bin = {};
  }
  for (key in hBin) {
    value = hBin[key];
    if (hJson.bin[key] !== value) {
      doLog(`   - add bin/${key} = ${value}`);
      hJson.bin[key] = value;
    }
  }
  barfPkgJSON(hJson);
}

nCoffee = hFilesProcessed.coffee;

if (nCoffee > 0) {
  doLog(`(${nCoffee} coffee file${add_s(nCoffee)} compiled)`);
}

nPeggy = hFilesProcessed.peggy;

if (nPeggy > 0) {
  doLog(`(${nPeggy} peggy file${add_s(nPeggy)} compiled)`);
}

nCielo = hFilesProcessed.cielo;

if (nCielo > 0) {
  doLog(`(${nCielo} cielo file${add_s(nCielo)} compiled)`);
}

if (w) {
  console.log("watching for file changes...");
  glob = "**/*.{coffee,peggy,cielo,svelte}";
  hOptions = {
    persistent: true,
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 1000,
      pollInterval: 100
    }
  };
  chokidar.watch(glob, hOptions).on('all', (eventType, path) => {
    if (path.match(/node_modules/)) {
      return;
    }
    path = mkpath(path);
    switch (eventType) {
      case 'add':
      case 'change':
        switch (fileExt(path)) {
          case '.coffee':
            brewFile(path);
            return console.log(`${eventType} ${path}`);
          case '.peggy':
            peggifyFile(path);
            return console.log(`${eventType} ${path}`);
          case '.cielo':
            blessFile(path);
            return console.log(`${eventType} ${path}`);
          case '.svelte':
            createElemFile(path);
            return console.log(`${eventType} ${path}`);
        }
        break;
      case 'unlink':
        return execCmd(`rm ${withExt(path, '.js')}`);
    }
  });
}

//# sourceMappingURL=low-level-build.js.map
