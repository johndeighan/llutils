  // ast-walker.test.coffee
import {
  undef,
  defined,
  notdefined,
  hasKey,
  dclone,
  assert,
  words
} from '@jdeighan/llutils';

import {
  coffeeInfo
} from '@jdeighan/llutils/coffee';

import * as lib from '@jdeighan/llutils/ast-walker';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
symbol("coffeeInfo(codeOrAST)");

(() => {
  var code;
  code = `export x = y
export func1 = (arg) => return 13
export func2 = (arg) -> return 13`;
  return equal(coffeeInfo(code).lExports, ['x', 'func1', 'func2']);
})();

(() => {
  var code;
  code = `import {
	undef, defined, notdefined,
	} from '@jdeighan/llutils'`;
  return equal(coffeeInfo(code).hImports, {
    '@jdeighan/llutils': words('undef defined notdefined')
  });
})();

// ---------------------------------------------------------------------------
(() => {
  var code;
  code = `import {
	undef, defined, notdefined,
	} from '@jdeighan/llutils'
import {withExt} from '@jdeighan/llutils/fs'`;
  return equal(coffeeInfo(code).hImports, {
    '@jdeighan/llutils': words('undef defined notdefined'),
    '@jdeighan/llutils/fs': ['withExt']
  });
})();

// ---------------------------------------------------------------------------
(() => {
  var code;
  code = `export x = 42`;
  return equal(coffeeInfo(code).lExports, ['x']);
})();

// ---------------------------------------------------------------------------
fails(() => {
  return coffeeInfo(`export x = 33
export x = 42`);
});

// ---------------------------------------------------------------------------
(() => {
  var code;
  code = `export x = 42
export y = func(33)`;
  return equal(coffeeInfo(code).lExports, ['x', 'y']);
})();

//# sourceMappingURL=ast-walker.test.js.map
