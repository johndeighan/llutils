#!/usr/bin/env node
// add-user-element.coffee

// --- Add a new binary executable file to an existing project
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
  // --- If elements aren't specified on the command line,
  //     they are prompted for
  _: lLibs
} = getArgs());

node = new NodeEnv();

if (isEmpty(lLibs)) {
  lLibs = (await promptForNames('New element name (Enter to end)'));
}

for (i = 0, len = lLibs.length; i < len; i++) {
  lib = lLibs[i];
  node.addUserElement(lib);
}

node.write_pkg_json();

//# sourceMappingURL=add-user-element.js.map
