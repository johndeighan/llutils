#!/usr/bin/env node
// low-level-build.coffee

// --- Designed to run in ANY project that installs @jdeighan/llutils
var contents, doLog, echo, ext, fileFilter, firstLine, force, glob, hBin, hFileTypes, hJson, hOptions, i, j, key, lNonOptions, len, len1, n, outExt, processor, reader, ref, ref1, ref2, ref3, relPath, root, shebang, short_name, stub, tla, value, watch, x, y;

import chokidar from 'chokidar';

import {
  undef,
  defined,
  notdefined,
  assert,
  npmLogLevel,
  hasKey,
  keys,
  isEmpty,
  nonEmpty,
  add_s,
  OL,
  execCmd,
  gen2block
} from '@jdeighan/llutils';

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
  brewFile
} from '@jdeighan/llutils/llcoffee';

import {
  blessFile
} from '@jdeighan/llutils/cielo';

import {
  peggifyFile
} from '@jdeighan/llutils/peggy';

import {
  sveltifyFile
} from '@jdeighan/llutils/svelte-utils';

import {
  procFiles
} from '@jdeighan/llutils/file-processor';

hFileTypes = {
  '.coffee': {
    processor: brewFile,
    outExt: '.js'
  },
  '.cielo': {
    processor: blessFile,
    outExt: '.js'
  },
  '.peggy': {
    processor: peggifyFile,
    outExt: '.js'
  },
  '.svelte': {
    processor: sveltifyFile,
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
  e: 'boolean',
  f: 'boolean',
  w: 'boolean',
  root: 'string'
}));

if (notdefined(root)) {
  root = '.';
}

ref = keys(hFileTypes);
// ---------------------------------------------------------------------------
// Process all files
for (i = 0, len = ref.length; i < len; i++) {
  ext = ref[i];
  ({processor, outExt} = hFileTypes[ext]);
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
  ref1 = allFilesMatching(`${root}/**/*${ext}`, {fileFilter});
  for (x of ref1) {
    ({relPath} = x);
    console.log(relPath);
    processor(relPath);
    n += 1;
  }
  hFileTypes[ext].numProcessed = n;
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

ref2 = allFilesMatching('./src/bin/**/*.js');
// ---------------------------------------------------------------------------
// 4. For every *.js file in the 'src/bin' directory
//       - add a shebang line if not present
//       - save <stub>: <jsPath> in hBin
//       - if has a tla, save <tla>: <jsPath> in hBin
for (y of ref2) {
  ({relPath, stub} = y);
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

ref3 = keys(hFileTypes);
// --- log number of files processed
for (j = 0, len1 = ref3.length; j < len1; j++) {
  ext = ref3[j];
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
            sveltifyFile(path);
            return console.log(`${eventType} ${path}`);
        }
        break;
      case 'unlink':
        return execCmd(`rm ${withExt(path, '.js')}`);
    }
  });
}

//# sourceMappingURL=low-level-build.js.map