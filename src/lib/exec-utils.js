// exec-utils.coffee
var execAsync;

import {
  exec,
  execSync
} from 'node:child_process';

import vm from 'node:vm';

import {
  promisify
} from 'node:util';

execAsync = promisify(exec);

import {
  undef,
  defined,
  notdefined,
  getOptions,
  chomp,
  assert,
  croak,
  OL,
  stripCR,
  isEmpty
} from '@jdeighan/llutils';

// ---------------------------------------------------------------------------
export var execCmd = (cmdLine, hOptions = {}) => {
  var result;
  // --- may throw an exception
  hOptions.encoding = 'utf8';
  hOptions.windowsHide = true;
  hOptions.timeout = 100000;
  result = execSync(cmdLine, hOptions);
  assert(defined(result), "undef return from execSync()");
  result = result.toString();
  assert(defined(result), "undef return from toString()");
  return stripCR(result);
};

// ---------------------------------------------------------------------------
export var execCmdY = (cmdLine, hOptions = {}) => {
  hOptions.input = "y\r\n";
  return execCmd(cmdLine, hOptions);
};

// ---------------------------------------------------------------------------
export var execAndLogCmd = (cmdLine, hOptions = {}) => {
  var result;
  // --- may throw an exception
  hOptions = getOptions(hOptions, {
    encoding: 'utf8',
    windowsHide: true
  });
  result = execSync(cmdLine, hOptions).toString();
  console.log(result);
  return result;
};

// ---------------------------------------------------------------------------
export var execCmdAsync = (cmdLine, hOptions = {}) => {
  // --- may throw an exception
  hOptions = getOptions(hOptions, {
    encoding: 'utf8',
    windowsHide: true
  });
  return execAsync(cmdLine, hOptions);
};

// ---------------------------------------------------------------------------
export var npmLogLevel = () => {
  var result;
  result = execCmd('npm config get loglevel');
  return chomp(result);
};

// ---------------------------------------------------------------------------
export var checkJS = (code, fileName = undef) => {
  var script;
  script = new vm.Script(code, fileName);
  return true;
};

// ---------------------------------------------------------------------------
export var checkJSFile = (filePath) => {
  var result;
  result = execCmd(`node -c ${filePath}`);
  assert(isEmpty(result), `ERROR: ${result}`);
  return true;
};

// ---------------------------------------------------------------------------
// --- returns result of last statement executed
export var execJS = (jsCode, fileName = undef) => {
  var script;
  vm.runInThisContext(jsCode, {
    displayErrors: true
  });
  script = new vm.Script(jsCode, {
    filename: fileName
  });
  return script.runInThisContext();
};

//# sourceMappingURL=exec-utils.js.map
