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
  DUMP,
  OL,
  dclone,
  getOptions,
  listdiff,
  isString,
  isArray,
  isHash,
  isFunction,
  removeKeys
} from '@jdeighan/llutils';

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
  ASTWalker
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
    removeKeys(hAST, words('loc range extra start end', 'directives comments tokens'));
  }
  return hAST;
};

// ---------------------------------------------------------------------------
export var removeExtraASTKeys = (hAST) => {
  removeKeys(hAST, words('loc range extra start end', 'directives comments tokens'));
  return hAST;
};

// ---------------------------------------------------------------------------
export var toASTFile = function(code, filePath, hOptions = {}) {
  var hAST;
  hAST = toAST(code, hOptions);
  barfAST(hAST, filePath);
};

//# sourceMappingURL=coffee.js.map
