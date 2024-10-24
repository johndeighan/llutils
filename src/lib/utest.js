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

  transformFunction(func) {
    return func;
  }

  // ........................................................................
  begin() {
    if (this.depth === 0) {
      this.beforeEachTest();
    }
    this.depth += 1;
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
  //                  TESTS
  // ..........................................................
  equal(val, expected) {
    this.begin();
    test(this.getLabel('equal'), async(t) => {
      val = (await this.transformValue(val));
      expected = (await this.transformExpected(expected));
      return t.deepEqual(val, expected);
    });
    this.end();
  }

  // ..........................................................
  notequal(val, expected) {
    this.begin();
    test(this.getLabel('notequal'), async(t) => {
      val = (await this.transformValue(val));
      expected = (await this.transformExpected(expected));
      return t.notDeepEqual(val, expected);
    });
    this.end();
  }

  // ..........................................................
  like(val, expected) {
    this.begin();
    test(this.getLabel('like'), async(t) => {
      val = (await this.transformValue(val));
      expected = (await this.transformExpected(expected));
      if (isString(val) && isString(expected)) {
        return t.is(this.norm(val), this.norm(expected));
      } else if (isNumber(val) && isNumber(expected)) {
        return t.truthy(Math.abs(val - expected) < 0.0001);
      } else {
        return t.like(val, expected);
      }
    });
    this.end();
  }

  // ..........................................................
  samelines(val, expected) {
    this.begin();
    test(this.getLabel('samelines'), async(t) => {
      var lExpLines, lValLines;
      val = (await this.transformValue(val));
      expected = (await this.transformExpected(expected));
      assert(isString(val), `not a string: ${OL(val)}`);
      assert(isString(expected), `not a string: ${OL(expected)}`);
      lValLines = blockToArray(val).filter((line) => {
        return nonEmpty(line);
      }).sort();
      lExpLines = blockToArray(expected).filter((line) => {
        return nonEmpty(line);
      }).sort();
      return t.deepEqual(lValLines, lExpLines);
    });
    this.end();
  }

  // ..........................................................
  samelist(val, expected) {
    this.begin();
    test(this.getLabel('samelist'), async(t) => {
      val = (await this.transformValue(val));
      expected = (await this.transformExpected(expected));
      assert(isArray(val), `not an array: ${OL(val)}`);
      assert(isArray(expected), `not an array: ${OL(expected)}`);
      return t.deepEqual(val.sort(), expected.sort());
    });
    this.end();
  }

  // ..........................................................
  truthy(val) {
    this.begin();
    test(this.getLabel('truthy'), async(t) => {
      val = (await this.transformValue(val));
      return t.truthy(val);
    });
    this.end();
  }

  // ..........................................................
  falsy(val) {
    this.begin();
    test(this.getLabel('falsy'), async(t) => {
      val = (await this.transformValue(val));
      return t.falsy(val);
    });
    this.end();
  }

  // ..........................................................
  showInConsole(value, format = 'nice') {
    this.begin();
    test(this.getLabel('showInConsole'), (t) => {
      switch (format.toLowerCase()) {
        case 'json':
          console.log(JSON.stringify(value, null, 3));
          break;
        default:
          console.log(untabify(toNICE(value)));
      }
      return t.truthy(true);
    });
    this.end();
  }

  // ..........................................................
  // --- NOTE: both strings and arrays have an includes() method
  includes(val, expected) {
    this.begin();
    test(this.getLabel('includes'), async(t) => {
      val = (await this.transformValue(val));
      expected = (await this.transformExpected(expected));
      assert(isString(val) || isArray(val), `Not a string or array: ${OL(val)}`);
      return t.truthy(val.includes(expected));
    });
    this.end();
  }

  // ..........................................................
  matches(val, pattern) {
    this.begin();
    //		debug = val.startsWith('test/file-processor')
    //		if debug
    //			console.log "IN match()"
    test(this.getLabel('matches'), async(t) => {
      var pos;
      val = (await this.transformValue(val));
      assert(isString(val), `Not a string: ${OL(val)}`);
      // --- if pattern is a string, that string must exist within val
      if (isString(pattern)) {
        pos = val.indexOf(pattern);
        return t.truthy(pos >= 0);
      } else {
        assert(isRegExp(pattern), `Not a string or regexp: ${OL(pattern)}`);
        return t.truthy(defined(val.match(pattern)));
      }
    });
    this.end();
  }

  // ..........................................................
  fileExists(filePath, contents = undef) {
    this.begin();
    test(this.getLabel('fileExists'), (t) => {
      t.truthy(isFile(filePath));
      if (defined(contents)) {
        return t.is(slurp(filePath).trim(), contents.trim());
      }
    });
    this.end();
  }

  // ..........................................................
  compiles(filePath) {
    this.begin();
    test(this.getLabel('compiles'), (t) => {
      var err, ext, ok;
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
      return t.truthy(ok);
    });
    this.end();
  }

  // ..........................................................
  fails(func) {
    this.begin();
    test(this.getLabel('fails'), async(t) => {
      var err, ok;
      func = (await this.transformFunction(func));
      assert(isFunction(func), `Not a function: ${OL(func)}`);
      [ok, err] = (await this.executesOK(func));
      return t.falsy(ok);
    });
    this.end();
  }

  // ..........................................................
  // --- with errClass == undef, same as fails()
  throws(func, errClass = undef) {
    this.begin();
    test(this.getLabel('throws'), async(t) => {
      var err, ok;
      func = (await this.transformFunction(func));
      assert(defined(errClass), "Missing error class");
      assert(isFunction(func), `Not a function: ${OL(func)}`);
      assert(isClass(errClass) || isFunction(errClass), `Not a class or function: ${OL(errClass)}`);
      [ok, err] = (await this.executesOK(func));
      return t.truthy(!ok && (err instanceof errClass));
    });
    this.end();
  }

  // ..........................................................
  succeeds(func) {
    this.begin();
    test(this.getLabel('succeeds'), async(t) => {
      var err, ok;
      func = (await this.transformFunction(func));
      assert(isFunction(func), `Not a function: ${OL(func)}`);
      [ok, err] = (await this.executesOK(func));
      return t.truthy(ok);
    });
    this.end();
  }

  // ..........................................................
  //           END TESTS
  // ..........................................................
  async executesOK(func) {
    var err;
    try {
      //		if isAsyncFunction(func)
      await func();
      return [true, undef];
    } catch (error) {
      err = error;
      return [false, err];
    }
  }

};

//		else
//			try
//				func()
//				return [true, undef]
//			catch err
//				return [false, err]

// ---------------------------------------------------------------------------
u = new UnitTester();

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

export var compiles = (filePath) => {
  return u.compiles(filePath);
};

//# sourceMappingURL=utest.js.map
