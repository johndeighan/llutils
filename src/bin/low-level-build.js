// low-level-build.coffee

// --- Designed to run in ANY project that installs @jdeighan/llutils
var doLog, echo, fileFilter, hBin, hFilesProcessed, hJson, hMetaData, jsPath, key, nCielo, nCoffee, nPeggy, oneFilePath, ref, ref1, ref2, ref3, relPath, short_name, stub, tla, value, x, x1, y, z;

import {
  assert,
  npmLogLevel,
  nonEmpty,
  add_s
} from '@jdeighan/llutils';

import {
  isProjRoot,
  fileExt,
  withExt,
  allFilesMatching,
  readTextFile,
  newerDestFilesExist
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

debugger;

hFilesProcessed = {
  coffee: 0,
  peggy: 0,
  cielo: 0
};

echo = npmLogLevel() !== 'silent';

doLog = (str) => {
  if (echo) {
    console.log(str);
  }
};

doLog("-- low-level-build --");

// ---------------------------------------------------------------------------
// 1. Make sure we're in a project root directory
assert(isProjRoot('.', 'strict'), "Not in package root dir");

if (oneFilePath = process.argv[2]) {
  if (fileExt(oneFilePath) === '.coffee') {
    doLog(oneFilePath);
    brewFile(oneFilePath);
    hFilesProcessed.coffee += 1;
  } else if (fileExt(oneFilePath) === '.peggy') {
    doLog(oneFilePath);
    peggifyFile(oneFilePath);
    hFilesProcessed.peggy += 1;
  }
  process.exit();
}

// ---------------------------------------------------------------------------
// --- A file (*.coffee, *.peggy or *.cielo) is out of date unless both:
//        - a *.js file exists that's newer than the original file
//        - a *.js.map file exists that's newer than the original file
// --- But ignore files inside node_modules
fileFilter = ({filePath}) => {
  var jsFile;
  if (filePath.match(/node_modules/i)) {
    return false;
  }
  jsFile = withExt(filePath, '.js');
  return !newerDestFilesExist(filePath, jsFile);
};

ref = allFilesMatching('**/*.coffee', {fileFilter});
// ---------------------------------------------------------------------------
// 2. Search project for *.coffee files and compile them
//    unless newer *.js and *.js.map files exist
for (x of ref) {
  ({relPath} = x);
  doLog(relPath);
  brewFile(relPath);
  hFilesProcessed.coffee += 1;
}

ref1 = allFilesMatching('**/*.{pegjs,peggy}', {fileFilter});
// ---------------------------------------------------------------------------
// 3. Search src folder for *.peggy files and compile them
//    unless newer *.js and *.js.map files exist OR it needs rebuilding
for (y of ref1) {
  ({relPath} = y);
  doLog(relPath);
  peggifyFile(relPath);
  hFilesProcessed.peggy += 1;
}

ref2 = allFilesMatching('**/*.cielo', {fileFilter});
// ---------------------------------------------------------------------------
// 4. Search src folder for *.cielo files and compile them
//    unless newer *.js and *.js.map files exist OR it needs rebuilding
for (z of ref2) {
  ({relPath} = z);
  doLog(relPath);
  blessFile(relPath);
  hFilesProcessed.cielo += 1;
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

ref3 = allFilesMatching('./src/bin/**/*.coffee');
// ---------------------------------------------------------------------------
// 4. For every *.coffee file in the 'src/bin' directory that
//       has key "shebang" set:
//       - save <stub>: <jsPath> in hBin
//       - if has a tla, save <tla>: <jsPath> in hBin
for (x1 of ref3) {
  ({relPath, stub} = x1);
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

//# sourceMappingURL=low-level-build.js.map
