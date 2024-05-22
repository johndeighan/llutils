  // fetcher.coffee
import {
  undef,
  defined,
  notdefined,
  OL,
  escapeStr,
  DUMP,
  blockToArray,
  arrayToBlock,
  getOptions
} from '@jdeighan/llutils';

import {
  indentLevel,
  undented
} from '@jdeighan/llutils/indent';

// ---------------------------------------------------------------------------
export var Fetcher = class Fetcher {
  constructor(block, hOptions = {}) {
    var debug, filterFunc;
    ({filterFunc, debug} = getOptions(hOptions, {
      filterFunc: undef,
      debug: false
    }));
    this.lLines = blockToArray(block);
    if (defined(filterFunc)) {
      this.lLines = this.lLines.filter(filterFunc);
    }
    this.debug = debug;
  }

  // ..........................................................
  numLines() {
    return this.lLines.length;
  }

  // ..........................................................
  dump(label = 'BLOCK') {
    return DUMP(this.lLines, label);
  }

  // ..........................................................
  dbg(str, block = undef) {
    if (!this.debug) {
      return;
    }
    console.log(str);
    if (defined(block)) {
      console.log(block);
    }
  }

  // ..........................................................
  moreLines() {
    var result;
    result = this.lLines.length > 0;
    this.dbg(`MORE_LINES => ${OL(result)}`);
    return result;
  }

  // ..........................................................
  next() {
    if (this.lLines.length === 0) {
      this.dbg("NEXT => undef");
      return undef;
    } else {
      this.dbg(`NEXT => ${escapeStr(this.lLines[0])}`);
      return this.lLines[0];
    }
  }

  // ..........................................................
  nextLevel() {
    var level;
    if (this.next() === undef) {
      level = 0;
    } else {
      level = indentLevel(this.lLines[0]);
    }
    this.dbg(`NEXT LEVEL => ${OL(level)}`);
    return level;
  }

  // ..........................................................
  get() {
    var line;
    line = this.lLines.shift();
    this.dbg(`GET => ${escapeStr(line)}`);
    return line;
  }

  // ..........................................................
  skip() {
    this.lLines.shift();
    this.dbg("SKIP =>");
  }

  // ..........................................................
  // --- returns undented block
  getBlock(minLevel) {
    var block, lBlockLines;
    lBlockLines = (function() {
      var results;
      results = [];
      while (this.nextLevel() >= minLevel) {
        results.push(this.get());
      }
      return results;
    }).call(this);
    if (lBlockLines.length === 0) {
      this.dbg(`GET BLOCK (${minLevel}) => undef`);
      return undef;
    } else {
      block = arrayToBlock(undented(lBlockLines));
      this.dbg(`GET BLOCK (${minLevel}) =>`, block);
      return block;
    }
  }

};

//# sourceMappingURL=fetcher.js.map
