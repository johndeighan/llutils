#!/usr/bin/env node
// shebangify.coffee
var contents, ref, relPath, shebang, x;

import {
  assert
} from '@jdeighan/llutils';

import {
  isProjRoot,
  allFilesMatching,
  readTextFile,
  slurp,
  barf
} from '@jdeighan/llutils/fs';

shebang = "#!/usr/bin/env node";

// ---------------------------------------------------------------------------
assert(isProjRoot('.', 'strict'), "Not in package root dir");

ref = allFilesMatching('**/src/bin/*.js');
for (x of ref) {
  ({relPath} = x);
  contents = slurp(relPath);
  if (!contents.match(/^\#\!/)) {
    barf(shebang + "\n" + contents, relPath);
  }
}

//# sourceMappingURL=shebangify.js.map
