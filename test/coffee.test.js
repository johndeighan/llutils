// coffee.test.coffee
var blocks, code, coffeeCode, filePath;

import {
  undef,
  isString
} from '@jdeighan/llutils';

import {
  slurp
} from '@jdeighan/llutils/fs';

import {
  TextBlockList
} from '@jdeighan/llutils/text-block';

import * as lib from '@jdeighan/llutils/coffee';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
//symbol "procCoffee(code)"
succeeds(() => {
  return procCoffee('v = 5');
});

fails(() => {
  return procCoffee('let v = 5');
});

matches(procCoffee('v = 5').code, `var v;

v = 5;`);

equal(procCoffee('v = 5', {
  shebang: true
}).code, `#!/usr/bin/env node
var v;

v = 5;`);

equal(procCoffee('v = 5', {
  shebang: 'abc'
}).code, `abc
var v;

v = 5;`);

// ---------------------------------------------------------------------------
//symbol "toAST(code)"
succeeds(() => {
  return toAST('v = 5');
});

fails(() => {
  return toAST('let v = 5');
});

// ---------------------------------------------------------------------------
//symbol "basicInfo(astOrCode)"
(() => {
  var t;
  t = new UnitTester();
  t.transformValue = function(code) {
    return basicInfo(code).lMissing || [];
  };
  t.samelist(`import {undef} from '@jdeighan/llutils'`, []);
  t.samelist(`import {undef} from '@jdeighan/llutils'
import {LOG} from '@jdeighan/llutils/log'`, []);
  t.samelist(`x = a`, ['a']);
  t.samelist(`import {a} from 'xyz'
x = a`, []);
  t.samelist(`import {a} from 'xyz'
x = a`, []);
  t.samelist(`n = 23`, []);
  t.samelist(`n = 23
x = n`, []);
  t.samelist(`import {f} from 'xyz'

func = () =>
	f(x,y)

f(a,b)`, ['x', 'y', 'a', 'b']);
  t.samelist(`if (f() == undef)
	console.log "Not defined"`, ['f', 'undef', 'console']);
  t.samelist(`x = x + y`, ['x', 'y']);
  t.samelist(`func = () =>
	f(x,y)`, ['x', 'y', 'f']);
  return t.samelist(`func = () =>
	f(x,y)
f = (m,n) =>
	console.log 'OK'`, ['x', 'y', 'console']);
})();

// ---------------------------------------------------------------------------
filePath = "test/coffee/test.coffee";

coffeeCode = slurp(filePath);

truthy(isString(coffeeCode));

blocks = new TextBlockList();

blocks.addBlock(filePath, coffeeCode);

({code} = procCoffee(coffeeCode));

blocks.addBlock('JavaScript', code);

equal(blocks.asString('format=box'), `┌───────  test/coffee/test.coffee  ────────┐
│ import {undef} from '@jdeighan/llutils'  │
│                                          │
│ hAST = {                                 │
│    type: 'program'                       │
│    name: 'John'                          │
│    }                                     │
│                                          │
│ equal extract(hAST, """                  │
│    type="program"                        │
│    """), {name: 'John'}                  │
│                                          │
├──────────────  JavaScript  ──────────────┤
│ var hAST;                                │
│                                          │
│ import {                                 │
│   undef                                  │
│ } from '@jdeighan/llutils';              │
│                                          │
│ hAST = {                                 │
│   type: 'program',                       │
│   name: 'John'                           │
│ };                                       │
│                                          │
│ equal(extract(hAST, \`type="program"\`), { │
│   name: 'John'                           │
│ });                                      │
│                                          │
└──────────────────────────────────────────┘`);

//# sourceMappingURL=coffee.test.js.map
