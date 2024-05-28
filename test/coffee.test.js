  // coffee.test.coffee
import {
  undef
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/coffee';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
symbol("brew(code)");

succeeds(() => {
  return brew('v = 5');
});

fails(() => {
  return brew('let v = 5');
});

equal(brew('v = 5').js, `var v;

v = 5;`);

equal(brew('v = 5', {
  shebang: true
}).js, `#!/usr/bin/env node
var v;

v = 5;`);

equal(brew('v = 5', {
  shebang: 'abc'
}).js, `abc
var v;

v = 5;`);

// ---------------------------------------------------------------------------
symbol("brewFile(filePath)");

(() => {
  var filePath;
  filePath = './test/coffee/test1.coffee';
  return equal(brewFile(filePath).js, `var v;

v = 5;`);
})();

// ---------------------------------------------------------------------------
symbol("toAST(code)");

succeeds(() => {
  return toAST('v = 5');
});

fails(() => {
  return toAST('let v = 5');
});

//# sourceMappingURL=coffee.test.js.map
