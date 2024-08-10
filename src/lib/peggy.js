// peggy.coffee
var hCodeConverters, sep;

import pathLib from 'node:path';

import {
  pathToFileURL
} from 'node:url';

import peggy from 'peggy';

import eq from 'deep-equal';

import {
  undef,
  defined,
  notdefined,
  gen2block,
  hasKey,
  isEmpty,
  nonEmpty,
  isString,
  isHash,
  isArray,
  isFunction,
  isInteger,
  blockToArray,
  arrayToBlock,
  escapeStr,
  getOptions,
  assert,
  croak,
  OL,
  js2uri,
  ML,
  keys,
  pass,
  matchPos,
  splitStr
} from '@jdeighan/llutils';

import {
  DUMP
} from '@jdeighan/llutils/dump';

import {
  indentLevel,
  indented,
  undented
} from '@jdeighan/llutils/indent';

import {
  readTextFile,
  barf,
  slurp,
  fileExt,
  withExt,
  isFile,
  normalize,
  mkpath,
  fileDir
} from '@jdeighan/llutils/fs';

import {
  brew
} from '@jdeighan/llutils/file-processor';

import {
  PLLFetcher
} from '@jdeighan/llutils/fetcher';

import {
  SectionMap
} from '@jdeighan/llutils/section-map';

import {
  getTracer
} from '@jdeighan/llutils/tracer';

import {
  OpDumper
} from '@jdeighan/llutils/op-dumper';

import {
  ByteCodeWriter
} from '@jdeighan/llutils/bytecode-writer';

import {
  procFiles
} from '@jdeighan/llutils/file-processor';

assert(isFunction(brew), `brew is not a function: ${OL(brew)}`);

// --- code converter is applied to each code block in a peggy file
//     using type: 'javascript' allows you to use indentation syntax
//        for everything but the code blocks
hCodeConverters = {
  coffee: brew
};

sep = '# ' + '-'.repeat(62);

// ---------------------------------------------------------------------------
export var getSource = (filePath) => {
  var contents, hMetaData, peggyCode;
  ({hMetaData, contents} = readTextFile(filePath, 'eager'));
  peggyCode = PreProcessPeggy(contents, hMetaData);
  return {
    source: filePath,
    text: peggyCode
  };
};

// ---------------------------------------------------------------------------
// --- Only creates the parser as a *.js file
export var peggify = (code, hMetaData = {}, filePath = undef) => {
  var allCode, allowedStartRules, byteCodeWriter, debug, debugAllCode, debugPreProcess, dumpAST, err, hMD, hOptions, i, include, input, j, jsCode, len, len1, map, opDumper, path, peggyCode, source, sourceMap, sourceNode, text, trace, type;
  assert(isString(code), `code not a string: ${typeof code}`);
  // --- type determines which preprocessor to use, if any
  //        e.g. 'coffee'
  ({type, debug, trace, allowedStartRules, include, opDumper, byteCodeWriter, dumpAST} = getOptions(hMetaData, {
    type: undef, // --- no preprocessing
    debug: false,
    trace: true,
    allowedStartRules: ['*'],
    include: undef,
    opDumper: undef,
    byteCodeWriter: undef,
    dumpAST: undef
  }));
  // --- debug can be set to 'preprocess' or 'allcode'
  debugPreProcess = debugAllCode = false;
  if (debug === 'preprocess') {
    debug = debugPreProcess = true;
  } else if (debug === 'allcode') {
    debug = debugAllCode = true;
  }
  if (debug) {
    if (type) {
      console.log(`peggify ${OL(filePath)} as ${type}`);
    } else {
      console.log(`peggify ${OL(filePath)}`);
    }
  }
  // --- preprocess code if required
  if (defined(type)) {
    assert(isFunction(hCodeConverters[type]), `Bad type ${type}`);
    hMD = Object.assign({}, hMetaData);
    hMD.debug = debugPreProcess;
    peggyCode = PreProcessPeggy(code, hMD);
    if (defined(filePath)) {
      barf(peggyCode, withExt(filePath, ".peggy.txt"));
    }
  } else {
    peggyCode = code;
  }
  if (isString(include)) {
    input = [
      {
        source: filePath,
        text: peggyCode
      },
      getSource(include)
    ];
  } else if (isArray(include)) {
    input = [
      {
        source: filePath,
        text: peggyCode
      }
    ];
    for (i = 0, len = include.length; i < len; i++) {
      path = include[i];
      input.push(getSource(path));
    }
  } else {
    input = peggyCode;
  }
  if (debug) {
    console.log("INPUTS:");
    allCode = '';
    for (j = 0, len1 = input.length; j < len1; j++) {
      ({source, text} = input[j]);
      console.log(`   SOURCE: ${OL(source)}`);
      console.log(`   TEXT: ${escapeStr(text).substring(0, 40)}`);
      allCode += text;
    }
    if (debugAllCode) {
      DUMP(allCode, 'ALL CODE');
    }
  }
  hOptions = {
    allowedStartRules,
    format: 'es',
    trace
  };
  if (opDumper) {
    opDumper = hOptions.opDumper = new OpDumper();
  }
  if (byteCodeWriter) {
    byteCodeWriter = hOptions.byteCodeWriter = new ByteCodeWriter();
  }
  if (dumpAST) {
    hOptions.dumpAST = withExt(filePath, '.ast.txt');
  }
  try {
    if (defined(filePath)) {
      hOptions.grammarSource = filePath;
      hOptions.output = 'source-and-map';
      sourceNode = peggy.generate(input, hOptions);
      if (opDumper) {
        opDumper.writeTo(withExt(filePath, '.ops.txt'));
      }
      if (byteCodeWriter) {
        byteCodeWriter.writeTo(withExt(filePath, '.bytecodes.txt'));
      }
      ({
        code: jsCode,
        map
      } = sourceNode.toStringWithSourceMap());
      assert(isString(jsCode), `jsCode = ${OL(jsCode)}`);
      sourceMap = map.toString();
      assert(isString(sourceMap), `sourceMap = ${OL(sourceMap)}`);
      return {
        orgCode: code,
        js: jsCode,
        code: jsCode,
        sourceMap: map.toString(),
        peggyCode
      };
    } else {
      hOptions.output = 'source';
      code = peggy.generate(input, hOptions);
      return {
        orgCode: code,
        peggyCode,
        code,
        js: code
      };
    }
  } catch (error) {
    err = error;
    // --- If file was preprocessed, and text version hasn't
    //     already been saved, save it now
    if (defined(filePath) && defined(type) && !debug) {
      barf(peggyCode, withExt(filePath, ".peggy.txt"));
    }
    throw err;
  }
};

