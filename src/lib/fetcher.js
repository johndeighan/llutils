  // fetcher.coffee
import {
  undef,
  defined,
  notdefined,
  OL,
  escapeStr,
  blockToArray,
  arrayToBlock,
  getOptions,
  assert,
  croak,
  isEmpty,
  nonEmpty
} from '@jdeighan/llutils';

import {
  DUMP
} from '@jdeighan/llutils/dump';

import {
  indentLevel,
  indented,
  undented,
  splitLine
} from '@jdeighan/llutils/indent';

// ---------------------------------------------------------------------------
// --- extract string => transform string => filter => return
export var LineFetcher = class LineFetcher {
  constructor(block1, hOptions = {}) {
    this.block = block1;
    ({
      debug: this.debug
    } = getOptions(hOptions, {
      debug: false
    }));
    this.curPos = 0;
    this.buffer = undef;
  }

  // ..........................................................
  EOF() {
    if (this.curPos === -1) {
      return true;
    }
    this.fillBuffer();
    return (this.curPos === -1) && notdefined(this.buffer);
  }

  // ..........................................................
  moreLines() {
    return defined(this.peek());
  }

  // ..........................................................
  transform(str) {
    return str.replaceAll("\r", "");
  }

  // ..........................................................
  filter(str) {
    return true;
  }

  // ..........................................................
  // --- extract the next string, advancing @curPos
  //     transform string and return result
  extract() {
    var nlPos, str;
    assert(this.curPos >= 0, "extract() when EOF");
    nlPos = this.block.indexOf("\n", this.curPos);
    if (nlPos === -1) {
      str = this.block.substring(this.curPos);
      this.curPos = -1;
    } else {
      str = this.block.substring(this.curPos, nlPos);
      this.curPos = nlPos + 1;
    }
    return this.transform(str);
  }

  // ..........................................................
  fillBuffer() {
    var str;
    while ((this.curPos >= 0) && notdefined(this.buffer)) {
      str = this.extract();
      if (this.filter(str)) {
        this.buffer = str;
      }
    }
  }

  // ..........................................................
  peek() {
    if (notdefined(this.buffer)) {
      this.fillBuffer();
    }
    return this.buffer; // will be undef if at EOF
  }

  
    // ..........................................................
  fetch() {
    var item;
    item = this.peek();
    this.buffer = undef;
    return item;
  }

  // ..........................................................
  skip() {
    this.fetch();
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
  dump(label = 'BLOCK') {
    DUMP(this.block, label);
  }

};

// ---------------------------------------------------------------------------
// --- Returns pairs, e.g. [3, 'abc']
export var PLLFetcher = class PLLFetcher extends LineFetcher {
  transform(line) {
    return splitLine(line);
  }

  // ..........................................................
  filter([level, str]) {
    return (level > 0) || nonEmpty(str);
  }

  // ..........................................................
  peekLevel() {
    var result;
    result = this.peek();
    if (notdefined(result)) {
      return -1;
    }
    return result[0];
  }

  // ..........................................................
  getBlock(level) {
    var lLines, lvl, str;
    lLines = [];
    while (this.peekLevel() >= level) {
      [lvl, str] = this.fetch();
      lLines.push(indented(str, lvl - level));
    }
    return lLines.join("\n");
  }

};

//# sourceMappingURL=fetcher.js.map
