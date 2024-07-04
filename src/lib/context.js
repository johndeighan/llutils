  // context.coffee
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

// ---------------------------------------------------------------------------
export var Context = class Context {
  constructor(obj) {
    this.lStack = [obj];
  }

  // ..........................................................
  current() {
    return this.lStack.at(-1);
  }

  // ..........................................................
  isArray() {
    return isArray(this.current());
  }

  // ..........................................................
  isHash() {
    return isHash(this.current());
  }

  // ..........................................................
  isUndef() {
    return notdefined(this.current());
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

//# sourceMappingURL=context.js.map
