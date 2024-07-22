  // tracer.test.coffee
import {
  undef
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/tracer';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
//symbol "getTracer(type, inputStr, hVars={})"
(() => {
  var tracer;
  tracer = getTracer('advanced');
  equal(tracer.traceStr({
    type: 'rule.enter',
    rule: 'start'
  }), `? start`);
  equal(tracer.traceStr({
    type: 'rule.fail'
  }, 1), `└─> FAIL`);
  equal(tracer.traceStr({
    type: 'rule.match'
  }, 1), `└─> YES`);
  equal(tracer.traceStr({
    type: 'rule.match',
    result: 'IDENT'
  }, 1), `└─> "IDENT"`);
  equal(tracer.traceStr({
    type: 'rule.enter',
    rule: 'start'
  }, 1), `│  ? start`);
  equal(tracer.traceStr({
    type: 'string.fail'
  }, 1), `x   string`);
  equal(tracer.traceStr({
    type: 'rule.match'
  }, 1), `└─> YES`);
  return equal(tracer.traceStr({
    type: 'rule.match',
    result: 'IDENT'
  }, 1), `└─> "IDENT"`);
})();

//# sourceMappingURL=tracer.test.js.map
