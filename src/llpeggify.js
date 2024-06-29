// llpeggify.coffee

// --- Part of build process, can't use getArgs()
var err, filePath, i, lPeggyFiles, len;

import {
  globSync
} from 'glob';

import {
  execCmd
} from '@jdeighan/llutils';

import {
  peggifyFile
} from '@jdeighan/llutils/peggy';

// ---------------------------------------------------------------------------

// --- Returns array of relative file paths
lPeggyFiles = globSync('**/*.{pegjs,peggy}', {
  ignore: 'node_modules/**'
});

for (i = 0, len = lPeggyFiles.length; i < len; i++) {
  filePath = lPeggyFiles[i];
  try {
    peggifyFile(filePath);
  } catch (error) {
    err = error;
    console.log(`in ${filePath}: ${err.message}`);
  }
}

//# sourceMappingURL=llpeggify.js.map
