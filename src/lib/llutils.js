// llutils.coffee
var hasProp = {}.hasOwnProperty;

import assertLib from 'node:assert';

import {
  execSync
} from 'node:child_process';

export const undef = void 0;

// ---------------------------------------------------------------------------
export var pass = () => {}; // do nothing


// ---------------------------------------------------------------------------
export var range = function*(n) {
  var i;
  i = 0;
  while (i < n) {
    yield i;
    i += 1;
  }
};

// ---------------------------------------------------------------------------
export var add_s = (n) => {
  if (n === 1) {
    return '';
  } else {
    return 's';
  }
};

// ---------------------------------------------------------------------------
// low-level version of assert()
export var assert = (cond, msg) => {
  assertLib.ok(cond, msg);
  return true;
};

// ---------------------------------------------------------------------------
// low-level version of croak()
export var croak = (msg) => {
  throw new Error(msg);
  return true;
};

// ---------------------------------------------------------------------------
export var defined = (obj) => {
  return (obj !== undef) && (obj !== null);
};

// ---------------------------------------------------------------------------
export var notdefined = (obj) => {
  return (obj === undef) || (obj === null);
};

// ---------------------------------------------------------------------------
export var words = (...lStrings) => {
  var j, k, lWords, len1, len2, ref, str, word;
  lWords = [];
  for (j = 0, len1 = lStrings.length; j < len1; j++) {
    str = lStrings[j];
    str = str.trim();
    if (str !== '') {
      ref = str.split(/\s+/);
      for (k = 0, len2 = ref.length; k < len2; k++) {
        word = ref[k];
        lWords.push(word);
      }
    }
  }
  return lWords;
};

// ---------------------------------------------------------------------------
export var isString = (x, hOptions = {}) => {
  if ((typeof x !== 'string') && !(x instanceof String)) {
    return false;
  }
  if (hOptions.nonempty) {
    return nonEmpty(x);
  }
  return true;
};

// ---------------------------------------------------------------------------
// --- sometimes we can't use getOptions() because
//     it calls the current function
export var getOneOption = (name, hOptions) => {
  if ((typeof hOptions === 'string') || (hOptions instanceof String)) {
    return hOptions.split(/\s+/).includes(name);
  } else {
    return hasKey(hOptions, name) && hOptions[name];
  }
};

// ---------------------------------------------------------------------------
// Valid options:
//    allStrings: boolean
//    nonempty: boolean
export var isArray = (x, hOptions = {}) => {
  var allStrings, item, j, len1, nonempty;
  nonempty = getOneOption('nonempty', hOptions);
  allStrings = getOneOption('allStrings', hOptions);
  if (!Array.isArray(x)) {
    return false;
  }
  if (nonempty && (x.length === 0)) {
    return false;
  }
  if (allStrings) {
    for (j = 0, len1 = x.length; j < len1; j++) {
      item = x[j];
      if (!isString(item)) {
        return false;
      }
    }
  }
  return true;
};

// ---------------------------------------------------------------------------
export var isBoolean = (x, hOptions = {}) => {
  return (x === true) || (x === false) || (x instanceof Boolean);
};

// ---------------------------------------------------------------------------
export var isNumber = (x, hOptions = undef) => {
  var max, min, result;
  if ((typeof x === 'number') || (typeof x === 'bigint')) {
    result = true;
  } else if (x instanceof Number) {
    result = true;
  } else {
    return false;
  }
  if (defined(hOptions)) {
    assert(isHash(hOptions), `2nd arg not a hash: ${OL(hOptions)}`);
    ({min, max} = hOptions);
    if (defined(min) && (x < min)) {
      result = false;
    }
    if (defined(max) && (x > max)) {
      result = false;
    }
  }
  return result;
};

// ---------------------------------------------------------------------------
export var isInteger = (x, hOptions = {}) => {
  var result;
  if (typeof x === 'bigint') {
    result = true;
  }
  if (typeof x === 'number') {
    result = Number.isInteger(x);
  } else if (x instanceof Number) {
    result = Number.isInteger(x.valueOf());
  } else {
    return false;
  }
  if (result) {
    if (defined(hOptions.min) && (x < hOptions.min)) {
      result = false;
    }
    if (defined(hOptions.max) && (x > hOptions.max)) {
      result = false;
    }
  }
  return result;
};

