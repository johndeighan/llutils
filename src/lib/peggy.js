// peggy.coffee
var hCodeConverters, sep;

import {
  pathToFileURL
} from 'node:url';

import peggy from 'peggy';

import eq from 'deep-equal';

import fs from 'node:fs';

import {
  undef,
  defined,
  notdefined,
  gen2block,
  hasKey,
  isEmpty,
  nonEmpty,
  lpad,
  toBlock,
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
  LOG,
  js2uri,
  ML,
  keys,
  pass,
  matchPos,
  splitStr,
  rpad,
  zpad,
  words
} from '@jdeighan/llutils';

import {
  TextTable
} from '@jdeighan/llutils/text-table';

import {
  DUMP,
  BOX
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
  relpath,
  fileDir
} from '@jdeighan/llutils/fs';

import {
  procCoffee
} from '@jdeighan/llutils/llcoffee';

import {
  PLLFetcher
} from '@jdeighan/llutils/fetcher';

import {
  SectionMap
} from '@jdeighan/llutils/section-map';

assert(isFunction(procCoffee), `procCoffee is not a function: ${OL(procCoffee)}`);

// --- code converter is applied to each code block in a peggy file
//     using type: 'javascript' allows you to use indentation syntax
//        for everything but the code blocks
hCodeConverters = {
  coffee: procCoffee
};

sep = '# ' + '-'.repeat(62);

