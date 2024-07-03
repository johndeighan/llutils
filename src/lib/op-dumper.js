// op-dumper.coffee
import fs from 'node:fs';

import {
  undef,
  defined,
  notdefined,
  isString,
  getOptions,
  assert,
  croak,
  range,
  centered,
  lpad,
  toBlock
} from '@jdeighan/llutils';

import {
  indented,
  undented
} from '@jdeighan/llutils/indent';

import {
  DUMP,
  BOX
} from '@jdeighan/llutils/dump';

// --------------------------------------------------------------------------
export var OpDumper = class OpDumper {
  constructor(hOptions = {}) {
    var ignore;
    ({ignore} = getOptions(hOptions, {
      ignore: [37, 38, 39, 40]
    }));
    this.lIgnore = ignore;
    this.level = 0;
    this.lLines = [];
  }

  // ..........................................................
  setStack(stack) {
    this.stack = stack;
  }

  // ..........................................................
  incLevel() {
    return this.level += 1;
  }

  decLevel() {
    return this.level -= 1;
  }

  // ..........................................................
  out(str) {
    this.lLines.push("  ".repeat(this.level) + str);
  }

  // ..........................................................
  outOp(index, op) {
    if (!this.lIgnore.includes(op)) {
      return this.out(`OP[${lpad(index, 2)}]: ${lpad(op, 2)} ${this.getName(op)}`);
    }
  }

  // ..........................................................
  outBC(lByteCodes) {
    return;
    // --- For now, don't output anything
    this.out('OPCODES: ' + lByteCodes.filter((x) => {
      return !this.lIgnore.includes(x);
    }).map((x) => {
      return x.toString();
    }).join(' '));
  }

  // ..........................................................
  outCode(lLines, label) {
    var i, len, line;
    lLines = BOX(toBlock(lLines), label, {
      echo: false,
      asArray: true
    });
    for (i = 0, len = lLines.length; i < len; i++) {
      line = lLines[i];
      this.out(line);
    }
  }

  // ..........................................................
  getBlock() {
    return this.lLines.join("\n");
  }

  // ..........................................................
  writeTo(filePath) {
    console.log(`Writing opcodes to ${filePath}`);
    fs.writeFileSync(filePath, this.getBlock());
  }

  // ..........................................................
  getName(op) {
    switch (op) {
      case 0:
        return 'PUSH';
      case 35:
        return 'PUSH_EMPTY_STRING';
      case 1:
        return 'PUSH_UNDEFINED';
      case 2:
        return 'PUSH_NULL';
      case 3:
        return 'PUSH_FAILED';
      case 4:
        return 'PUSH_EMPTY_ARRAY';
      case 5:
        return 'PUSH_CURR_POS';
      case 6:
        return 'POP';
      case 7:
        return 'POP_CURR_POS';
      case 8:
        return 'POP_N';
      case 9:
        return 'NIP';
      case 10:
        return 'APPEND';
      case 11:
        return 'WRAP';
      case 12:
        return 'TEXT';
      case 36:
        return 'PLUCK';
      // ---  Conditions and Loops
      case 13:
        return 'IF';
      case 14:
        return 'IF_ERROR';
      case 15:
        return 'IF_NOT_ERROR';
      case 30:
        return 'IF_LT';
      case 31:
        return 'IF_GE';
      case 32:
        return 'IF_LT_DYNAMIC';
      case 33:
        return 'IF_GE_DYNAMIC';
      case 16:
        return 'WHILE_NOT_ERROR';
      // ---  Matching
      case 17:
        return 'MATCH_ANY';
      case 18:
        return 'MATCH_STRING';
      case 19:
        return 'MATCH_STRING_IC';
      case 20:
        return 'MATCH_CHAR_CLASS';
      case 20:
        return 'MATCH_REGEXP';
      case 21:
        return 'ACCEPT_N';
      case 22:
        return 'ACCEPT_STRING';
      case 23:
        return 'FAIL';
      // ---  Calls
      case 24:
        return 'LOAD_SAVED_POS';
      case 25:
        return 'UPDATE_SAVED_POS';
      case 26:
        return 'CALL';
      // ---  Rules
      case 27:
        return 'RULE';
      case 41:
        return 'LIBRARY_RULE';
      // ---  Failure Reporting
      case 28:
        return 'SILENT_FAILS_ON';
      case 29:
        return 'SILENT_FAILS_OFF';
      case 37:
        return 'SOURCE_MAP_PUSH';
      case 38:
        return 'SOURCE_MAP_POP';
      case 39:
        return 'SOURCE_MAP_LABEL_PUSH';
      case 40:
        return 'SOURCE_MAP_LABEL_POP';
      default:
        return '<UNKNOWN>';
    }
  }

};

//# sourceMappingURL=op-dumper.js.map