// ---------------------------------------------------------------------------
export var isHash = (x) => {
  var ref;
  if (notdefined(x != null ? (ref = x.constructor) != null ? ref.name : void 0 : void 0)) {
    return false;
  }
  return x.constructor.name === 'Object';
};

// ---------------------------------------------------------------------------
export var isFunction = (x) => {
  if ((typeof x !== 'function') && !(x instanceof Function)) {
    return false;
  }
  return !(x.toString().startsWith('class'));
};

// ---------------------------------------------------------------------------
export var isRegExp = (x) => {
  return (typeof x === 'regexp') || (x instanceof RegExp);
};

// ---------------------------------------------------------------------------
export var isClass = (x) => {
  if (typeof x !== 'function') {
    return false;
  }
  return x.toString().startsWith('class');
};

// ---------------------------------------------------------------------------
export var isPromise = (x) => {
  if (typeof x !== 'object') {
    return false;
  }
  return typeof x.then === 'function';
};

// ---------------------------------------------------------------------------
export var isClassInstance = (x) => {
  if (typeof x !== 'object') {
    return false;
  }
  if ((x instanceof String) || (x instanceof Number) || (x instanceof Boolean) || (x instanceof RegExp) || (x instanceof Function) || isArray(x) || isHash(x) || isPromise(x)) {
    return false;
  }
  return true;
};

// ---------------------------------------------------------------------------
//   escapeStr - escape newlines, carriage return, TAB chars, etc.
export var hEsc = {
  "\r": '◄',
  "\n": '▼',
  "\t": '→',
  " ": '˳'
};

export var hEscNoNL = {
  "\r": '◄',
  "\t": '→',
  " ": '˳'
};

export var escapeStr = (str, hReplace = hEsc) => {
  var ch, result;
  // --- hReplace can also be a string:
  //        'esc'     - escape space, newline, tab
  //        'escNoNL' - escape space, tab
  assert(isString(str), `not a string: ${typeof str}`);
  if (isString(hReplace)) {
    switch (hReplace) {
      case 'esc':
        hReplace = hEsc;
        break;
      case 'escNoNL':
        hReplace = hEscNoNL;
        break;
      default:
        return str;
    }
  }
  assert(isHash(hReplace), "not a hash");
  if (isEmpty(hReplace)) {
    return str;
  }
  result = '';
  for (ch of str) {
    if (defined(hReplace[ch])) {
      result += hReplace[ch];
    } else {
      result += ch;
    }
  }
  return result;
};

// ---------------------------------------------------------------------------
//   escapeBlock
//      - remove carriage returns
//      - escape spaces, TAB chars
export var escapeBlock = (block) => {
  return escapeStr(block, 'escNoNL');
};

// ---------------------------------------------------------------------------
export var OL = (obj, hOptions = {}) => {
  var finalResult, myReplacer, result;
  if (obj === undef) {
    return 'undef';
  }
  if (obj === null) {
    return 'null';
  }
  if (hOptions.short) {
    if (isHash(obj)) {
      return 'HASH';
    }
    if (isArray(obj)) {
      return 'ARRAY';
    }
    if (isFunction(obj)) {
      return 'FUNCTION';
    }
    if (isObject(obj)) {
      return 'OBJECT';
    }
  }
  myReplacer = (key, x) => {
    var tag, type;
    type = typeof x;
    switch (type) {
      case 'bigint':
        return `«BigInt ${x.toString()}»`;
      case 'function':
        if (x.toString().startsWith('class')) {
          tag = 'Class';
        } else {
          tag = 'Function';
        }
        if (defined(x.name)) {
          return `«${tag} ${x.name}»`;
        } else {
          return `«${tag}»`;
        }
        break;
      case 'string':
        // --- NOTE: JSON.stringify will add quote chars
        return escapeStr(x);
      case 'object':
        if (x instanceof RegExp) {
          return `«RegExp ${x.toString()}»`;
        }
        if (defined(x) && (typeof x.then === 'function')) {
          return "«Promise»";
        } else {
          return x;
        }
        break;
      default:
        return x;
    }
  };
  result = JSON.stringify(obj, myReplacer);
  // --- Because JSON.stringify adds quote marks,
  //     we remove them when using « and »
  finalResult = result.replaceAll('"«', '«').replaceAll('»"', '»');
  return finalResult;
};

