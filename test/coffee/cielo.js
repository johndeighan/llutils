  // cielo.coffee
import {
  undef,
  defined,
  notdefined,
  getOptions,
  OL,
  assert,
  gen2block,
  isString
} from '@jdeighan/llutils';

import {
  indented,
  splitLine
} from '@jdeighan/llutils/indent';

import {
  barf,
  isFile,
  withExt,
  readTextFile
} from '@jdeighan/llutils/fs';

import {
  brew
} from '@jdeighan/llutils/llcoffee';

import {
  LineFetcher
} from '@jdeighan/llutils/fetcher';

import {
  replaceHereDocs
} from '@jdeighan/llutils/heredoc';

// ---------------------------------------------------------------------------
export var bless = function(code, hMetaData = {}) {
  assert(isString(code), `code: ${OL(code)}`);
  hMetaData.preprocess = cieloPreProcess;
  return brew(code, hMetaData);
};

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

//# sourceMappingURL=cielo.js.map
