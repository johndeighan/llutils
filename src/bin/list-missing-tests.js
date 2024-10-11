#!/usr/bin/env -S node --enable-source-maps
// list-missing-tests.coffee
var filePath, hArgs, ref, ref1, stub, x, y;

import {
  undef,
  defined,
  notdefined,
  assert
} from '@jdeighan/llutils';

import {
  isProjRoot,
  mkpath,
  isFile,
  slurp,
  barf,
  allFilesMatching
} from '@jdeighan/llutils/fs';

import {
  getArgs
} from '@jdeighan/llutils/cmd-args';

// ---------------------------------------------------------------------------
// 1. Make sure we're in a project root directory
hArgs = getArgs({
  _: {
    exactly: 0
  }
});

assert(isProjRoot('.', 'strict'), "Not in package root dir");

ref = allFilesMatching('./src/lib/**/*.{coffee,peggy}');
for (x of ref) {
  ({stub} = x);
  filePath = `./test/${stub}.test.coffee`;
  if (!isFile(filePath)) {
    console.log(`LIB: ${filePath}`);
  }
}

ref1 = allFilesMatching('./src/bin/**/*.coffee');
for (y of ref1) {
  ({stub} = y);
  filePath = `./test/${stub}.test.coffee`;
  if (!isFile(filePath)) {
    console.log(`BIN: ${filePath}`);
  }
}

//# sourceMappingURL=list-missing-tests.js.map