// ---------------------------------------------------------------------------
export var ML = (obj, hOptions = {}) => {
  var finalResult, myReplacer, result;
  if (obj === undef) {
    return '.undef.';
  }
  if (obj === null) {
    return '.null.';
  }
  myReplacer = (key, x) => {
    var tag, type;
    type = typeof x;
    switch (type) {
      case 'bigint':
        return `«BigInt ${x.toString()}»`;
      case 'function':
        if (x.toString().startsWith('class')) {
          tag = 'Class';
        } else {
          tag = 'Function';
        }
        if (defined(x.name)) {
          return `«${tag} ${x.name}»`;
        } else {
          return `«${tag}»`;
        }
        break;
      case 'string':
        // --- NOTE: JSON.stringify will add quote chars
        return escapeStr(x);
      case 'object':
        if (x instanceof RegExp) {
          return `«RegExp ${x.toString()}»`;
        }
        if (defined(x) && (typeof x.then === 'function')) {
          return "«Promise»";
        } else {
          return x;
        }
        break;
      default:
        return x;
    }
  };
  result = JSON.stringify(obj, myReplacer, "\t");
  // --- Because JSON.stringify adds quote marks,
  //     we remove them when using « and »
  finalResult = result.replaceAll('"«', '«').replaceAll('»"', '»');
  return finalResult;
};

// ---------------------------------------------------------------------------
// returns a single string
export var OLS = (lObjects, hOptions = {}) => {
  var j, lParts, len1, obj, sep, short;
  sep = hOptions.sep || ',';
  short = hOptions.short || false;
  assert(isArray(lObjects), "not an array");
  lParts = [];
  for (j = 0, len1 = lObjects.length; j < len1; j++) {
    obj = lObjects[j];
    lParts.push(OL(obj, {short}));
  }
  return lParts.join(sep);
};

// ---------------------------------------------------------------------------
//   isEmpty - one of:
//      - string is whitespace
//      - array has no elements
//      - hash has no keys
export var isEmpty = (x) => {
  if ((x === undef) || (x === null) || (x === '')) {
    return true;
  }
  if (isString(x)) {
    return x.match(/^\s*$/) !== null;
  }
  if (isArray(x)) {
    return x.length === 0;
  }
  if (isHash(x)) {
    return Object.keys(x).length === 0;
  } else {
    return false;
  }
};

// ---------------------------------------------------------------------------
//   nonEmpty - not isEmpty(x)
export var nonEmpty = (x) => {
  return !isEmpty(x);
};

// ---------------------------------------------------------------------------
export var execCmd = (cmdLine, hOptions = {}) => {
  var result;
  // --- may throw an exception
  hOptions = getOptions(hOptions, {
    encoding: 'utf8',
    windowsHide: true
  });
  result = execSync(cmdLine, hOptions);
  return result.replace("\r", "");
};

// ---------------------------------------------------------------------------
export var chomp = (str) => {
  var len;
  // --- Remove trailing \n if present
  len = str.length;
  if (str[len - 1] === '\n') {
    if (str[len - 2] === '\r') {
      return str.substring(0, len - 2);
    } else {
      return str.substring(0, len - 1);
    }
  } else {
    return str;
  }
};

// ---------------------------------------------------------------------------
export var keys = Object.keys;

// ---------------------------------------------------------------------------
export var hasKey = (h, key) => {
  assert(isHash(h), `h is ${OL(h)}`);
  return h.hasOwnProperty(key);
};

// ---------------------------------------------------------------------------
// --- item can be a hash or array
export var removeKeys = (item, lKeys) => {
  var j, k, key, len1, len2, prop, subitem, value;
  assertLib.ok(isArray(lKeys), "not an array");
  if (isArray(item)) {
    for (j = 0, len1 = item.length; j < len1; j++) {
      subitem = item[j];
      removeKeys(subitem, lKeys);
    }
  } else if (isHash(item)) {
    for (k = 0, len2 = lKeys.length; k < len2; k++) {
      key = lKeys[k];
      if (item.hasOwnProperty(key)) {
        delete item[key];
      }
    }
    for (prop in item) {
      value = item[prop];
      removeKeys(value, lKeys);
    }
  }
  return item;
};

