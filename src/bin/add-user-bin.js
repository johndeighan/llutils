#!/usr/bin/env node
// add-user-bin.coffee

// --- Add a new binary executable file to an existing project
var bin, i, lBins, len, node;

import {
  isEmpty
} from '@jdeighan/llutils';

import {
  getArgs
} from '@jdeighan/llutils/cmd-args';

import {
  promptForNames,
  NodeEnv
} from '@jdeighan/llutils/proj-utils';

({
  // ---------------------------------------------------------------------------
  // --- If bins aren't specified on the command line,
  //     they are prompted for
  _: lBins
} = getArgs({
  _: {
    min: 0,
    max: 2e308
  }
}));

node = new NodeEnv();

if (isEmpty(lBins)) {
  lBins = (await promptForNames('New binary name (Enter to end)'));
}

for (i = 0, len = lBins.length; i < len; i++) {
  bin = lBins[i];
  node.addUserBin(bin);
}

node.write_pkg_json();

//# sourceMappingURL=add-user-bin.js.map