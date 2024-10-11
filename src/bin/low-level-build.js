#!/usr/bin/env -S node --enable-source-maps
// low-level-build.coffee

// --- Designed to run in ANY project that installs @jdeighan/llutils
var contents, debug, doLog, echo, ext, file, filePath, firstLine, force, glob, hBin, hFiles, hJson, hOptions, hUses, i, j, k, key, l, lNonOptions, lProcessed, len, len1, len2, len3, n, pattern, quiet, reader, ref, ref1, ref2, ref3, relPath, root, shebang, short_name, stub, usedFile, value, watch, x;

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
  getArgs
} from '@jdeighan/llutils/cmd-args';

import {
  isProjRoot,
  barf,
  barfPkgJSON,
  slurpPkgJSON,
  mkpath,
  fileExt,
  withExt,
  allFilesMatching,
  readTextFile
} from '@jdeighan/llutils/fs';

import {
  procFiles,
  procOneFile,
  removeOutFile
} from '@jdeighan/llutils/file-processor';

echo = true;

doLog = (str) => {
  if (echo) {
    console.log(str);
  }
};

// --- NOTE: This should enable source maps in node, but it doesn't work
shebang = "#!/usr/bin/env -S node --enable-source-maps";

// ---------------------------------------------------------------------------
// Usage:   node src/bin/low-level-build.js

// ---------------------------------------------------------------------------
// 1. Make sure we're in a project root directory
debugger;

assert(isProjRoot('.', 'strict'), "Not in package root dir");

({
  _: lNonOptions,
  q: quiet,
  f: force,
  d: debug,
  w: watch,
  root
} = getArgs({
  _: {
    min: 0,
    max: 1
  },
  q: {
    type: 'boolean'
  },
  f: {
    type: 'boolean'
  },
  d: {
    type: 'boolean'
  },
  w: {
    type: 'boolean'
  },
  root: {
    type: 'string'
  }
}));

if (defined(root)) {
  if (root.endsWith('/')) {
    root = root.substring(0, root.length - 1);
  }
} else {
  root = '.';
}

if (quiet) {
  echo = false;
}

// ---------------------------------------------------------------------------
// Process all files
pattern = `${root}/{*.*,**/*.*}`;

({lProcessed, hUses} = procFiles(pattern, {force, debug}));

ref = keys(hUses);
for (i = 0, len = ref.length; i < len; i++) {
  filePath = ref[i];
  ref1 = hUses[filePath];
  for (j = 0, len1 = ref1.length; j < len1; j++) {
    usedFile = ref1[j];
    if (lProcessed.includes(usedFile)) {
      if (!lProcessed.includes(filePath)) {
        console.log(`ALSO PROCESS: ${OL(filePath)}`);
        procOneFile(filePath);
        lProcessed.push(filePath);
      }
    }
  }
}

// --- log number of files processed
hFiles = {};

for (k = 0, len2 = lProcessed.length; k < len2; k++) {
  file = lProcessed[k];
  ext = fileExt(file);
  if (hasKey(hFiles, ext)) {
    hFiles[ext].push(file);
  } else {
    hFiles[ext] = [file];
  }
}

ref2 = keys(hFiles).sort();
for (l = 0, len3 = ref2.length; l < len3; l++) {
  ext = ref2[l];
  n = hFiles[ext].length;
  console.log(`${n} *${ext} file${add_s(n)} compiled`);
}

// ---------------------------------------------------------------------------
hBin = {}; // --- keys to add in package.json / bin

ref3 = allFilesMatching('./src/bin/**/*.js');

// ---------------------------------------------------------------------------
// 4. For every *.js file in the 'src/bin' directory
//       - add a shebang line if not present
//       - save <stub>: <jsPath> in hBin
//       - if has a tla, save <tla>: <jsPath> in hBin
for (x of ref3) {
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
    if (filePath.match(/\bnode_modules\b/)) {
      return;
    }
    filePath = mkpath(path);
    switch (eventType) {
      case 'add':
      case 'change':
        return procOneFile(filePath);
      case 'unlink':
        return removeOutFile(filePath);
    }
  });
}

//# sourceMappingURL=low-level-build.js.map