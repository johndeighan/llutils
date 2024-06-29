// for-each-file.coffee

// --- Using option -debug prevents any execution
//        therefore option -cmd is not required
//        but if provided, allows output of command
//        that would be executed
var cmdStr, debug, genOutput, hCmdArgs, handleFile, handleGlob, i, lFileRecs, lGlobs, len, sep, str;

import {
  undef,
  defined,
  notdefined,
  OL,
  execCmdAsync,
  stripCR,
  isString,
  sortArrayOfHashes,
  assert,
  croak,
  LOG
} from '@jdeighan/llutils';

import {
  DUMP
} from '@jdeighan/llutils/dump';

import {
  getArgs
} from '@jdeighan/llutils/cmd-args';

import {
  isFile,
  mkpath,
  allFilesMatching,
  relpath
} from '@jdeighan/llutils/fs';

// ---------------------------------------------------------------------------
// --- Usage:
//    for-each-file <glob>... -cmd="coffee -cm <file>"
hCmdArgs = getArgs(undef, {
  _: [
    1,
    Number.MAX_VALUE // --- file paths or globs
  ],
  cmd: 'string', // --- internal '<file>' will be replaced with file path
  d: 'boolean'
});

({
  _: lGlobs,
  cmd: cmdStr,
  d: debug
} = hCmdArgs);

if (defined(cmdStr)) {
  assert(cmdStr.indexOf('<file>') !== -1, `missing '<file>' in cmd string ${OL(cmdStr)}`);
}

// --- An array of {filePath, cmd, output, err}
lFileRecs = [];

sep = '-'.repeat(40);

// ---------------------------------------------------------------------------
handleFile = (filePath) => {
  var err, hRec;
  assert(isFile(filePath), `Not a file: ${OL(filePath)}`);
  hRec = {filePath};
  if (defined(cmdStr)) {
    hRec.cmd = cmdStr.replaceAll('<file>', filePath);
    if (!debug) {
      try {
        // --- execCmd() returns a promise
        hRec.promise = execCmdAsync(hRec.cmd);
      } catch (error) {
        err = error;
        LOG(`ERROR: ${err.message}`);
        hRec.err = err;
      }
    }
  }
  lFileRecs.push(hRec);
};

// ---------------------------------------------------------------------------
handleGlob = (glob) => {
  var hFile, ref;
  ref = allFilesMatching(glob);
  for (hFile of ref) {
    handleFile(hFile.filePath);
  }
};

// ---------------------------------------------------------------------------
genOutput = async() => {
  var cmd, err, filePath, hRec, i, len, promise, ref, relPath, stderr, stdout;
  ref = sortArrayOfHashes(lFileRecs, 'filePath');
  // --- Sort alphabetically by filePath
  for (i = 0, len = ref.length; i < len; i++) {
    hRec = ref[i];
    ({cmd, filePath, promise, err} = hRec);
    relPath = relpath(filePath);
    if (debug) {
      if (defined(cmd)) {
        LOG(`CMD: ${OL(cmd)}`);
      } else {
        LOG(`FILE: ${OL(filePath)}`);
      }
    } else {
      if (err) {
        LOG(err.message);
      } else {
        try {
          ({stdout, stderr} = (await promise));
          if (defined(stdout)) {
            assert(isString(stdout), `not a string: ${OL(stdout)}`);
            DUMP(stdout, `${relPath}`);
          }
          if (defined(stderr)) {
            assert(isString(stderr), `not a string: ${OL(stderr)}`);
            if (stderr.length > 0) {
              DUMP(stderr, `STDERR ${relPath}`);
            }
          }
        } catch (error) {
          err = error;
          LOG(err.message);
        }
      }
    }
  }
};

// ---------------------------------------------------------------------------
// --- Usage:
//    for-each-file <glob>... -cmd="coffee -cm <file>"
if (debug) {
  LOG("DEBUGGING ON in for-each-file");
  DUMP(hCmdArgs, 'hCmdArgs');
}

assert(defined(debug) || defined(cmdStr), "-cmd option required unless debugging or listing");

// --- Cycle through all globs/file paths
//     NOTE: any item that contains '*' or '?' is a glob
for (i = 0, len = lGlobs.length; i < len; i++) {
  str = lGlobs[i];
  if (str.includes('*') || str.includes('?')) {
    handleGlob(str);
  } else {
    handleFile(mkpath(str));
  }
}

genOutput();

//# sourceMappingURL=for-each-file.js.map
