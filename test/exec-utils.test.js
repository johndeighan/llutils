// exec-utils.test.coffee
var logLevel;

import * as lib from '@jdeighan/llutils/exec-utils';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
//symbol "execCmd(str)"    # --- execute a command
equal(execCmd('echo this'), "this\n");

equal(execCmd('echo "Hello World" | wc -w'), "2\n");

// ---------------------------------------------------------------------------
//symbol "execJS(str)"    # --- execute JavaScript
like(execJS('globalThis.x = 42'), {
  x: 42
});

like(execJS('globalThis.x = "Hello World"'), {
  x: "Hello World"
});

falsy(checkJS("not real JS code +"));

fails(() => {
  return execJS("not real JS code");
});

// ---------------------------------------------------------------------------
//symbol "npmLogLevel()"    # --- get NPM log level
logLevel = npmLogLevel();

truthy((logLevel === 'silent') || (logLevel === 'warn'));

//# sourceMappingURL=exec-utils.test.js.map
