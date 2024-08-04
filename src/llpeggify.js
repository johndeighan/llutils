// llpeggify.coffee

// --- Part of build process, can't use getArgs()
var err, fileFilter, fileName, ref, relPath, x;

import {
  globSync
} from 'glob';

import {
  undef,
  defined,
  OL,
  execCmd
} from '@jdeighan/llutils';

import {
  allFilesMatching,
  withExt,
  newerDestFileExists
} from '@jdeighan/llutils/fs';

import {
  peggifyFile
} from '@jdeighan/llutils/peggy';

// ---------------------------------------------------------------------------
fileName = process.argv[2];

fileFilter = ({filePath}) => {
  var jsFile;
  if (filePath.match(/node_modules/i)) {
    return false;
  }
  jsFile = withExt(filePath, '.js');
  return !newerDestFileExists(filePath, jsFile);
};

ref = allFilesMatching('**/*.peggy', {fileFilter});
for (x of ref) {
  ({relPath} = x);
  if (defined(fileName) && !relPath.endsWith(fileName)) {
    continue;
  }
  try {
    console.log(`llpeggify ${relPath}`);
    peggifyFile(relPath);
  } catch (error) {
    err = error;
    console.log(`in ${relPath}: ${err.message}`);
  }
}

//# sourceMappingURL=llpeggify.js.map
