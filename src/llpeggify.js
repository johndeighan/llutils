// llpeggify.coffee

// --- Part of build process, can't use getArgs()
//     Processes all *.peggy files where there
//        isn't a corresponding more recent *.js file
var dep, fileFilter, hFiles, hMetaData, i, include, lFiles, len, ref, relPath, x;

import {
  undef,
  defined,
  notdefined,
  isEmpty,
  keys
} from '@jdeighan/llutils';

import {
  withExt,
  allFilesMatching,
  newerDestFileExists,
  readTextFile
} from '@jdeighan/llutils/fs';

import {
  DiGraph
} from '@jdeighan/llutils/digraph';

import {
  procPeggyFile
} from '@jdeighan/llutils/peggy';

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
hFiles = {}; // --- { <file>: [<dependency>, ... ], ... }

debugger;

dep = new DiGraph();

ref = allFilesMatching("**/*.peggy", {fileFilter});
for (x of ref) {
  ({relPath} = x);
  ({hMetaData} = readTextFile(relPath));
  if (defined(hMetaData) && defined(include = hMetaData.include)) {
    // --- NOTE: include may be a string or an array
    dep.add(relPath, include);
  }
}

lFiles = dep.getBuildOrder();

console.log(lFiles);

for (i = 0, len = lFiles.length; i < len; i++) {
  relPath = lFiles[i];
  console.log(relPath);
  procPeggyFile(relPath);
}

//# sourceMappingURL=llpeggify.js.map
