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

import {
  brew,
  brewFile
} from '@jdeighan/llutils/llcoffee';

export {
  brew,
  brewFile
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
