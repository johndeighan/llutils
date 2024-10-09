  // multi-map.coffee
import {
  undef,
  defined,
  notdefined,
  OL,
  LOG,
  range,
  isString,
  isArray,
  isHash,
  assert,
  croak
} from '@jdeighan/llutils';

// ---------------------------------------------------------------------------
export var MultiMap = class MultiMap {
  constructor(numKeys) {
    this.numKeys = numKeys;
    this.cache = new Map();
  }

  set(lKeys, value) {
    var curMap, i, obj, ref;
    this.check(lKeys);
    assert(defined(value), "value is undef");
    curMap = this.cache;
    ref = range(this.numKeys - 1);
    for (i of ref) {
      obj = curMap.get(lKeys[i]);
      if (defined(obj)) {
        assert(obj instanceof Map, `Not a map: ${OL(obj)}`);
        curMap = obj;
      } else {
        obj = new Map();
        curMap.set(lKeys[i], obj);
        curMap = obj;
      }
    }
    curMap.set(lKeys[this.numKeys - 1], value);
  }

  get(lKeys) {
    var curMap, i, obj, ref;
    this.check(lKeys);
    curMap = this.cache;
    ref = range(this.numKeys - 1);
    for (i of ref) {
      obj = curMap.get(lKeys[i]);
      if (defined(obj)) {
        assert(obj instanceof Map, `Not a map: ${OL(obj)}`);
        curMap = obj;
      } else {
        return undef;
      }
    }
    return curMap.get(lKeys[this.numKeys - 1]);
  }

  has(lKeys) {
    var value;
    value = this.get(lKeys);
    return defined(value);
  }

  check(lKeys) {
    assert(isArray(lKeys), `Not an array: ${OL(lKeys)}`);
    assert(lKeys.length === this.numKeys, `Got ${lKeys.length} keys, should be ${this.numKeys}`);
    assert(defined(...lKeys), `Not all keys defined: ${OL(lKeys)}`);
  }

};

//# sourceMappingURL=multi-map.js.map
