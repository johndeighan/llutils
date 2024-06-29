// utest.coffee
var nextID;

import test from 'ava';

import {
  undef,
  defined,
  notdefined,
  rtrim,
  isEmpty,
  nonEmpty,
  OL,
  isString,
  isNumber,
  isArray,
  isClass,
  isFunction,
  isRegExp,
  isInteger,
  assert,
  croak,
  blockToArray
} from '@jdeighan/llutils';

import {
  fileExt
} from '@jdeighan/llutils/fs';

import {
  getMyOutsideCaller
} from '@jdeighan/llutils/v8-stack';

// ---------------------------------------------------------------------------
// --- Available tests w/num required params
//        equal 2
//        notequal 2
//        like 2
//        samelines 2
//        truthy 1
//        falsy 1
//        includes 2
//        matches 2
//        fails 1 (a function)
//        throws 1 (a function) - check throws a specific error type
//        succeeds 1 (a function)
// ---------------------------------------------------------------------------
nextID = 1;

export var UnitTester = class UnitTester {
  constructor() {
    // ........................................................................
    // --- returns, e.g. "test 1"
    this.getLabel = this.getLabel.bind(this);
    this.depth = 0;
    this.debug = false;
    this.hFound = {};
  }

  getLabel(tag = undef) {
    var column, filePath, line;
    // --- We need to figure out the line number of the caller
    ({filePath, line, column} = getMyOutsideCaller());
    if (this.debug) {
      console.log("getLabel()");
      console.log(`   filePath = '${filePath}'`);
      console.log(`   line = ${line}, col = ${column}`);
    }
    assert(isInteger(line), `getMyOutsideCaller() line = ${OL(line)}`);
    assert((fileExt(filePath) === '.js') || (fileExt(filePath) === '.coffee'), `caller not a JS or Coffee file: ${OL(filePath)}`);
    while (this.hFound[line]) {
      line += 1000;
    }
    this.hFound[line] = true;
    return `line ${line}`;
  }

  // ........................................................................
  transformValue(val) {
    return val;
  }

  transformExpected(expected) {
    return expected;
  }

  // ........................................................................
  begin(val = undef, expected = undef, tag = undef) {
    var err, label;
    if (tag === 'symbol') {
      return [`===== ${val} =====`];
    }
    if (this.depth === 0) {
      this.beforeEachTest();
    }
    this.depth += 1;
    label = this.getLabel(tag);
    if (defined(val)) {
      try {
        val = this.transformValue(val);
      } catch (error) {
        err = error;
        val = `ERROR: ${err.message}`;
      }
    }
    if (defined(expected)) {
      try {
        expected = this.transformExpected(expected);
      } catch (error) {
        err = error;
        expected = `ERROR: ${err.message}`;
      }
    }
    return [label, val, expected];
  }

  // ........................................................................
  end() {
    this.depth -= 1;
    if (this.depth === 0) {
      this.afterEachTest();
    }
  }

  // ..........................................................
  beforeEachTest() {}

  // ..........................................................
  afterEachTest() {}

  // ..........................................................
  norm(str) {
    return rtrim(str).replaceAll("\r", "");
  }

  // ..........................................................
  // ..........................................................
  symbol(label) {
    croak("Deprecated test 'symbol'");
    [label] = this.begin(label, undef, 'symbol');
    test(label, (t) => {
      return t.is(1, 1);
    });
    this.end();
  }

  // ..........................................................
  equal(val, expected) {
    var label;
    [label, val, expected] = this.begin(val, expected, 'equal');
    test(label, (t) => {
      return t.deepEqual(val, expected);
    });
    this.end();
  }

  // ..........................................................
  notequal(val, expected) {
    var label;
    [label, val, expected] = this.begin(val, expected, 'notequal');
    test(label, (t) => {
      return t.notDeepEqual(val, expected);
    });
    this.end();
  }

  // ..........................................................
  like(val, expected) {
    var label;
    [label, val, expected] = this.begin(val, expected, 'like');
    if (isString(val) && isString(expected)) {
      test(label, (t) => {
        return t.is(this.norm(val), this.norm(expected));
      });
    } else if (isNumber(val) && isNumber(expected)) {
      test(label, (t) => {
        return t.truthy(Math.abs(val - expected) < 0.0001);
      });
    } else {
      test(label, (t) => {
        return t.like(val, expected);
      });
    }
    this.end();
  }

  // ..........................................................
  samelines(val, expected) {
    var lExpLines, lValLines, label;
    assert(isString(val), `not a string: ${OL(val)}`);
    assert(isString(expected), `not a string: ${OL(expected)}`);
    [label, val, expected] = this.begin(val, expected, 'samelines');
    lValLines = blockToArray(val).filter((line) => {
      return nonEmpty(line);
    }).sort();
    lExpLines = blockToArray(expected).filter((line) => {
      return nonEmpty(line);
    }).sort();
    test(label, (t) => {
      return t.deepEqual(lValLines, lExpLines);
    });
    this.end();
  }

  // ..........................................................
  truthy(bool) {
    var label;
    [label] = this.begin(undef, undef, 'truthy');
    test(label, (t) => {
      return t.truthy(bool);
    });
    this.end();
  }

  // ..........................................................
  falsy(bool) {
    var label;
    [label] = this.begin(undef, undef, 'falsy');
    test(label, (t) => {
      return t.falsy(bool);
    });
    this.end();
  }

  // ..........................................................
  // --- NOTE: both strings and arrays have an includes() method
  includes(val, expected) {
    var label;
    [label, val, expected] = this.begin(val, expected, 'includes');
    assert(isString(val) || isArray(val), `Not a string or array: ${OL(val)}`);
    test(label, (t) => {
      return t.truthy(val.includes(expected));
    });
    this.end();
  }

  // ..........................................................
  matches(val, regexp) {
    var label;
    assert(isString(val), `Not a string: ${OL(val)}`);
    [label, val] = this.begin(val, undef, 'matches');
    // --- convert strings to regular expressions
    if (isString(regexp)) {
      regexp = new RegExp(regexp);
    }
    assert(isRegExp(regexp), `Not a string or regexp: ${OL(regexp)}`);
    test(label, (t) => {
      return t.truthy(defined(val.match(regexp)));
    });
    this.end();
  }

  // ..........................................................
  fails(func) {
    var err, label, ok;
    [label] = this.begin(undef, undef, 'fails');
    assert(isFunction(func), `Not a function: ${OL(func)}`);
    try {
      func();
      ok = true;
    } catch (error) {
      err = error;
      ok = false;
    }
    test(label, (t) => {
      return t.false(ok);
    });
    this.end();
  }

  // ..........................................................
  // --- with errClass == undef, same as fails()
  throws(func, errClass = undef) {
    var err, errObj, label, ok;
    if (notdefined(errClass)) {
      return this.fails(func);
    }
    [label] = this.begin(undef, undef, 'throws');
    assert(isFunction(func), `Not a function: ${OL(func)}`);
    assert(isClass(errClass) || isFunction(errClass), `Not a class or function: ${OL(errClass)}`);
    errObj = undef;
    try {
      func();
      ok = true;
    } catch (error) {
      err = error;
      errObj = err;
      ok = false;
    }
    test(label, (t) => {
      return t.truthy(!ok && (errObj instanceof errClass));
    });
    this.end();
  }

  // ..........................................................
  succeeds(func) {
    var err, label, ok;
    assert(typeof func === 'function', "function expected");
    [label] = this.begin(undef, undef, 'succeeds');
    try {
      func();
      ok = true;
    } catch (error) {
      err = error;
      console.error(err);
      ok = false;
    }
    test(label, (t) => {
      return t.truthy(ok);
    });
    this.end();
  }

};

// ---------------------------------------------------------------------------
export var u = new UnitTester();

export var symbol = (arg1) => {
  return u.symbol(arg1);
};

export var equal = (arg1, arg2) => {
  return u.equal(arg1, arg2);
};

export var notequal = (arg1, arg2) => {
  return u.notequal(arg1, arg2);
};

export var like = (arg1, arg2) => {
  return u.like(arg1, arg2);
};

export var samelines = (arg1, arg2) => {
  return u.samelines(arg1, arg2);
};

export var truthy = (arg) => {
  return u.truthy(arg);
};

export var falsy = (arg) => {
  return u.falsy(arg);
};

export var includes = (arg1, arg2) => {
  return u.includes(arg1, arg2);
};

export var matches = (str, regexp) => {
  return u.matches(str, regexp);
};

export var fails = (func) => {
  return u.fails(func);
};

export var throws = (func, errClass) => {
  return u.throws(func, errClass);
};

export var succeeds = (func) => {
  return u.succeeds(func);
};

//# sourceMappingURL=utest.js.map