// ---------------------------------------------------------------------------
// --- ASYNC !!!
export var getParser = async(filePath, hOptions = {}) => {
  var debug, h, jsFilePath;
  ({debug} = getOptions(hOptions, {
    debug: false
  }));
  if (debug) {
    console.log(`PEGGY file = ${OL(filePath)}`);
  }
  assert(isFile(filePath), `No such file: ${OL(filePath)}`);
  assert(fileExt(filePath) === '.peggy', `Not a peggy file: ${OL(filePath)}`);
  // --- writes files *.js, possibly *.map
  procPeggyFile(filePath);
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
// --- Only creates the parser as a *.js file
export var procPeggy = (contents, hMetaData = {}, filePath = undef, hOptions = {}) => {
  var allCode, allowedStartRules, byteCodeWriter, debug, debugAllCode, debugPreProcess, dumpAST, err, hMeta, hOtherFiles, hResult, include, j, jsCode, k, lInputs, lUses, len, len1, map, opDumper, peggyCode, source, sourceMap, sourceNode, str, text, trace, type;
  assert(isString(contents), `contents not a string: ${OL(contents)}`);
  assert(nonEmpty(contents), `empty contents: ${OL(contents)}`);
  ({debug, trace, opDumper, byteCodeWriter, dumpAST} = getOptions(hOptions, {
    debug: false,
    trace: true,
    opDumper: false,
    byteCodeWriter: false,
    dumpAST: false
  }));
  // --- type determines which preprocessor to use, if any
  //        e.g. 'coffee'
  ({type, allowedStartRules, include} = getOptions(hMetaData, {
    type: undef, // --- no preprocessing
    allowedStartRules: ['*'],
    include: undef
  }));
  // --- debug can be set to 'preprocess' or 'allcode'
  debugPreProcess = debugAllCode = false;
  if (debug === 'preprocess') {
    debug = debugPreProcess = true;
  } else if ((debug === 'allcode') || (debug === true)) {
    debug = debugAllCode = true;
  }
  if (debug) {
    if (type) {
      console.log(`procPeggy ${OL(filePath)} as ${type}`);
    } else {
      console.log(`procPeggy ${OL(filePath)}`);
    }
  }
  // --- preprocess contents if required
  if (defined(type)) {
    assert(isFunction(hCodeConverters[type]), `Bad type ${type}`);
    peggyCode = PreProcessPeggy(contents, hMetaData, hOptions);
    if (defined(filePath)) {
      barf(peggyCode, withExt(filePath, ".peggy.txt"));
    }
  } else {
    peggyCode = contents;
  }
  // --- set lUses to an array of included files
  if (isString(include)) {
    lUses = [include];
  } else if (isArray(include)) {
    lUses = include;
  } else {
    lUses = [];
  }
  // --- build list of all inputs
  lInputs = [
    {
      source: filePath,
      text: peggyCode
    }
  ];
  for (j = 0, len = lUses.length; j < len; j++) {
    filePath = lUses[j];
    ({
      hMetaData: hMeta,
      contents: str
    } = readTextFile(filePath, 'eager'));
    lInputs.push({
      source: filePath,
      text: PreProcessPeggy(str, hMeta)
    });
  }
  if (debug) {
    console.log("INPUTS:");
    allCode = '';
    for (k = 0, len1 = lInputs.length; k < len1; k++) {
      ({source, text} = lInputs[k]);
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
      sourceNode = peggy.generate(lInputs, hOptions);
      hOtherFiles = {};
      if (opDumper) {
        hOtherFiles['.ops.txt'] = opDumper.getBlock();
      }
      if (byteCodeWriter) {
        hOtherFiles['.bytecodes.txt'] = byteCodeWriter.getBlock();
      }
      ({
        code: jsCode,
        map
      } = sourceNode.toStringWithSourceMap());
      assert(isString(jsCode), `jsCode = ${OL(jsCode)}`);
      sourceMap = map.toString();
      assert(isString(sourceMap), `sourceMap = ${OL(sourceMap)}`);
      hResult = {
        code: jsCode,
        sourceMap: map.toString(),
        hOtherFiles,
        lUses
      };
      return hResult;
    } else {
      hOptions.output = 'source';
      jsCode = peggy.generate(lInputs, hOptions);
      return {
        code: jsCode,
        hOtherFiles,
        lUses
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
export var procPeggyFile = (filePath, hOptions = {}) => {
  var contents, hMetaData;
  assert(fileExt(filePath) === '.peggy', "Not a peggy file");
  assert(isFile(filePath), `No such file: ${OL(filePath)}`);
  ({hMetaData, contents} = readTextFile(filePath, 'eager'));
  return procPeggy(contents, hMetaData, filePath, hOptions);
};

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
export var analyzePeggyFile = (filePath) => {
  var contents, hMetaData, hResults, include;
  assert(isFile(filePath), `No such file: ${OL(filePath)}`);
  ({hMetaData, contents} = readTextFile(filePath, 'eager'));
  hResults = {};
  if (hasKey(hMetaData, 'include')) {
    include = hMetaData.include;
    if (isString(include)) {
      hResults.lUses = [include];
    } else if (isArray(include)) {
      hResults.lUses = include;
    } else {
      croak(`Bad include key in meta data in ${OL(filePath)}`);
    }
  } else {
    hResults.lUses = [];
  }
  return hResults;
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
export var PreProcessPeggy = (code, hMetaData = {}, filePath = undef, hOptions = {}) => {
  var argStr, ch, coffeeCode, debug, funcName, getMatchExpr, hRules, headerSection, initSection, lVars, level, line, matchExpr, name, peggyCode, rulesSection, sm, src, type;
  assert(isString(code), `not a string: ${typeof code}`);
  ({type} = getOptions(hMetaData, {
    type: 'coffee'
  }));
  if (notdefined(type)) {
    return code;
  }
  ({debug} = getOptions(hOptions, {
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
export var ByteCodeWriter = class ByteCodeWriter {
  constructor(hOptions = {}) {
    this.lRuleNames = [];
    this.hRules = {};
    // --- These are set when the AST is known
    this.literals = undef;
    this.expectations = undef;
    // --- options
    this.detailed = hOptions.detailed;
  }

  // ..........................................................
  setAST(ast) {
    assert(ast.type === 'grammar', "not a grammar");
    assert(ast.rules.length > 0, "no rules");
    this.literals = ast.literals;
    this.expectations = ast.expectations;
  }

  // ..........................................................
  add(ruleName, lOpcodes) {
    assert(typeof ruleName === 'string', "not a string");
    assert(Array.isArray(lOpcodes), "not an array");
    assert(!this.hRules[ruleName], `rule ${ruleName} already defined`);
    this.lRuleNames.push(ruleName);
    this.hRules[ruleName] = lOpcodes;
  }

  // ..........................................................
  getOpInfo(op, pos) {
    switch (op) {
      case 35:
        return ['PUSH_EMPTY_STRING', [], []];
      case 5:
        return ['PUSH_CUR_POS', [], []];
      case 1:
        return ['PUSH_UNDEFINED', [], []];
      case 2:
        return ['PUSH_NULL', [], []];
      case 3:
        return ['PUSH_FAILED', [], []];
      case 4:
        return ['PUSH_EMPTY_ARRAY', [], []];
      case 6:
        return ['POP', [], []];
      case 7:
        return ['POP_CUR_POS', [], []];
      case 8:
        return ['POP_N', ['/'], []];
      case 9:
        return ['NIP', [], []];
      case 10:
        return ['APPEND', [], []];
      case 11:
        return ['WRAP', [''], []];
      case 12:
        return ['TEXT', [], []];
      case 36:
        return ['PLUCK', ['/', '/', '/', 'p'], []];
      case 13:
        return ['IF', [], ['THEN', 'ELSE']];
      case 14:
        return ['IF_ERROR', [], ['THEN', 'ELSE']];
      case 15:
        return ['IF_NOT_ERROR', [], ['THEN', 'ELSE']];
      case 30:
        return ['IF_LT', [], ['THEN', 'ELSE']];
      case 31:
        return ['IF_GE', [], ['THEN', 'ELSE']];
      case 32:
        return ['IF_LT_DYNAMIC', [], ['THEN', 'ELSE']];
      case 33:
        return ['IF_GE_DYNAMIC', [], ['THEN', 'ELSE']];
      case 16:
        return ['WHILE_NOT_ERROR', [], ['THEN']];
      case 17:
        return ['MATCH_ANY', [], ['THEN', 'ELSE']];
      case 18:
        return ['MATCH_STRING', ['/lit'], ['THEN', 'ELSE']];
      case 19:
        return ['MATCH_STRING_IC', ['/lit'], ['THEN', 'ELSE']];
      case 20:
        return ['MATCH_CHAR_CLASS', ['/class'], []];
      case 21:
        return ['ACCEPT_N', ['/num'], []];
      case 22:
        return ['ACCEPT_STRING', ['/lit'], []];
      case 23:
        return ['FAIL', ['/expectation'], []];
      case 24:
        return ['LOAD_SAVED_POS', ['pos/num'], []];
      case 25:
        return ['UPDATE_SAVED_POS', ['pos/num'], []];
      case 26:
        return ['CALL', [], []];
      case 27:
        return ['RULE', ['/rule'], []];
      case 37:
        return ['SOURCE_MAP_PUSH', [], []];
      case 38:
        return ['SOURCE_MAP_POP', [], []];
      case 39:
        return ['SOURCE_MAP_LABEL_PUSH', [], []];
      case 40:
        return ['SOURCE_MAP_LABEL_POP', [], []];
      default:
        return [`OPCODE ${op}`, [], []];
    }
  }

  // ..........................................................
  argStr(arg, infoStr) {
    var hExpect, label, result, type, value;
    if (infoStr === '/') {
      return arg.toString();
    }
    [label, type] = infoStr.split('/');
    switch (type) {
      case 'rule':
        if (arg < this.lRuleNames.length) {
          result = `<${this.lRuleNames[arg]}>`;
        } else {
          result = `<#${arg}>`;
        }
        break;
      case 'lit':
        result = `'${this.literals[arg]}'`;
        break;
      case 'num':
      case 'i':
        result = arg.toString();
        break;
      case 'expectation':
        hExpect = this.expectations[arg];
        if (defined(hExpect)) {
          ({type, value} = hExpect);
          switch (type) {
            case 'literal':
              result = `\"${value}\"`;
              break;
            case 'class':
              result = "[..]";
              break;
            case 'any':
              result = '.';
              break;
            default:
              result = `Unknown expectation type: ${type}`;
          }
        } else {
          result = 'hExpect = undef';
        }
        break;
      case 'block':
        if (label) {
          result = `${label}:${arg}`;
        } else {
          result = `BLOCK: ${arg}`;
        }
        break;
      case 'class':
        if (label) {
          result = `${label}:[${arg}]`;
        } else {
          result = `CLASS: ${arg}`;
        }
        break;
      default:
        result = `<UNKNOWN>: ${OL(arg)}`;
    }
    if (this.detailed) {
      return `(${arg}) ${result}`;
    } else {
      return result;
    }
  }

  // ..........................................................
  opStr(lOpcodes) {
    debugger;
    var blockBase, blockLen, i, j, lArgDesc, lArgInfo, lArgs, lBlockInfo, lLines, lSubOps, label, len, name, numArgs, op, pos;
    lLines = [];
    pos = 0;
    while (pos < lOpcodes.length) {
      op = lOpcodes[pos];
      pos += 1;
      [name, lArgInfo, lBlockInfo] = this.getOpInfo(op, pos);
      numArgs = lArgInfo.length;
      if (numArgs === 0) {
        if (this.detailed) {
          lLines.push(`(${op}) ${name}`);
        } else {
          lLines.push(`${name}`);
        }
      } else {
        lArgs = lOpcodes.slice(pos, pos + numArgs);
        pos += numArgs;
        lArgDesc = lArgs.map((arg, i) => {
          return this.argStr(arg, lArgInfo[i]);
        });
        if (this.detailed) {
          lLines.push(`(${op}) ${name} ${lArgDesc.join(' ')}`);
        } else {
          lLines.push(`${name} ${lArgDesc.join(' ')}`);
        }
      }
      blockBase = pos + lBlockInfo.length;
      for (i = j = 0, len = lBlockInfo.length; j < len; i = ++j) {
        label = lBlockInfo[i];
        blockLen = lOpcodes[pos];
        pos += 1;
        switch (label) {
          case 'ELSE':
            if (blockLen > 0) {
              lLines.push('ELSE');
            }
            break;
          case 'THEN':
            pass();
            break;
          default:
            croak(`Bad block label: ${label}`);
        }
        lSubOps = lOpcodes.slice(blockBase, blockBase + blockLen);
        lLines.push(indented(this.opStr(lSubOps)));
        blockBase += blockLen;
      }
      pos = blockBase;
    }
    return lLines.join("\n");
  }

  // ..........................................................
  getBlock() {
    var block, j, lOpcodes, lParts, len, ref, ruleName;
    lParts = [];
    ref = Object.keys(this.hRules);
    for (j = 0, len = ref.length; j < len; j++) {
      ruleName = ref[j];
      lParts.push(`<${ruleName}>`);
      lOpcodes = this.hRules[ruleName];
      block = this.opStr(lOpcodes).trimEnd();
      if (block !== '') {
        lParts.push(indented(block));
      }
      lParts.push('');
    }
    return lParts.join("\n").trimEnd();
  }

};

// --------------------------------------------------------------------------
export var OpDumper = class OpDumper {
  constructor(hOptions = {}) {
    var ignore;
    ({ignore} = getOptions(hOptions, {
      ignore: [37, 38, 39, 40]
    }));
    this.lIgnore = ignore;
    this.level = 0;
    this.lLines = [];
  }

  // ..........................................................
  setStack(stack) {
    this.stack = stack;
  }

  // ..........................................................
  incLevel() {
    return this.level += 1;
  }

  decLevel() {
    return this.level -= 1;
  }

  // ..........................................................
  out(str) {
    this.lLines.push("  ".repeat(this.level) + str);
  }

  // ..........................................................
  outOp(index, op) {
    if (!this.lIgnore.includes(op)) {
      return this.out(`OP[${lpad(index, 2)}]: ${lpad(op, 2)} ${this.getName(op)}`);
    }
  }

  // ..........................................................
  outBC(lByteCodes) {
    return;
    // --- For now, don't output anything
    this.out('OPCODES: ' + lByteCodes.filter((x) => {
      return !this.lIgnore.includes(x);
    }).map((x) => {
      return x.toString();
    }).join(' '));
  }

  // ..........................................................
  outCode(lLines, label) {
    var j, len, line;
    lLines = BOX(toBlock(lLines), label, {
      echo: false,
      asArray: true
    });
    for (j = 0, len = lLines.length; j < len; j++) {
      line = lLines[j];
      this.out(line);
    }
  }

  // ..........................................................
  getBlock() {
    return this.lLines.join("\n");
  }

  // ..........................................................
  getName(op) {
    switch (op) {
      case 0:
        return 'PUSH';
      case 35:
        return 'PUSH_EMPTY_STRING';
      case 1:
        return 'PUSH_UNDEFINED';
      case 2:
        return 'PUSH_NULL';
      case 3:
        return 'PUSH_FAILED';
      case 4:
        return 'PUSH_EMPTY_ARRAY';
      case 5:
        return 'PUSH_CURR_POS';
      case 6:
        return 'POP';
      case 7:
        return 'POP_CURR_POS';
      case 8:
        return 'POP_N';
      case 9:
        return 'NIP';
      case 10:
        return 'APPEND';
      case 11:
        return 'WRAP';
      case 12:
        return 'TEXT';
      case 36:
        return 'PLUCK';
      // ---  Conditions and Loops
      case 13:
        return 'IF';
      case 14:
        return 'IF_ERROR';
      case 15:
        return 'IF_NOT_ERROR';
      case 30:
        return 'IF_LT';
      case 31:
        return 'IF_GE';
      case 32:
        return 'IF_LT_DYNAMIC';
      case 33:
        return 'IF_GE_DYNAMIC';
      case 16:
        return 'WHILE_NOT_ERROR';
      // ---  Matching
      case 17:
        return 'MATCH_ANY';
      case 18:
        return 'MATCH_STRING';
      case 19:
        return 'MATCH_STRING_IC';
      case 20:
        return 'MATCH_CHAR_CLASS';
      case 20:
        return 'MATCH_REGEXP';
      case 21:
        return 'ACCEPT_N';
      case 22:
        return 'ACCEPT_STRING';
      case 23:
        return 'FAIL';
      // ---  Calls
      case 24:
        return 'LOAD_SAVED_POS';
      case 25:
        return 'UPDATE_SAVED_POS';
      case 26:
        return 'CALL';
      // ---  Rules
      case 27:
        return 'RULE';
      case 41:
        return 'LIBRARY_RULE';
      // ---  Failure Reporting
      case 28:
        return 'SILENT_FAILS_ON';
      case 29:
        return 'SILENT_FAILS_OFF';
      case 37:
        return 'SOURCE_MAP_PUSH';
      case 38:
        return 'SOURCE_MAP_POP';
      case 39:
        return 'SOURCE_MAP_LABEL_PUSH';
      case 40:
        return 'SOURCE_MAP_LABEL_POP';
      default:
        return '<UNKNOWN>';
    }
  }

};

// ---------------------------------------------------------------------------
export var BaseTracer = class BaseTracer {
  constructor(hOptions = {}) {
    var h, j, len, ref, rule;
    h = getOptions(hOptions, {
      posType: 'linecol',
      lIgnore: ['_'],
      lIgnoreSubs: []
    });
    this.hOptions = h;
    this.posType = h.posType;
    this.lIgnoreSubs = h.lIgnoreSubs;
    this.lIgnore = h.lIgnore;
    ref = this.lIgnore;
    for (j = 0, len = ref.length; j < len; j++) {
      rule = ref[j];
      if (!this.lIgnoreSubs.includes(rule)) {
        this.lIgnoreSubs.push(rule);
      }
    }
    this.lStack = []; // stack of rule names
  }

  
    // ..........................................................
  traceIt(hInfo) {
    var action, category, i, j, k, len, len1, ref, ref1, rule, type;
    ({type, rule} = hInfo);
    [category, action] = type.split('.');
    // --- NOTE: Any rule name in @lIgnore
    //           will also be in @lIgnoreSubs
    if (this.lIgnore.includes(rule)) {
      if (category === 'rule') {
        return false;
      }
    }
    if ((category === 'rule') && ((action === 'match') || (action === 'fail'))) {
      ref = this.lStack;
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        rule = ref[i];
        if (this.lIgnoreSubs.includes(rule) && (i !== this.lStack.length - 1)) {
          return false;
        }
      }
    } else {
      ref1 = this.lStack;
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        rule = ref1[k];
        if (this.lIgnoreSubs.includes(rule)) {
          return false;
        }
      }
    }
    return true;
  }

  // ..........................................................
  destroy() {}

  // ..........................................................
  adjustStack(hInfo) {
    var rule, type;
    ({type, rule} = hInfo);
    switch (type) {
      case 'rule.enter':
        this.lStack.push(rule);
        break;
      case 'rule.fail':
      case 'rule.match':
        this.lStack.pop();
    }
  }

  // ..........................................................
  trace(hInfo) {}

  // ..........................................................
  posStr(location, posType = undef) {
    var e, ec, el, eo, s, sc, sl, so;
    if (notdefined(posType)) {
      posType = this.posType;
    }
    if (notdefined(location) || !isHash(location)) {
      return rpad('unknown', 12);
    }
    ({
      start: s,
      end: e
    } = location);
    sl = zpad(s.line);
    sc = zpad(s.column);
    so = zpad(s.offset);
    el = zpad(e.line);
    ec = zpad(e.column);
    eo = zpad(e.offset);
    if ((sl === 1) && (el === 1)) {
      return posStr(location, 'offset');
    }
    switch (this.posType) {
      case 'linecol':
        if (so === eo) {
          return `${sl}:${sc}`;
        } else {
          return `${sl}:${sc}-${el}:${ec}`;
        }
        break;
      case 'offset':
        if (so === eo) {
          return `${so}`;
        } else {
          return `${so}-${eo}`;
        }
        break;
      default:
        if (so === eo) {
          return `${sl}:${sc}:${so}`;
        } else {
          return `${sl}:${sc}:${so}-${el}:${ec}:${eo}`;
        }
    }
  }

};

// ---------------------------------------------------------------------------
export var RawTracer = class RawTracer extends BaseTracer {
  trace(hInfo) {
    this.adjustStack(hInfo);
    return console.log(JSON.stringify(hInfo, null, 3));
  }

};

// ---------------------------------------------------------------------------
export var DebugTracer = class DebugTracer extends BaseTracer {
  constructor(hOptions = {}) {
    super(hOptions);
    this.tt = new TextTable('l l l l l');
    this.tt.fullsep();
    this.tt.labels(words('type rule result details position'));
    this.tt.sep();
  }

  trace(hInfo) {
    var details, location, result, rule, type;
    this.adjustStack(hInfo);
    ({type, rule, result, details, location} = hInfo);
    this.tt.data([type, rule, JSON.stringify(result), details, this.posStr(location)]);
  }

  destroy() {
    return console.log(this.tt.asString());
  }

};

// ---------------------------------------------------------------------------
export var AdvancedTracer = class AdvancedTracer extends BaseTracer {
  traceStr(hInfo, level = 0) {
    var action, details, endPos, locStr, location, obj, pre, ref, ref1, result, rule, startPos, type;
    ({type, rule, location, result, details} = hInfo);
    locStr = this.posStr(location);
    startPos = location != null ? (ref = location.start) != null ? ref.offset : void 0 : void 0;
    endPos = location != null ? (ref1 = location.end) != null ? ref1.offset : void 0 : void 0;
    [obj, action] = type.split('.');
    switch (action) {
      case 'enter':
        assert(obj === 'rule', `obj=${obj}, act=${action}`);
        pre = "│  ".repeat(level);
        return `${pre}? ${rule}`;
      case 'match':
        if (obj === 'rule') {
          pre = "│  ".repeat(level - 1) + "└─>";
        } else {
          pre = "│  ".repeat(level);
        }
        if (defined(result)) {
          if (defined(endPos)) {
            return `${pre} ${OL(result)} (pos -> ${endPos})`;
          } else {
            return `${pre} ${OL(result)}`;
          }
        } else {
          if (defined(endPos)) {
            return `${pre} YES (pos=${endPos})`;
          } else {
            return `${pre} YES`;
          }
        }
        break;
      case 'fail':
        if (obj === 'rule') {
          pre = "│  ".repeat(level - 1) + "└─> FAIL";
          if (defined(location)) {
            return ` ${pre} (at ${locStr})`;
          } else {
            return ` ${pre}`.trim();
          }
        } else {
          pre = "│  ".repeat(level - 1) + "x  ";
          if (defined(location)) {
            return `${pre} ${obj} ${OL(details)} (at ${locStr})`;
          } else {
            return `${pre} ${obj}`;
          }
        }
        break;
      default:
        return `UNKNOWN type: ${type}`;
    }
  }

  // ..........................................................
  trace(hInfo) {
    debugger;
    var j, len, result, str;
    if (this.traceIt(hInfo)) {
      result = this.traceStr(hInfo, this.lStack.length);
      if (isString(result)) {
        console.log(result);
      } else if (isArray(result)) {
        for (j = 0, len = result.length; j < len; j++) {
          str = result[j];
          console.log(str);
        }
      }
    }
    this.adjustStack(hInfo);
  }

};

// ---------------------------------------------------------------------------
export var DetailedTracer = class DetailedTracer extends AdvancedTracer {
  constructor(input, hOptions = {}) {
    super(hOptions);
    this.input = input;
    this.input = this.hOptions.input;
    this.hVars = this.hOptions.hVars;
  }

  // ..........................................................
  varStr() {
    var j, lParts, len, ref, value, varname;
    if (isEmpty(this.hVars)) {
      return '';
    }
    lParts = [];
    ref = keys(this.hVars);
    for (j = 0, len = ref.length; j < len; j++) {
      varname = ref[j];
      value = this.hVars[varname]();
      lParts.push(`${varname} = ${OL(value)}`);
    }
    if (lParts.length === 0) {
      return '';
    } else {
      return ' (' + lParts.join(',') + ')';
    }
  }

  // ..........................................................
  traceStr(hInfo, level) {
    var location, offset, result, rule, str, type;
    str = super.traceStr(hInfo);
    if ((hInfo.type !== 'rule.fail') || isEmpty(this.input)) {
      return str;
    }
    ({type, rule, location, result} = hInfo);
    if (defined(location)) {
      ({offset} = location.start);
      return [str, `${escapeStr(this.input, 'esc', {offset})}${this.varStr()}`];
    } else {
      return [str, `${escapeStr(this.input, 'esc')}${this.varStr()}`];
    }
  }

};

// ---------------------------------------------------------------------------
// --- tracer can be:
//        - undef
//        - a string: 'none', 'debug', 'peggy','advanced','detailed'
//        - an object with a function property named 'trace'
//        - a function
export var getTracer = (tracer = 'advanced', hOptions = {}) => {
  var option;
  hOptions = getOptions(hOptions, {
    input: undef,
    lIgnore: ['_'],
    lIgnoreSubs: [],
    hVars: {}
  });
  switch (typeof tracer) {
    case 'undefined':
      return new BaseTracer(hOptions);
    case 'object':
      if (defined(tracer)) {
        return tracer;
      } else {
        return new BaseTracer(hOptions);
      }
      break;
    case 'function':
      return {
        trace: tracer
      };
    case 'string':
      [tracer, option] = tracer.split('/');
      if (option) {
        hOptions.posType = option;
      }
      switch (tracer) {
        case 'raw':
          return new RawTracer(hOptions);
        case 'debug':
          return new DebugTracer(hOptions);
        case 'advanced':
          return new AdvancedTracer(hOptions);
        case 'detailed':
          return new DetailedTracer(hOptions);
        case 'peggy':
          return undef;
        default:
          return new BaseTracer(hOptions);
      }
  }
};

//# sourceMappingURL=peggy.js.map
