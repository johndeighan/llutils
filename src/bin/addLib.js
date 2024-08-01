#!/usr/bin/env node
// addLib.coffee

// --- Add a new library file to an existing project
var i, lLibs, len, lib;

import {
  undef,
  defined,
  notdefined
} from '@jdeighan/llutils';

import {
  getArgs
} from '@jdeighan/llutils/cmd-args';

import {
  read_pkg_json,
  addLib,
  promptForLibs
} from '@jdeighan/llutils/proj-utils';

({
  // ---------------------------------------------------------------------------
  // --- If libs aren't specified on the command line,
  //     they are prompted for
  _: lLibs
} = getArgs());

read_pkg_json();

if (nonEmpty(lLibs)) {
  for (i = 0, len = lLibs.length; i < len; i++) {
    lib = lLibs[i];
    addLib(lib);
  }
} else {
  promptForLibs();
}

write_pkg_json();

//# sourceMappingURL=addLib.js.map
