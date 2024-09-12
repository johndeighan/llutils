  // cielo.coffee
import {
  undef,
  defined,
  notdefined,
  getOptions,
  assert,
  croak
} from '@jdeighan/llutils';

import {
  procCoffee
} from '@jdeighan/llutils/coffee';

import {
  LineFetcher
} from '@jdeighan/llutils/fetcher';

import {
  indented,
  splitLine
} from '@jdeighan/llutils/indent';

import {
  replaceHereDocs
} from '@jdeighan/llutils/heredoc';

// ---------------------------------------------------------------------------
export var procCielo = function(code, hMetaData = {}, filePath = undef) {
  var coffeeCode;
  coffeeCode = cieloPreProcess(code, hMetaData, filePath);
  return procCoffee(coffeeCode, hMetaData, filePath);
};

// ---------------------------------------------------------------------------
export var cieloPreProcess = (code, hMetaData = {}, filePath = undef) => {
  var debug, lLines, level, src, str;
  ({debug} = getOptions(hMetaData, {
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

//# sourceMappingURL=cielo.js.map
