// coffee.coffee
import fs from 'fs';

import {
  compile
} from 'coffeescript';

import {
  pass,
  undef,
  defined,
  notdefined,
  gen2block,
  words,
  assert,
  croak,
  OL,
  dclone,
  getOptions,
  listdiff,
  isString,
  isArray,
  isHash,
  isFunction,
  keys,
  removeKeys
} from '@jdeighan/llutils';

import {
  DUMP
} from '@jdeighan/llutils/dump';

import {
  indented,
  splitLine
} from '@jdeighan/llutils/indent';

import {
  readTextFile,
  barf,
  withExt,
  isFile
} from '@jdeighan/llutils/fs';

import {
  LineFetcher
} from '@jdeighan/llutils/fetcher';

import {
  ASTWalker,
  removeExtraASTKeys
} from '@jdeighan/llutils/ast-walker';

import {
  replaceHereDocs
} from '@jdeighan/llutils/heredoc';

// ---------------------------------------------------------------------------
export var brew = function(code, hMetaData = {}, hOptions = {}) {
  var debug, filePath, js, preprocCode, preprocess, shebang, v3SourceMap;
  // --- metadata can be used to add a shebang line
  //     if true, use "#!/usr/bin/env node"
  //     else use value of shebang key

  // --- filePath is used to check for a source map
  //     without it, no source map is produced
  // --- if key preprocess is set, it must be a function
  //     that converts one block of code to another
  //     block of code
  assert(isString(code), `code: ${OL(code)}`);
  ({filePath, preprocess, debug} = getOptions(hOptions, {
    filePath: undef,
    preprocess: undef,
    debug: false
  }));
  if (defined(preprocess)) {
    assert(isFunction(preprocess), `Not a function: ${OL(preprocess)}`);
    if (debug) {
      console.log("pre-processing code");
    }
    preprocCode = preprocess(code, {debug});
    if (debug) {
      DUMP(preprocCode, 'PreProcessed code');
    }
  }
  if (defined(filePath)) {
    ({js, v3SourceMap} = compile(preprocCode || code, {
      sourceMap: true,
      bare: true,
      header: false,
      filename: filePath
    }));
  } else {
    js = compile(preprocCode || code, {
      bare: true,
      header: false
    });
    v3SourceMap = undef;
  }
  assert(defined(js), "No JS code generated");
  shebang = getShebang(hMetaData);
  if (defined(shebang)) {
    js = shebang + "\n" + js.trim();
  } else {
    js = js.trim();
  }
  return {
    orgCode: code,
    preprocCode,
    js,
    sourceMap: v3SourceMap
  };
};

// ---------------------------------------------------------------------------
export var brewFile = function(filePath) {
  var code, hMetaData, js, reader, sourceMap;
  assert(isFile(filePath), `No such file: ${filePath}`);
  ({hMetaData, reader} = readTextFile(filePath));
  code = gen2block(reader);
  ({js, sourceMap} = brew(code, hMetaData, {filePath}));
  barf(js, withExt(filePath, '.js'));
  barf(sourceMap, withExt(filePath, '.js.map'));
  return {js, sourceMap};
};

// ---------------------------------------------------------------------------
export var getShebang = (hMetaData) => {
  var shebang;
  shebang = hMetaData.shebang;
  if (defined(shebang)) {
    if (isString(shebang)) {
      return shebang;
    } else if (shebang) {
      return "#!/usr/bin/env node";
    }
  }
  return undef;
};

// ---------------------------------------------------------------------------
export var toAST = (coffeeCode, hOptions = {}) => {
  var hAST, minimal;
  ({minimal} = getOptions(hOptions, {
    minimal: false
  }));
  hAST = compile(coffeeCode, {
    ast: true
  });
  if (minimal) {
    removeExtraASTKeys(hAST);
  }
  return hAST;
};

// ---------------------------------------------------------------------------
export var toASTFile = function(code, filePath, hOptions = {}) {
  var hAST;
  hAST = toAST(code, hOptions);
  barfAST(hAST, filePath);
};

// ---------------------------------------------------------------------------
// --- Valid options:
//        debug - extensive debugging
//        hDumpNode - { <nodeType>: true, ... }
export var coffeeInfo = (hAST, hOptions = {}) => {
  var hImports, i, len, ref, src, walker;
  if (isString(hAST)) {
    hAST = toAST(hAST);
  }
  walker = new ASTWalker(hOptions).walk(hAST);
  // --- Convert sets to arrays
  hImports = {};
  ref = keys(walker.hImports);
  for (i = 0, len = ref.length; i < len; i++) {
    src = ref[i];
    hImports[src] = Array.from(walker.hImports[src].values());
  }
  return {
    hAST,
    trace: walker.getTrace(),
    hImports,
    lExports: Array.from(walker.setExports.values()),
    lUsed: Array.from(walker.setUsed.values()),
    lMissing: Array.from(walker.getMissing().values())
  };
};

//# sourceMappingURL=coffee.js.map