// ---------------------------------------------------------------------------
export var npmLogLevel = () => {
  var result;
  result = execCmd('npm config get loglevel');
  return chomp(result);
};

// ---------------------------------------------------------------------------
export var blockToArray = (block) => {
  assert(isString(block), `block is: ${typeof block}`);
  if (isEmpty(block)) {
    return [];
  } else {
    return block.split(/\r?\n/);
  }
};

// ---------------------------------------------------------------------------
export var toArray = (strOrArray) => {
  if (isArray(strOrArray)) {
    return strOrArray;
  } else {
    return blockToArray(strOrArray);
  }
};

// ---------------------------------------------------------------------------
export var arrayToBlock = (lLines) => {
  assert(isArray(lLines), "lLines is not an array");
  return lLines.filter((line) => {
    return defined(line);
  }).join("\n");
};

// ---------------------------------------------------------------------------
export var toBlock = (strOrArray) => {
  if (isString(strOrArray)) {
    return strOrArray;
  } else {
    return arrayToBlock(strOrArray);
  }
};

// ---------------------------------------------------------------------------
export var untabify = (str, numSpaces = 3) => {
  return str.replace(/\t/g, ' '.repeat(numSpaces));
};

// ---------------------------------------------------------------------------
export var splitPrefix = (line) => {
  var lMatches;
  assert(isString(line), `non-string: ${typeof line}`);
  lMatches = line.match(/^(\s*)(.*)$/);
  return [lMatches[1], lMatches[2]];
};

// ---------------------------------------------------------------------------
//    tabify - convert leading spaces to TAB characters
//             if numSpaces is not defined, then the first line
//             that contains at least one space sets it
export var tabify = (str, numSpaces = undef) => {
  var j, lLines, len1, level, prefix, prefixLen, ref, theRest;
  lLines = [];
  ref = blockToArray(str);
  for (j = 0, len1 = ref.length; j < len1; j++) {
    str = ref[j];
    [prefix, theRest] = splitPrefix(str);
    prefixLen = prefix.length;
    if (prefixLen === 0) {
      lLines.push(theRest);
    } else {
      assert(prefix.indexOf('\t') === -1, "found TAB");
      if (numSpaces === undef) {
        numSpaces = prefixLen;
      }
      assert(prefixLen % numSpaces === 0, "Bad prefix");
      level = prefixLen / numSpaces;
      lLines.push('\t'.repeat(level) + theRest);
    }
  }
  return arrayToBlock(lLines);
};

// ---------------------------------------------------------------------------
export var gen2array = (reader) => {
  var lLines, line, ref;
  lLines = [];
  ref = reader();
  for (line of ref) {
    lLines.push(line);
  }
  return lLines;
};

// ---------------------------------------------------------------------------
export var gen2block = (reader) => {
  var lLines;
  lLines = gen2array(reader);
  return lLines.join("\n");
};

// ---------------------------------------------------------------------------
export var spaces = (n) => {
  return " ".repeat(n);
};

// ---------------------------------------------------------------------------
export var tabs = (n) => {
  return "\t".repeat(n);
};

// ---------------------------------------------------------------------------
// --- valid options:
//        char - char to use on left and right
//        buffer - num spaces around text when char <> ' '
export var centered = (text, width, hOptions = {}) => {
  var buf, char, left, numBuffer, numLeft, numRight, right, totSpaces;
  ({char} = getOptions(hOptions, {
    char: ' '
  }));
  numBuffer = hOptions.numBuffer || 2;
  totSpaces = width - text.length;
  if (totSpaces <= 0) {
    return text;
  }
  numLeft = Math.floor(totSpaces / 2);
  numRight = totSpaces - numLeft;
  if (char === ' ') {
    return spaces(numLeft) + text + spaces(numRight);
  } else {
    buf = ' '.repeat(numBuffer);
    left = char.repeat(numLeft - numBuffer);
    right = char.repeat(numRight - numBuffer);
    numLeft -= numBuffer;
    numRight -= numBuffer;
    return left + buf + text + buf + right;
  }
};

// ---------------------------------------------------------------------------
export var countChars = (str, ch) => {
  var count, pos;
  count = 0;
  pos = -1;
  while ((pos = str.indexOf(ch, pos + 1)) !== -1) {
    count += 1;
  }
  return count;
};

