#!/usr/bin/env -S node --enable-source-maps
// proc-all-peggy.coffee

// --- Part of build process, can't use getArgs()
//        Can't use any *.js files built from a *.peggy file
//        Can't use any lib that depends on a file built from peggy
//     Processes all *.peggy files where there
//        isn't a corresponding more recent *.js file
var code, contents, debug, dep, ext, fileFilter, hFiles, hMetaData, hOptions, hOtherFiles, hResult, i, include, j, lBuildOrder, len, len1, ref, ref1, relPath, sourceMap, x;

import {
  undef,
  defined,
  notdefined,
  isEmpty,
  keys,
  LOG,
  OL,
  assert,
  croak,
  isString,
  isHash,
  isArray
} from '@jdeighan/llutils';

import {
  withExt,
  allFilesMatching,
  newerDestFileExists,
  relpath,
  readTextFile,
  barf
} from '@jdeighan/llutils/fs';

import {
  DiGraph
} from '@jdeighan/llutils/digraph';

import {
  procPeggy
} from '@jdeighan/llutils/peggy';

debug = process.argv[2] === 'debug';

// ---------------------------------------------------------------------------
fileFilter = ({filePath}) => {
  var destFile;
  destFile = withExt(filePath, '.js');
  return !newerDestFileExists(filePath, destFile);
};

// ---------------------------------------------------------------------------

// --- 1. hash of files to be rebuilt, where
//        the associated value is a list of other files
//        that the file depends on
hFiles = {}; // --- { <file>: [<uses>, ... ], ... }

dep = new DiGraph();

ref = allFilesMatching("**/*.peggy", {fileFilter});
for (x of ref) {
  ({relPath} = x);
  ({hMetaData} = readTextFile(relPath));
  if (defined(hMetaData) && defined(include = hMetaData.include)) {
    // --- NOTE: include may be a string or an array
    dep.add(relPath, include);
  } else {
    dep.add(relPath);
  }
}

lBuildOrder = dep.getBuildOrder();

assert(isArray(lBuildOrder), `Not an array: ${OL(lBuildOrder)}`);

for (i = 0, len = lBuildOrder.length; i < len; i++) {
  relPath = lBuildOrder[i];
  LOG(relPath);
  ({hMetaData, contents} = readTextFile(relPath, 'eager'));
  hOptions = {
    debug,
    opDumper: true,
    byteCodeWriter: true,
    dumpAST: true
  };
  hResult = procPeggy(contents, hMetaData, relPath, hOptions);
  ({code, sourceMap, hOtherFiles} = hResult);
  barf(code, withExt(relPath, '.js'));
  if (defined(sourceMap)) {
    barf(sourceMap, withExt(relPath, ".js.map"));
  }
  if (defined(hOtherFiles)) {
    ref1 = keys(hOtherFiles);
    for (j = 0, len1 = ref1.length; j < len1; j++) {
      ext = ref1[j];
      barf(hOtherFiles[ext], withExt(relPath, ext));
    }
  }
}

//# sourceMappingURL=proc-all-peggy.js.map