#!/usr/bin/env node
// add-user-lib.coffee

// --- Add new library file(s) to an existing project
var i, lLibs, len, lib, node;

import {
  isEmpty
} from '@jdeighan/llutils';

import {
  getArgs
} from '@jdeighan/llutils/cmd-args';

import {
  promptForNames
} from '@jdeighan/llutils/proj-utils';

import {
  NodeEnv
} from '@jdeighan/llutils/node-env';

({
  // ---------------------------------------------------------------------------
  // --- If libs aren't specified on the command line,
  //     they are prompted for
  _: lLibs
} = getArgs({
  _: {
    min: 0,
    max: 2e308
  }
}));

node = new NodeEnv();

if (isEmpty(lLibs)) {
  lLibs = (await promptForNames('New library name (Enter to end)'));
}

for (i = 0, len = lLibs.length; i < len; i++) {
  lib = lLibs[i];
  node.addUserLib(lib);
}

node.write_pkg_json();

//# sourceMappingURL=add-user-lib.js.map