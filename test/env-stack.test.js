  // env-stack.test.coffee
import {
  undef,
  isEmpty
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/env-stack';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
(() => {
  var env;
  env = new EnvNodeStack();
  falsy(env.inCurEnv('name'));
  env.add('name');
  truthy(env.inCurEnv('name'));
  env.addEnv();
  env.add('other');
  truthy(env.inCurEnv('name'));
  truthy(env.inCurEnv('other'));
  env.endEnv();
  truthy(env.inCurEnv('name'));
  return falsy(env.inCurEnv('other'));
})();

//# sourceMappingURL=env-stack.test.js.map
