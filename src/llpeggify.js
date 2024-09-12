// llpeggify.coffee

// --- Part of build process, can't use getArgs()
//     Processes all *.peggy files where there
//        isn't a corresponding more recent *.js file
var fileFilter, ref, relPath, x;

import {
  withExt,
  allFilesMatching,
  newerDestFileExists
} from '@jdeighan/llutils/fs';

import {
  procOneFile
} from '@jdeighan/llutils/file-processor';

// ---------------------------------------------------------------------------
fileFilter = ({filePath}) => {
  var destFile;
  destFile = withExt(filePath, '.js');
  return !newerDestFileExists(filePath, destFile);
};

ref = allFilesMatching("**/*.peggy", {fileFilter});
for (x of ref) {
  ({relPath} = x);
  procOneFile(relPath);
}

//# sourceMappingURL=llpeggify.js.map
