// peggy.coffee
var hCodeConverters;

import pathLib from 'node:path';

import {
  pathToFileURL
} from 'node:url';

import peggy from 'peggy';

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
  eq
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
  fileExt,
  withExt,
  isFile,
  myself,
  normalize,
  mkpath,
  fileDir
} from '@jdeighan/llutils/fs';

import {
  brew
} from '@jdeighan/llutils/coffee';

import {
  PLLFetcher
} from '@jdeighan/llutils/fetcher';

import {
  SectionMap
} from '@jdeighan/llutils/section-map';

import {
  getTracer
} from '@jdeighan/llutils/tracer';

assert(isFunction(brew), `brew is not a function: ${OL(brew)}`);

// --- code converter is applied to each code block in a peggy file
//     using type: 'javascript' allows you to use indentation syntax
//        for everything but the code blocks
hCodeConverters = {
  coffee: brew,
  javascript: (js) => {
    return {
      js,
      sourceMap: undef
    };
  }
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
  ({jsFilePath} = peggifyFile(fullPath));
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
//    code - a block
//    hMetaData
//       - 'type' (usually 'coffee')
//       - 'trace' (default: true)
export var peggify = (code, hMetaData = {}, filePath = undef) => {
  var debug, grammarSource, js, map, peggyCode, sourceMap, sourceNode, trace, type;
  assert(isString(code), `code not a string: ${typeof code}`);
  // --- type determines which preprocessor to use, if any
  ({type, debug, trace} = getOptions(hMetaData, {
    type: 'coffee',
    debug: false,
    trace: true
  }));
  if (debug) {
    console.log(`peggify() ${OL(filePath)}`);
  }
  // --- preprocess code if required
  if (defined(filePath)) {
    grammarSource = withExt(filePath, '.pegjs');
  } else {
    grammarSource = undef;
  }
  if (defined(type)) {
    if (debug) {
      console.log(`TYPE: ${OL(type)}`);
    }
    assert(isFunction(hCodeConverters[type]), `Bad type ${type}`);
    peggyCode = PreProcessPeggy(code, hMetaData);
    if (defined(grammarSource)) {
      barf(peggyCode, grammarSource);
    }
  } else {
    peggyCode = code;
  }
  // --- Different depending on whether filePath is defined
  if (defined(filePath)) {
    sourceNode = peggy.generate(peggyCode, {
      allowedStartRules: ['*'],
      format: 'es',
      output: 'source-and-map',
      grammarSource,
      trace
    });
    ({code, map} = sourceNode.toStringWithSourceMap());
    assert(isString(code), `code = ${OL(code)}`);
    sourceMap = map.toString();
    assert(isString(sourceMap), `sourceMap = ${OL(sourceMap)}`);
    return {
      js: code,
      sourceMap: map.toString(),
      peggyCode
    };
  } else {
    js = peggy.generate(peggyCode, {
      allowedStartRules: ['*'],
      format: 'es',
      output: 'source',
      trace
    });
    return {js, peggyCode};
  }
};

// ---------------------------------------------------------------------------
export var peggifyFile = (filePath) => {
  debugger;
  var code, hMetaData, js, jsFilePath, reader, sourceMap, sourceMapFilePath;
  ({hMetaData, reader} = readTextFile(filePath));
  code = gen2block(reader);
  ({js, sourceMap} = peggify(code, hMetaData, filePath));
  assert(isString(js), `js is ${OL(js)}`);
  jsFilePath = withExt(filePath, '.js');
  barf(js, jsFilePath);
  if (defined(sourceMap)) {
    sourceMapFilePath = withExt(filePath, '.js.map');
    barf(sourceMap, sourceMapFilePath);
  }
  return {jsFilePath, sourceMapFilePath};
};

// ---------------------------------------------------------------------------
export var PreProcessPeggy = (code, hMetaData) => {
  var _, ch, coffeeCode, debug, flag, funcName, hJoin, hRules, lVars, level, line, match, matchExpr, name, numFuncs, peggyCode, re, ref, sm, src, str, strArgs, strParms, type, v;
  assert(isString(code), `not a string: ${typeof code}`);
  ({type, debug} = getOptions(hMetaData, {
    type: 'coffee',
    debug: false
  }));
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
      var err, js, sourceMap;
      try {
        ({js, sourceMap} = hCodeConverters[type](block));
      } catch (error) {
        err = error;
        console.log(`ERROR: Unable to convert ${OL(type)} code to JS`);
        console.log(err);
        js = '';
      }
      return [
        '{{',
        indented(brew(`mkString = (lItems...) =>

	lStrings = []
	for item in lItems
		if (typeof item == 'string') || (item instanceof String)
			lStrings.push item
		else if Array.isArray(item)
			lStrings.push mkString(item...)
	return lStrings.join('')`).js),
        indented(js),
        '}}'
      ].join("\n");
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
  numFuncs = 0; // used to construct unique function names
  if (eq(src.peek(), [0, 'GLOBAL'])) {
    src.skip();
    coffeeCode = src.getBlock(1);
    if (nonEmpty(coffeeCode)) {
      if (debug) {
        DUMP(coffeeCode, 'GLOBAL CODE');
      }
      sm.section('header').add(coffeeCode);
    }
  }
  if (eq(src.peek(), [0, 'PER_PARSE'])) {
    src.skip();
    coffeeCode = src.getBlock(1);
    if (nonEmpty(coffeeCode)) {
      if (debug) {
        DUMP(code, 'PER_PARSE CODE');
      }
      sm.section('header').add("init = () =>");
      sm.section('header').add(1, coffeeCode);
      sm.section('init').add('init();');
    }
  }
  hRules = {}; // { <ruleName>: <numMatchExpr>, ... }
  while (src.moreLines()) {
    // --- Get rule name - must be left aligned, no whitespace
    [level, name] = src.fetch();
    assert(level === 0, "Next level not 0");
    if (debug) {
      console.log(`RULE: ${name}`);
    }
    assert(name.match(/^[A-Za-z][A-Za-z0-9_-]*$/), `Bad name: ${OL(name)}`);
    assert(!hasKey(hRules, name), `duplicate rule ${name}`);
    sm.section('rules').add(name);
    hRules[name] = 0; // number of options
    while (src.peekLevel() === 1) {
      // --- Get match expression
      [level, matchExpr] = src.fetch();
      assert(level === 1, "BAD - level not 1");
      matchExpr = matchExpr.replaceAll('{', '|').replaceAll('}', '|');
      // --- Extract names of new variables
      lVars = [];
      hJoin = {};
      re = /([A-Za-z][A-Za-z_-]*)\:(\:)?/g;
      ref = matchExpr.matchAll(re);
      for (match of ref) {
        [_, str, flag] = match;
        lVars.push(str);
        if (flag) {
          hJoin[str] = true;
        }
      }
      strParms = lVars.join(',');
      strArgs = ((function() {
        var i, len, results;
        results = [];
        for (i = 0, len = lVars.length; i < len; i++) {
          v = lVars[i];
          if (hJoin[v]) {
            results.push(`mkString(${v})`);
          } else {
            results.push(v);
          }
        }
        return results;
      })()).join(',');
      // --- output the match expression
      ch = (hRules[name] === 0) ? '=' : '/';
      hRules[name] += 1;
      matchExpr = matchExpr.replaceAll('::', ':');
      sm.section('rules').add(1, `${ch} ${matchExpr}`);
      coffeeCode = src.getBlock(2);
      if (nonEmpty(coffeeCode)) {
        if (debug) {
          DUMP(code, 'CODE');
        }
        funcName = `func${numFuncs}`;
        numFuncs += 1;
        line = `${funcName} = (${strParms}) =>`;
        sm.section('header').add(line);
        sm.section('header').add(1, coffeeCode);
        line = `{ return ${funcName}(${strArgs}); }`;
        sm.section('rules').add(2, line);
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
// --- a converter should return {js: jsCode, sourceMap: srcMap}
export var addCodeConverter = (name, func) => {
  assert(isString(name, {
    nonEmpty: true
  }), `Bad name: ${name}`);
  assert(!hasKey(hCodeConverters, name), `${name} code converter already exists`);
  assert(typeof func === 'function', `Not a function: ${func}`);
  hCodeConverters[name] = func;
};

// ---------------------------------------------------------------------------

//# sourceMappingURL=peggy.js.map
