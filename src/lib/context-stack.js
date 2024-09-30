  // context-stack.coffee
import {
  undef,
  defined,
  notdefined,
  OL,
  isArray,
  isHash,
  assert,
  croak
} from '@jdeighan/llutils';

import {
  DUMP
} from '@jdeighan/llutils/dump';

// ---------------------------------------------------------------------------
export var ContextStack = class ContextStack {
  constructor(obj) {
    this.lStack = [obj];
  }

  // ..........................................................
  current() {
    return this.lStack.at(-1);
  }

  // ..........................................................
  currentType() {
    var curr;
    curr = this.current();
    if (curr === undef) {
      return 'undef';
    } else if (isHash(curr)) {
      return 'hash';
    } else if (isArray(curr)) {
      return 'array';
    } else {
      return croak(`Bad current context: ${OL(curr)}`);
    }
  }

  // ..........................................................
  add(obj) {
    this.lStack.push(obj);
  }

  // ..........................................................
  pop() {
    var result;
    result = this.lStack.pop();
    assert(this.lStack.length >= 1, "Empty context stack");
    return result;
  }

};

//# sourceMappingURL=context-stack.js.map
