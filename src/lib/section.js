  // Section.coffee
import {
  undef,
  defined,
  toBlock,
  assert,
  croak,
  OL,
  isArray,
  isEmpty,
  isFunction,
  isInteger
} from '@jdeighan/llutils';

import {
  indented
} from '@jdeighan/llutils/indent';

// ---------------------------------------------------------------------------
export var Section = class Section {
  constructor(name, converter = undef) {
    this.name = name;
    this.converter = converter;
    // --- name can be undef or empty
    this.lLines = [];
    if (defined(this.converter)) {
      assert(isFunction(this.converter), `bad converter in section ${OL(this.name)}`);
    }
  }

  // ..........................................................
  isEmpty() {
    return this.lLines.length === 0;
  }

  // ..........................................................
  nonEmpty() {
    return this.lLines.length > 0;
  }

  // ..........................................................
  add(...lLines) {
    var i, j, k, len, len1, level, line;
    if (isInteger(lLines[0])) {
      level = lLines[0];
      for (i = j = 0, len = lLines.length; j < len; i = ++j) {
        line = lLines[i];
        if (i > 0) {
          this.lLines.push(indented(line, level));
        }
      }
    } else {
      for (k = 0, len1 = lLines.length; k < len1; k++) {
        line = lLines[k];
        this.lLines.push(line);
      }
    }
  }

  // ..........................................................
  prepend(...lLines) {
    var i, j, k, len, len1, level, line, ref, ref1;
    if (isInteger(lLines[0])) {
      level = lLines[0];
      ref = lLines.toReversed();
      for (i = j = 0, len = ref.length; j < len; i = ++j) {
        line = ref[i];
        if (i < lLines.length - 1) {
          this.lLines.unshift(indented(line, level));
        }
      }
    } else {
      ref1 = lLines.toReversed();
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        line = ref1[k];
        this.lLines.unshift(line);
      }
    }
  }

  // ..........................................................
  getParts() {
    return this.lLines;
  }

  // ..........................................................
  getBlock() {
    var block;
    if (this.lLines.length === 0) {
      return undef;
    }
    block = toBlock(this.lLines);
    if (defined(this.converter)) {
      block = this.converter(block);
    }
    return block;
  }

};

//# sourceMappingURL=section.js.map
