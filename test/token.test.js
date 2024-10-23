// token.test.coffee
var u;

import {
  BaseTracer
} from '@jdeighan/llutils/peggy-utils';

import * as lib from '@jdeighan/llutils/token';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

u = new UnitTester();

u.transformValue = (block) => {
  return parse(block, {
    tracer: new BaseTracer()
  });
};

// ---------------------------------------------------------------------------
u.equal("true", {
  type: 'boolean',
  value: true
});

u.equal("false", {
  type: 'boolean',
  value: false
});

u.equal("13", {
  type: 'integer',
  value: 13
});

u.equal("13.5", {
  type: 'float',
  value: 13.5
});

u.equal("'abc'", {
  type: 'string',
  value: 'abc'
});

u.equal('"abc"', {
  type: 'string',
  value: 'abc'
});

u.equal('abc', {
  type: 'identifier',
  value: 'abc'
});

//# sourceMappingURL=token.test.js.map
