// utest.coffee
var nextID, u;

import test from 'ava';

import {
  undef,
  defined,
  notdefined,
  rtrim,
  nonEmpty,
  OL,
  isString,
  isNumber,
  isArray,
  isClass,
  isRegExp,
  isFunction,
  isAsyncFunction,
  isInteger,
  assert,
  croak,
  blockToArray,
  untabify
} from '@jdeighan/llutils';

import {
  execCmd
} from '@jdeighan/llutils/exec-utils';

import {
  isFile,
  slurp,
  fileExt
} from '@jdeighan/llutils/fs';

import {
  getMyOutsideCaller
} from '@jdeighan/llutils/v8-stack';

import {
  toNICE
} from '@jdeighan/llutils/to-nice';

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
//        fails 1 (function)
//        throws 2 (function, error class)
//           - check throws a specific error type
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
  async begin(val = undef, expected = undef, tag = undef) {
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
        if (isAsyncFunction(this.transformValue)) {
          val = (await this.transformValue(val));
        } else {
          val = this.transformValue(val);
        }
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
  async symbol(label) {
    croak("Deprecated test 'symbol'");
    [label] = (await this.begin(label, undef, 'symbol'));
    test(label, (t) => {
      return t.is(1, 1);
    });
    this.end();
  }

  // ..........................................................
  async equal(val, expected) {
    var label;
    [label, val, expected] = (await this.begin(val, expected, 'equal'));
    test(label, (t) => {
      return t.deepEqual(val, expected);
    });
    this.end();
  }

  // ..........................................................
  async notequal(val, expected) {
    var label;
    [label, val, expected] = (await this.begin(val, expected, 'notequal'));
    test(label, (t) => {
      return t.notDeepEqual(val, expected);
    });
    this.end();
  }

  // ..........................................................
  async like(val, expected) {
    var label;
    [label, val, expected] = (await this.begin(val, expected, 'like'));
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
  async samelines(val, expected) {
    var lExpLines, lValLines, label;
    assert(isString(val), `not a string: ${OL(val)}`);
    assert(isString(expected), `not a string: ${OL(expected)}`);
    [label, val, expected] = (await this.begin(val, expected, 'samelines'));
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
  async samelist(val, expected) {
    var label;
    [label, val, expected] = (await this.begin(val, expected, 'samelist'));
    test(label, (t) => {
      return t.deepEqual(val.sort(), expected.sort());
    });
    this.end();
  }

  // ..........................................................
  async truthy(bool) {
    var label;
    [label] = (await this.begin(undef, undef, 'truthy'));
    test(label, (t) => {
      return t.truthy(bool);
    });
    this.end();
  }

  // ..........................................................
  async falsy(bool) {
    var label;
    [label] = (await this.begin(undef, undef, 'falsy'));
    test(label, (t) => {
      return t.falsy(bool);
    });
    this.end();
  }

  // ..........................................................
  async showInConsole(value, format = 'nice') {
    var label;
    [label] = (await this.begin(undef, undef, 'showInConsole'));
    switch (format.toLowerCase()) {
      case 'json':
        console.log(JSON.stringify(value, null, 3));
        break;
      default:
        console.log(untabify(toNICE(value)));
    }
    test(label, (t) => {
      return t.truthy(true);
    });
    this.end();
  }

  // ..........................................................
  // --- NOTE: both strings and arrays have an includes() method
  async includes(val, expected) {
    var label;
    [label, val, expected] = (await this.begin(val, expected, 'includes'));
    assert(isString(val) || isArray(val), `Not a string or array: ${OL(val)}`);
    test(label, (t) => {
      return t.truthy(val.includes(expected));
    });
    this.end();
  }

  // ..........................................................
  async matches(val, regexp) {
    var debug, label, pos;
    assert(isString(val), `Not a string: ${OL(val)}`);
    [label, val] = (await this.begin(val, undef, 'matches'));
    debug = val.startsWith('test/file-processor');
    if (debug) {
      console.log("IN match()");
    }
    // --- if regexp is a string, that string must exist within val
    if (isString(regexp)) {
      pos = val.indexOf(regexp);
      if (pos === -1) {
        console.log('-'.repeat(40));
        console.log(val);
        console.log('-'.repeat(40));
      }
      test(label, (t) => {
        return t.truthy(pos >= 0);
      });
    } else {
      assert(isRegExp(regexp), `Not a string or regexp: ${OL(regexp)}`);
      test(label, (t) => {
        return t.truthy(defined(val.match(regexp)));
      });
    }
    this.end();
  }

  // ..........................................................
  async fileExists(filePath, contents = undef) {
    var label;
    [label] = (await this.begin(undef, undef, 'fileExists'));
    test(label, (t) => {
      t.truthy(isFile(filePath));
      if (defined(contents)) {
        return t.is(slurp(filePath).trim(), contents.trim());
      }
    });
    this.end();
  }

  // ..........................................................
  async fileCompiles(filePath) {
    var err, ext, label, ok;
    [label] = (await this.begin(undef, undef, 'compiles'));
    try {
      switch (ext = fileExt(filePath)) {
        case '.js':
          execCmd(`node -c ${filePath}`);
          break;
        default:
          croak(`Unsupported file type: ${ext}`);
      }
      ok = true;
    } catch (error) {
      err = error;
      console.log(err);
      ok = false;
    }
    test(label, (t) => {
      return t.truthy(ok);
    });
    this.end();
  }

  // ..........................................................
  async executesOK(func) {
    var err;
    if (isAsyncFunction(func)) {
      try {
        await func();
        return [true, undef];
      } catch (error) {
        err = error;
        return [false, err];
      }
    } else {
      try {
        func();
        return [true, undef];
      } catch (error) {
        err = error;
        return [false, err];
      }
    }
  }

  // ..........................................................
  async fails(func) {
    var err, label, ok;
    [label] = (await this.begin(undef, undef, 'fails'));
    assert(isFunction(func), `Not a function: ${OL(func)}`);
    [ok, err] = (await this.executesOK(func));
    test(label, (t) => {
      return t.falsy(ok);
    });
    this.end();
  }

  // ..........................................................
  // --- with errClass == undef, same as fails()
  async throws(func, errClass = undef) {
    var err, label, ok;
    if (notdefined(errClass)) {
      return this.fails(func);
    }
    [label] = (await this.begin(undef, undef, 'throws'));
    assert(isFunction(func), `Not a function: ${OL(func)}`);
    assert(isClass(errClass) || isFunction(errClass), `Not a class or function: ${OL(errClass)}`);
    [ok, err] = (await this.executesOK(func));
    test(label, (t) => {
      return t.truthy(!ok && (err instanceof errClass));
    });
    this.end();
  }

  // ..........................................................
  async succeeds(func) {
    var err, label, ok;
    assert(typeof func === 'function', "function expected");
    [label] = (await this.begin(undef, undef, 'succeeds'));
    [ok, err] = (await this.executesOK(func));
    test(label, (t) => {
      return t.truthy(ok);
    });
    this.end();
  }

};

// ---------------------------------------------------------------------------
u = new UnitTester();

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

export var showInConsole = (arg, format) => {
  return u.showInConsole(arg, format);
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

export var fileExists = (filePath, contents) => {
  return u.fileExists(filePath, contents);
};

export var fileCompiles = (filePath) => {
  return u.fileCompiles(filePath);
};

//# sourceMappingURL=utest.js.map
