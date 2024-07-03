// save_temp.coffee
var expected, result;

import {
  undef
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/cmd-args';

Object.assign(global, lib);

// ---------------------------------------------------------------------------
result = getArgs('-ab -cd=why', undef, 'tracer=debug');

console.log(result);

expected = {
  a: true,
  b: true,
  cd: 'why'
};

//# sourceMappingURL=save_temp.js.map