// ---------------------------------------------------------------------------
export var meSplitter = (str) => {
  var _, blockEnd, blockStart, inside, lMatches, post, pre, prelen, ws;
  lMatches = str.match(/^(.*?)\bDO\b(\s*)(.*)$/); // everything before 'DO'
  // everything after 'DO' + ws (must start w/ '{')
  // --- if no 'DO' in string, return entire string trimmed
  if (notdefined(lMatches)) {
    return [str.trim(), str.length];
  }
  // --- if pre isn't all whitespace, return pre trimmed
  [_, pre, ws, post] = lMatches;
  prelen = pre.length;
  pre = pre.trim();
  if (pre.length > 0) {
    return [pre, prelen];
  }
  // --- Now we know - str contains 'DO'

  // --- Find '{' in post, which must be the 1st char in post
  //     There must be only whitespace between 'DO' and '{'
  blockStart = prelen + 2 + ws.length;
  blockEnd = matchPos(str, blockStart);
  assert(str[blockStart] === '{', `Bad blockStart = ${blockStart} in ${OL(str)}`);
  assert(str[blockEnd] === '}', `Bad blockEnd = ${blockEnd} in ${OL(str)}`);
  inside = str.substring(blockStart + 1, blockEnd);
  if (inside.endsWith(';')) {
    return [`& {${inside}return true;}`, blockEnd + 1];
  } else {
    return [`& {${inside};return true;}`, blockEnd + 1];
  }
};

