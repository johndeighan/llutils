// context-stack.test.coffee
var hVars, hVars2, lVars, stack;

import {
  undef,
  defined,
  notdefined
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/context-stack';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
hVars = {
  a: 42,
  b: 13
};

hVars2 = {
  x: 1,
  y: 2
};

lVars = [
  {
    abc: 3
  },
  {
    def: 4
  }
];

stack = new ContextStack(hVars);

equal(stack.currentType(), 'hash');

equal(stack.current(), hVars);

stack.add(hVars2);

equal(stack.currentType(), 'hash');

stack.add(lVars);

equal(stack.currentType(), 'array');

stack.pop();

equal(stack.currentType(), 'hash');

equal(stack.current(), hVars2);

stack.pop();

equal(stack.currentType(), 'hash');

equal(stack.current(), hVars);

//# sourceMappingURL=context-stack.test.js.map
