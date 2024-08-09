#!/usr/bin/env node
// low-level-build.coffee

// --- Designed to run in ANY project that installs @jdeighan/llutils
var contents, doLog, echo, ext, fileFilter, firstLine, force, glob, hBin, hFileTypes, hJson, hOptions, i, j, key, lFuncs, lNonOptions, len, len1, n, outExt, reader, ref, ref1, ref2, relPath, root, shebang, short_name, stub, value, watch, x;

import chokidar from 'chokidar';

import {
  undef,
  defined,
  notdefined,
  assert,
  hasKey,
  keys,
  isEmpty,
  nonEmpty,
  add_s,
  OL,
  gen2block,
  tla
} from '@jdeighan/llutils';

import {
  execCmd,
  npmLogLevel
} from '@jdeighan/llutils/exec-utils';

import {
  getArgs
} from '@jdeighan/llutils/cmd-args';

import {
  isProjRoot,
  barfJSON,
  barfPkgJSON,
  isFile,
  barf,
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
  peggify
} from '@jdeighan/llutils/peggy';

import {
  procFiles,
  brew,
  cieloPreProcess,
  sveltify
} from '@jdeighan/llutils/file-processor';

hFileTypes = {
  '.coffee': {
    lFuncs: [brew],
    outExt: '.js'
  },
  '.cielo': {
    lFuncs: [cieloPreProcess, brew],
    outExt: '.js'
  },
  '.peggy': {
    lFuncs: [peggify],
    outExt: '.js'
  },
  '.svelte': {
    lFuncs: [sveltify],
    outExt: '.js'
  }
};

echo = npmLogLevel() !== 'silent';

doLog = (str) => {
  if (echo) {
    console.log(str);
  }
};

shebang = "#!/usr/bin/env node";

// ---------------------------------------------------------------------------
// Usage:   node src/bin/low-level-build.js

// ---------------------------------------------------------------------------
// 1. Make sure we're in a project root directory
assert(isProjRoot('.', 'strict'), "Not in package root dir");

({
  _: lNonOptions,
  e: echo,
  f: force,
  w: watch,
  root
} = getArgs({
  _: {
    min: 0,
    max: 1
  },
  e: {
    type: 'boolean'
  },
  f: {
    type: 'boolean'
  },
  w: {
    type: 'boolean'
  },
  root: {
    type: 'string'
  }
}));

if (notdefined(root)) {
  root = '.';
}

ref = keys(hFileTypes);
// ---------------------------------------------------------------------------
// Process all files
for (i = 0, len = ref.length; i < len; i++) {
  ext = ref[i];
  ({lFuncs, outExt} = hFileTypes[ext]);
  fileFilter = ({filePath}) => {
    var outFile;
    if (filePath.match(/node_modules/i)) {
      return false;
    }
    if (force) {
      return true;
    }
    outFile = withExt(filePath, outExt);
    return !newerDestFileExists(filePath, outFile);
  };
  n = 0;
  // --- possible options: force, debug, logOnly, echo
  n = procFiles(`${root}/**/*${ext}`, lFuncs, outExt);
  hFileTypes[ext].numProcessed = n;
}

// ---------------------------------------------------------------------------
hBin = {}; // --- keys to add in package.json / bin

ref1 = allFilesMatching('./src/bin/**/*.js');

// ---------------------------------------------------------------------------
// 4. For every *.js file in the 'src/bin' directory
//       - add a shebang line if not present
//       - save <stub>: <jsPath> in hBin
//       - if has a tla, save <tla>: <jsPath> in hBin
for (x of ref1) {
  ({relPath, stub} = x);
  ({reader} = readTextFile(relPath));
  firstLine = reader().next().value;
  if (!firstLine.match(/^\#\!/)) {
    contents = shebang + "\n" + gen2block(reader);
    barf(contents, relPath);
  }
  hBin[stub] = relPath;
  if (defined(short_name = tla(stub))) {
    hBin[short_name] = relPath;
  }
}

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

ref2 = keys(hFileTypes);
// --- log number of files processed
for (j = 0, len1 = ref2.length; j < len1; j++) {
  ext = ref2[j];
  n = hFileTypes[ext].numProcessed;
  if (defined(n) && (n > 0)) {
    console.log(`${n} *${ext} file${add_s(n)} compiled`);
  }
}

// --- watch for file changes
if (watch) {
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
    ext = fileExt(path);
    ({lFuncs, outExt} = hFileTypes[ext]);
    switch (eventType) {
      case 'add':
      case 'change':
        return procFiles(path, lFuncs, outExt);
      case 'unlink':
        return execCmd(`rm ${withExt(path, outExt)}`);
    }
  });
}

//# sourceMappingURL=low-level-build.js.map