// ---------------------------------------------------------------------------
export var PreProcessPeggy = (code, hMetaData = {}, filePath = undef) => {
  var argStr, ch, coffeeCode, debug, funcName, getMatchExpr, hRules, headerSection, initSection, lVars, level, line, matchExpr, name, peggyCode, rulesSection, sm, src, type;
  assert(isString(code), `not a string: ${typeof code}`);
  ({type, debug} = getOptions(hMetaData, {
    type: 'coffee',
    debug: false
  }));
  if (notdefined(type)) {
    return code;
  }
  src = new PLLFetcher(code);
  if (debug) {
    src.dump('ALL CODE');
  }
  sm = new SectionMap([
    'header',
    'init',
    'rules' // --- converters
  ], {
    
    // --- 'header' will be CoffeeScript code
    header: (block) => {
      var err, sourceMap;
      try {
        ({code, sourceMap} = hCodeConverters[type](block));
      } catch (error) {
        err = error;
        console.log(`ERROR: Unable to convert ${OL(type)} code to JS`);
        console.log(err);
        code = '';
      }
      return ['{{', indented(code), '}}'].join("\n");
    },
    // --- 'init' section will already be JavaScript
    init: (block) => {
      if (nonEmpty(block)) {
        return `{
${block}
}`;
      } else {
        return undef;
      }
    }
  });
  headerSection = sm.section('header');
  initSection = sm.section('init');
  rulesSection = sm.section('rules');
  if (eq(src.peek(), [0, 'GLOBAL'])) {
    src.skip();
    coffeeCode = src.getBlock(1);
    if (nonEmpty(coffeeCode)) {
      if (debug) {
        DUMP(coffeeCode, 'GLOBAL CODE');
      }
      headerSection.add(coffeeCode);
    }
  }
  if (eq(src.peek(), [0, 'PER_PARSE'])) {
    src.skip();
    coffeeCode = src.getBlock(1);
    if (nonEmpty(coffeeCode)) {
      if (debug) {
        DUMP(code, 'PER_PARSE CODE');
      }
      headerSection.add("init = () =>");
      headerSection.add(1, coffeeCode);
      initSection.add('init();');
    }
  }
  hRules = {}; // { <ruleName>: <numMatchExpr>, ... }
  
  // --- Define utility functions
  getMatchExpr = () => {
    var lVars, level, match, matchExpr, re, ref;
    // --- Get match expression
    [level, matchExpr] = src.fetch();
    assert(level === 1, "BAD - level not 1");
    // --- Extract names of new variables
    lVars = [];
    re = /([A-Za-z_][A-Za-z0-9_-]*)\:/g;
    ref = matchExpr.matchAll(re);
    for (match of ref) {
      lVars.push(match[1]);
    }
    return [splitStr(matchExpr, meSplitter).join(' '), lVars];
  };
  while (src.moreLines()) {
    // --- Get rule name - must be left aligned, no whitespace
    [level, name] = src.fetch();
    assert(level === 0, "Next level not 0");
    if (debug) {
      console.log(`RULE: ${name}`);
    }
    assert(name.match(/^[A-Za-z_][A-Za-z0-9_-]*$/), `Bad name: ${OL(name)}`);
    assert(!hasKey(hRules, name), `duplicate rule ${name}`);
    rulesSection.add('');
    rulesSection.add(name);
    hRules[name] = 0; // number of options
    while (src.peekLevel() === 1) {
      [matchExpr, lVars] = getMatchExpr();
      argStr = lVars.join(', ');
      // --- output the match expression
      ch = (hRules[name] === 0) ? '=' : '/';
      hRules[name] += 1;
      rulesSection.add('');
      rulesSection.add(1, `${ch} ${matchExpr}`);
      coffeeCode = src.getBlock(2);
      if (nonEmpty(coffeeCode)) {
        if (debug) {
          DUMP(code, 'CODE');
        }
        funcName = `parse__${name}__${hRules[name]}`;
        headerSection.add(sep);
        headerSection.add('');
        headerSection.add(`${funcName} = (${argStr}) =>`);
        headerSection.add('');
        headerSection.add(1, coffeeCode);
        line = `{ return ${funcName}(${argStr}); }`;
        rulesSection.add(2, line);
      }
    }
  }
  if (debug) {
    sm.dump();
  }
  // --- Get the built code
  peggyCode = sm.getBlock();
  if (debug) {
    DUMP(peggyCode, 'PEGGY CODE');
  }
  return peggyCode;
};

// ---------------------------------------------------------------------------
// --- a converter should return {code: jsCode, sourceMap: srcMap}
export var addCodeConverter = (name, func) => {
  assert(isString(name, {
    nonEmpty: true
  }), `Bad name: ${name}`);
  assert(!hasKey(hCodeConverters, name), `${name} code converter already exists`);
  assert(typeof func === 'function', `Not a function: ${func}`);
  hCodeConverters[name] = func;
};

// ---------------------------------------------------------------------------
// --- ASYNC !!!
export var getParser = async(filePath, hOptions = {}) => {
  var debug, fullPath, h, jsFilePath;
  ({debug} = getOptions(hOptions, {
    debug: false
  }));
  fullPath = mkpath(filePath);
  if (debug) {
    console.log(`PEGGY file = ${OL(fullPath)}`);
  }
  assert(isFile(fullPath), `No such file: ${OL(filePath)}`);
  assert(fileExt(fullPath) === '.peggy', `Not a peggy file: ${OL(filePath)}`);
  procFiles(fullPath, peggify, '.js');
  jsFilePath = withExt(filePath, '.js');
  if (debug) {
    console.log(`JS file = ${OL(jsFilePath)}`);
  }
  // --- h has keys StartRules, SyntaxError, parse
  h = (await import(pathToFileURL(jsFilePath)));
  assert(isFunction(h.parse), "Bad return from import");
  return (str, hOptions = {}) => {
    var hParseOptions, start, tracer;
    // --- Valid options:
    //        start - what is the start rule (usually first rule)
    //        tracer - 'none','peggy','default' or function
    ({start, tracer} = getOptions(hOptions, {
      start: undef, //     name of start rule
      tracer: 'none' // --- can be none/peggy/default/a function
    }));
    hParseOptions = {};
    if (defined(start)) {
      hParseOptions.startRule = start;
    }
    switch (tracer) {
      case 'none':
      case 'peggy':
      case 'default':
        hParseOptions.tracer = getTracer(tracer);
        break;
      default:
        assert(isFunction(tracer), "tracer not a function");
        hParseOptions.tracer = tracer;
    }
    return h.parse(str, hParseOptions);
  };
};

// ---------------------------------------------------------------------------

//# sourceMappingURL=peggy.js.map
