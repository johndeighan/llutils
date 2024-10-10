  // text-block.coffee
import {
  undef,
  defined,
  notdefined,
  getOptions,
  toBlock,
  toArray,
  rpad,
  escapeStr,
  assert,
  croak,
  untabify,
  isString,
  OL,
  pass,
  centered
} from '@jdeighan/llutils';

// ---------------------------------------------------------------------------
export var TextBlock = class TextBlock {
  constructor(hOptions = {}) {
    this.hOptions = getOptions(hOptions, {
      untabify: true
    });
    this.maxLen = 0;
    this.lLines = [];
  }

  getLines() {
    return this.lLines;
  }

  getBlock() {
    return toBlock(this.lLines);
  }

  // ..........................................................
  append(block) {
    var j, len, ref, str;
    assert(isString(block), `Not a string: ${OL(block)}`);
    ref = toArray(block);
    for (j = 0, len = ref.length; j < len; j++) {
      str = ref[j];
      if (this.hOptions.untabify) {
        str = untabify(str, '!strict');
      }
      if (str.length > this.maxLen) {
        this.maxLen = str.length;
      }
      this.lLines.push(str);
    }
  }

  // ..........................................................
  prepend(block) {
    var j, len, ref, str;
    assert(isString(block), `Not a string: ${OL(block)}`);
    ref = toArray(block).reverse();
    for (j = 0, len = ref.length; j < len; j++) {
      str = ref[j];
      if (str.length > this.maxLen) {
        this.maxLen = str.length;
      }
      this.lLines.unshift(str);
    }
  }

};

// ---------------------------------------------------------------------------
export var TextBlockList = class TextBlockList {
  constructor(hOptions = {}) {
    hOptions = getOptions(hOptions, {
      esc: false
    });
    this.esc = hOptions.esc; // --- escape each string?
    this.lLabels = [];
    this.lBlocks = [];
    this.maxLen = 0;
    this.maxLabelLen = 0;
  }

  // ..........................................................
  numBlocks() {
    assert(this.lLabels.length === this.lBlocks.length, "num blocks <> num labels");
    return this.lBlocks.length;
  }

  // ..........................................................
  addBlock(label, str = undef) {
    var block;
    assert(isString(label), `Not a string: ${OL(label)}`);
    assert(label.length > 0, "Zero length label");
    if (label.length > this.maxLabelLen) {
      this.maxLabelLen = label.length;
    }
    this.lLabels.push(label);
    block = new TextBlock();
    if (defined(str)) {
      block.append(str);
      if (block.maxLen > this.maxLen) {
        this.maxLen = block.maxLen;
      }
    }
    this.lBlocks.push(block);
  }

  // ..........................................................
  curBlock() {
    assert(this.numBlocks > 0, "No blocks exist");
    return this.lBlocks.at(-1);
  }

  // ..........................................................
  append(str) {
    var block;
    block = this.curBlock();
    if (this.esc) {
      block.append(escapeStr(str, 'hEsc=escNoNL'));
    } else {
      block.append(str);
    }
    if (block.maxLen > this.maxLen) {
      this.maxLen = block.maxLen;
    }
  }

  // ..........................................................
  prepend(str) {
    var block;
    block = this.curBlock();
    if (this.esc) {
      block.prepend(escapeStr(str, 'hEsc=escNoNL'));
    } else {
      block.prepend(str);
    }
    if (block.maxLen > this.maxLen) {
      this.maxLen = block.maxLen;
    }
  }

  // ..........................................................
  asString(hOptions = {}) {
    var lLines;
    lLines = this.asArray(hOptions);
    return toBlock(lLines);
  }

  // ..........................................................
  asArray(hOptions = {}) {
    var block, format, hbar, i, j, k, l, lLines, lconn, len, len1, len2, len3, line, ll, lr, m, minWidth, rconn, ref, ref1, ref2, ref3, ul, ur, vbar, width;
    ({format, minWidth} = getOptions(hOptions, {
      format: 'dashes', // or 'box'
      minWidth: 40
    }));
    width = this.maxLen;
    if (width < this.maxLabelLen + 8) {
      width = this.maxLabelLen + 8;
    }
    if (width < minWidth) {
      width = minWidth;
    }
    lLines = []; // --- build lines
    switch (format) {
      case 'box':
        ul = '┌';
        ur = '┐';
        ll = '└';
        lr = '┘';
        vbar = '│';
        hbar = '─';
        lconn = '├';
        rconn = '┤';
        ref = this.lBlocks;
        for (i = j = 0, len = ref.length; j < len; i = ++j) {
          block = ref[i];
          if (i === 0) {
            lLines.push(ul + hbar + centered(this.lLabels[i], width, {
              char: hbar
            }) + hbar + ur);
          } else {
            lLines.push(lconn + hbar + centered(this.lLabels[i], width, {
              char: hbar
            }) + hbar + rconn);
          }
          ref1 = block.getLines();
          for (k = 0, len1 = ref1.length; k < len1; k++) {
            line = ref1[k];
            lLines.push(vbar + ' ' + rpad(line, width) + ' ' + vbar);
          }
        }
        lLines.push(ll + hbar.repeat(width + 2) + lr);
        break;
      default:
        ref2 = this.lBlocks;
        for (i = l = 0, len2 = ref2.length; l < len2; i = ++l) {
          block = ref2[i];
          lLines.push(centered(this.lLabels[i], width, 'char=-'));
          ref3 = block.getLines();
          for (m = 0, len3 = ref3.length; m < len3; m++) {
            line = ref3[m];
            lLines.push(line);
          }
        }
        lLines.push('-'.repeat(width));
    }
    return lLines;
  }

};

//# sourceMappingURL=text-block.js.map
