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
  LOG,
  stripCR,
  isEmpty
} from '@jdeighan/llutils';

import {
  slurp
} from '@jdeighan/llutils/fs';

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
export var getScriptObj = (jsCode, hOptions = {}) => {
  return new vm.Script(jsCode, hOptions);
};

// ---------------------------------------------------------------------------
export var checkJS = (jsCode, hOptions = {}) => {
  var err, script;
  try {
    script = getScriptObj(jsCode, hOptions);
    return true;
  } catch (error) {
    err = error;
    return false;
  }
};

// ---------------------------------------------------------------------------
export var checkJSFile = (filePath, hOptions = {}) => {
  assert(isFile(filePath), `No such file: ${OL(filePath)}`);
  return checkJS(slurp(filePath), hOptions);
};

// ---------------------------------------------------------------------------
// --- hContext is the global object
//     JS code can set keys via, e.g. "globalThis.key = <value>;"
//     these values will appear in hContext
export var execJS = (jsCode, hContext = {}, filename = undef) => {
  var hOptions, script;
  hOptions = {filename};
  script = getScriptObj(`'use strict';\n${jsCode}`, hOptions);
  script.runInNewContext(hContext, {
    displayErrors: true
  });
  return hContext;
};

//# sourceMappingURL=exec-utils.js.map
