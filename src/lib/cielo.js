// cielo.coffee
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
  indented,
  splitLine
} from '@jdeighan/llutils/indent';

import {
  checkJS,
  execJS
} from '@jdeighan/llutils/exec-utils';

import {
  LineFetcher
} from '@jdeighan/llutils/fetcher';

import {
  replaceHereDocs
} from '@jdeighan/llutils/heredoc';

// ---------------------------------------------------------------------------
// --- ASYNC!
export var procCielo = async function(code, hMetaData = {}, filePath = undef, hOptions = {}) {
  var configPath, debug, hConfig, jsCode, preprocess;
  assert(isString(code), `Not a string: ${OL(code)}`);
  ({debug, preprocess} = getOptions(hOptions, {
    debug: false,
    preprocess: cieloPreProcess
  }));
  if (defined(preprocess)) {
    code = preprocess(code, {...hMetaData, ...hOptions}, filePath);
  }
  configPath = (await findConfig(process.cwd()));
  hConfig = (await loadConfig(configPath));
  jsCode = (await compile(code, {
    ...hConfig,
    js: true
  }));
  return {
    code: jsCode
  };
};

// ---------------------------------------------------------------------------
export var getCieloAST = (code) => {
  return parse(code);
};

// ---------------------------------------------------------------------------
// --- ASYNC!
export var execCielo = async function(code, hMetaData = {}, filePath = undef, hOptions = {}) {
  debugger;
  var debug, err, hContext, hResult, jsCode;
  ({debug, hContext} = getOptions(hOptions, {
    debug: false,
    hContext: {}
  }));
  try {
    hResult = (await procCielo(code, hMetaData, filePath));
    jsCode = hResult.code;
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
    hContext = execJS(jsCode, hContext);
    if (debug) {
      LOG(`RESULT: ${OL(hContext)}`);
    }
    return hContext;
  } catch (error) {
    err = error;
    return croakJS(code, err, 4);
  }
};

// ---------------------------------------------------------------------------
croakJS = (code, err, id) => {
  return croak(`procCielo() failed ${id}:
${ML(code)}
(${err.message})`);
};

// ---------------------------------------------------------------------------
// --- End file on __END__
//     Replace HEREDOCs
export var cieloPreProcess = (code, hMetaData = {}, filePath = undef) => {
  var lLines, level, src, str;
  lLines = [];
  src = new LineFetcher(code);
  while (src.moreLines()) {
    [level, str] = splitLine(src.fetch());
    if ((level === 0) && (str === '__END__')) {
      break;
    }
    str = replaceHereDocs(level, str, src);
    lLines.push(indented(str, level));
  }
  return lLines.join("\n");
};

//# sourceMappingURL=cielo.js.map
