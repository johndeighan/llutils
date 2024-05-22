// coffee.coffee
import fs from 'fs';

import CoffeeScript from 'coffeescript';

import {
  undef,
  defined,
  notdefined,
  gen2block,
  words,
  assert,
  croak,
  DUMP,
  OL,
  isString,
  isArray,
  isHash,
  removeKeys
} from '@jdeighan/llutils';

import {
  readTextFile,
  barf,
  withExt,
  isFile
} from '@jdeighan/llutils/fs';

// ---------------------------------------------------------------------------
export var brew = function(code, hMetaData = {}, filePath = undef) {
  var js, shebang, v3SourceMap;
  // --- metadata is used to add a shebang line
  //     if true, use "#!/usr/bin/env node"
  //     else use value of shebang key
  // --- filePath is used to check for a source map
  //     without it, no source map is produced
  assert(isString(code), `code: ${OL(code)}`);
  if (defined(filePath)) {
    ({js, v3SourceMap} = CoffeeScript.compile(code, {
      sourceMap: true,
      bare: true,
      header: false,
      filename: filePath
    }));
  } else {
    js = CoffeeScript.compile(code, {
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
  ({js, sourceMap} = brew(code, hMetaData, filePath));
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
export var toAST = function(code, hOptions = {
    minimal: true
  }) {
  var hAST;
  hAST = CoffeeScript.compile(code, {
    ast: true
  });
  if (hOptions.minimal) {
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
