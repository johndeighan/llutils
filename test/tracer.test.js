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
  tracer = getTracer('default');
  equal(tracer.traceStr({
    type: 'rule.enter',
    rule: 'start'
  }), `? start`);
  tracer.level = 1;
  equal(tracer.traceStr({
    type: 'rule.fail'
  }), `└─> NO`);
  equal(tracer.traceStr({
    type: 'rule.match'
  }), `└─> YES`);
  equal(tracer.traceStr({
    type: 'rule.match',
    result: 'IDENT'
  }), `└─> "IDENT"`);
  equal(tracer.traceStr({
    type: 'rule.enter',
    rule: 'start'
  }), `│  ? start`);
  equal(tracer.traceStr({
    type: 'rule.fail'
  }), `└─> NO`);
  equal(tracer.traceStr({
    type: 'rule.match'
  }), `└─> YES`);
  return equal(tracer.traceStr({
    type: 'rule.match',
    result: 'IDENT'
  }), `└─> "IDENT"`);
})();

//# sourceMappingURL=tracer.test.js.map
