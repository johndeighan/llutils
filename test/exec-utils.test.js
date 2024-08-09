// exec-utils.test.coffee
var logLevel;

import * as lib from '@jdeighan/llutils/exec-utils';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
//symbol "execCmd(str)"    # --- execute a command
equal(execCmd('echo this'), "this\r\n");

// ---------------------------------------------------------------------------
//symbol "npmLogLevel()"    # --- get NPM log level
logLevel = npmLogLevel();

truthy((logLevel === 'silent') || (logLevel === 'warn'));

// ---------------------------------------------------------------------------

//# sourceMappingURL=exec-utils.test.js.map
