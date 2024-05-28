  // cielo.coffee
import {
  undef,
  defined,
  notdefined,
  getOptions,
  OL,
  assert,
  gen2block
} from '@jdeighan/llutils';

import {
  indented,
  splitLine
} from '@jdeighan/llutils/indent';

import {
  barf,
  isFile,
  withExt
} from '@jdeighan/llutils/fs';

import {
  brew
} from '@jdeighan/llutils/coffee';

import {
  LineFetcher
} from '@jdeighan/llutils/fetcher';

import {
  replaceHereDocs
} from '@jdeighan/llutils/heredoc';

// ---------------------------------------------------------------------------
export var cieloPreProcess = (code, hOptions) => {
  var debug, lLines, level, src, str;
  ({debug} = getOptions(hOptions, {
    debug: false
  }));
  if (debug) {
    console.log("IN cieloPreProcess()");
  }
  lLines = [];
  src = new LineFetcher(code);
  while (src.moreLines()) {
    [level, str] = splitLine(src.fetch());
    if ((level === 0) && (str === '__END__')) {
      break;
    }
    if (debug) {
      console.log(`GOT: ${OL(str)} at level ${level}`);
    }
    str = replaceHereDocs(level, str, src);
    lLines.push(indented(str, level));
  }
  return lLines.join("\n");
};

// ---------------------------------------------------------------------------
export var bless = function(code, hMetaData = {}, hOptions = {}) {
  assert(isString(code), `code: ${OL(code)}`);
  hOptions.preprocess = cieloPreProcess;
  return brew(code, hMetaData, hOptions);
};

// ---------------------------------------------------------------------------
export var blessFile = function(filePath) {
  var code, hMetaData, js, reader, sourceMap;
  assert(isFile(filePath), `No such file: ${filePath}`);
  ({hMetaData, reader} = readTextFile(filePath));
  code = gen2block(reader);
  ({js, sourceMap} = bless(code, hMetaData, {filePath}));
  barf(js, withExt(filePath, '.js'));
  barf(sourceMap, withExt(filePath, '.js.map'));
  return {js, sourceMap};
};

// ---------------------------------------------------------------------------

//# sourceMappingURL=cielo.js.map
