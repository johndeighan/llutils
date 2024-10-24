// civet.coffee
var croakJS;

import {
  findConfig,
  loadConfig
} from "@danielx/civet/config";

import {
  parse,
  compile
} from "@danielx/civet";

import {
  undef,
  defined,
  notdefined,
  getOptions,
  OL,
  ML,
  LOG,
  assert,
  croak,
  isString,
  isEmpty,
  nonEmpty
} from '@jdeighan/llutils';

import {
  checkJS,
  execJS
} from '@jdeighan/llutils/exec-utils';

import {
  cieloPreProcess
} from '@jdeighan/llutils/cielo';

// ---------------------------------------------------------------------------
// --- ASYNC!
export var procCivet = async function(contents, hMetaData = {}, filePath = undef, hOptions = {}) {
  var code, configPath, debug, hConfig, jsCode, preprocess, strict;
  assert(isString(contents), `Not a string: ${OL(contents)}`);
  assert(nonEmpty(contents), `Empty contents: ${OL(contents)}`);
  ({debug, preprocess, strict} = getOptions(hOptions, {
    debug: false,
    preprocess: cieloPreProcess,
    strict: true
  }));
  if (defined(preprocess)) {
    code = preprocess(contents, {...hOptions, ...hMetaData}, filePath);
  } else {
    code = contents;
  }
  if (strict) {
    code = `'use strict'\n${code}`;
  }
  configPath = (await findConfig(process.cwd()));
  hConfig = (await loadConfig(configPath));
  jsCode = (await compile(code, {
    ...hConfig,
    js: true
  }));
  return jsCode;
};

// ---------------------------------------------------------------------------
// --- ASYNC!
croakJS = (code, err, id) => {
  return croak(`procCivet() failed ${id}:\n${ML(code)}\n(${err.message})`);
};

export var execCivet = async function(code, hMetaData = {}, filePath = undef, hOptions = {}) {
  debugger;
  var debug, err, jsCode, result;
  ({debug} = getOptions(hOptions, {
    debug: false
  }));
  try {
    jsCode = (await procCivet(code, hMetaData, filePath));
  } catch (error) {
    err = error;
    croakJS(code, err, 1);
  }
  if (debug) {
    LOG("JS Code");
    LOG(ML(jsCode));
  }
  if (jsCode === 'invalid(javascript)') {
    croakJS(code, err, 2);
  } else if (!checkJS(jsCode)) {
    croakJS(code, err, 3);
  }
  try {
    result = execJS(jsCode);
    if (debug) {
      LOG(`RESULT: ${OL(result)}`);
    }
    return result;
  } catch (error) {
    err = error;
    return croakJS(code, err, 4);
  }
};

//# sourceMappingURL=civet.js.map
