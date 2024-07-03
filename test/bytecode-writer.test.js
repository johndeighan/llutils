  // bytecode-writer.test.coffee
import {
  undef
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/bytecode-writer';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
succeeds(function() {
  var writer;
  return writer = new ByteCodeWriter();
});

//# sourceMappingURL=bytecode-writer.test.js.map
