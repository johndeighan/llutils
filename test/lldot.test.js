  // lldot.test.coffee
import {
  undef,
  defined,
  notdefined
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/lldot';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
succeeds(() => {
  return procDotFile("./test/lldot/test.dot");
});

//# sourceMappingURL=lldot.test.js.map