// ---------------------------------------------------------------------------
//   rtrim - strip trailing whitespace
export var rtrim = (line) => {
  var lMatches;
  assert(isString(line), `not a string: ${typeof line}`);
  lMatches = line.match(/^(.*?)\s+$/);
  if (defined(lMatches)) {
    return lMatches[1];
  } else {
    return line;
  }
};

// ---------------------------------------------------------------------------
export var DUMP = (block, label = 'RESULT', hOptions = {}) => {
  var esc, header, width;
  width = 64;
  ({esc} = getOptions(hOptions, {
    esc: false
  }));
  if (isArray(block, 'allStrings')) {
    block = arrayToBlock(block);
  }
  label = label.replace('_', ' ');
  header = centered(label, width, 'char=-');
  console.log(header);
  if (isString(block)) {
    if (esc) {
      console.log(escapeBlock(block));
    } else {
      console.log(untabify(block));
    }
  } else {
    console.log("JSON:");
    console.log(JSON.stringify(block, null, 3));
  }
  console.log('-'.repeat(width));
};

// ---------------------------------------------------------------------------
export var getOptions = (options = undef, hDefault = {}) => {
  var hOptions, key, value;
  if (isEmpty(options)) {
    hOptions = {};
  } else if (isHash(options)) {
    hOptions = options;
  } else if (isString(options)) {
    hOptions = hashFromString(options);
  } else {
    croak("Bad options");
  }
  for (key in hDefault) {
    if (!hasProp.call(hDefault, key)) continue;
    value = hDefault[key];
    if (!hasKey(hOptions, key) && defined(value)) {
      hOptions[key] = value;
    }
  }
  return hOptions;
};

// ---------------------------------------------------------------------------
export var hashFromString = (str) => {
  var _, eq, h, ident, j, lMatches, len1, neg, num, ref, word;
  assert(isString(str), `not a string: ${OL(str)}`);
  h = {};
  ref = words(str);
  for (j = 0, len1 = ref.length; j < len1; j++) {
    word = ref[j];
    if (lMatches = word.match(/^(\!)?([A-Za-z][A-Za-z_0-9]*)(?:(=)(.*))?$/)) { // negate value
      // identifier
      [_, neg, ident, eq, str] = lMatches;
      if (nonEmpty(eq)) {
        assert(isEmpty(neg), "negation with string value");
        // --- check if str is a valid number
        num = parseFloat(str);
        if (Number.isNaN(num)) {
          // --- TO DO: interpret backslash escapes
          h[ident] = str;
        } else {
          h[ident] = num;
        }
      } else if (neg) {
        h[ident] = false;
      } else {
        h[ident] = true;
      }
    } else {
      croak(`Invalid word ${OL(word)}`);
    }
  }
  return h;
};

// ---------------------------------------------------------------------------
export var joinOne = (item) => {
  var lStrings, subitem;
  if (isString(item)) {
    return item;
  } else {
    lStrings = (function() {
      var j, len1, results;
      results = [];
      for (j = 0, len1 = item.length; j < len1; j++) {
        subitem = item[j];
        results.push(joinOne(subitem));
      }
      return results;
    })();
    return lStrings.join('');
  }
};

// ---------------------------------------------------------------------------
export var join = (...lItems) => {
  var item, lStrings;
  lStrings = (function() {
    var j, len1, results;
    results = [];
    for (j = 0, len1 = lItems.length; j < len1; j++) {
      item = lItems[j];
      results.push(joinOne(item));
    }
    return results;
  })();
  return lStrings.join('');
};

// ---------------------------------------------------------------------------
export var js2uri = (js) => {
  return 'data:text/javascript;charset=utf-8,' + encodeURIComponent(js);
};

// ---------------------------------------------------------------------------
export var now = () => {
  return global.performance.now();
};

// ---------------------------------------------------------------------------
export var timeit = (func, nReps = 100) => {
  var diff, i, j, len1, ref, t0;
  t0 = now();
  ref = range(nReps);
  for (j = 0, len1 = ref.length; j < len1; j++) {
    i = ref[j];
    func();
  }
  diff = now() - t0;
  return diff / nReps;
};

//# sourceMappingURL=llutils.js.map
