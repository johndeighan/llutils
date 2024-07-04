  // llutils.coffee
var deepEqual, execAsync, module,
  hasProp = {}.hasOwnProperty;

import assertLib from 'node:assert';

import {
  exec,
  execSync
} from 'node:child_process';

import {
  promisify
} from 'node:util';

execAsync = promisify(exec);

import YAML from 'yaml';

module = (await import('deep-equal'));

deepEqual = module.default;

export const undef = void 0;

// ---------------------------------------------------------------------------
export var eq = (x, y) => {
  return deepEqual(x, y, {
    strict: true
  });
};

// ---------------------------------------------------------------------------
export var dclone = (x) => {
  return structuredClone(x);
};

// ---------------------------------------------------------------------------
export var stripCR = (str) => {
  if (notdefined(str)) {
    return undef;
  }
  assert(isString(str), `Not a string: ${OL(str)}`);
  return str.replaceAll('\r', '');
};

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
export var rev_range = function*(n) {
  var i;
  i = n;
  while (i > 0) {
    i -= 1;
    yield i;
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
// returns true if all args defined
export var defined = (...lObjs) => {
  var j, len1, obj;
  for (j = 0, len1 = lObjs.length; j < len1; j++) {
    obj = lObjs[j];
    if ((obj === undef) || (obj === null)) {
      return false;
    }
  }
  return true;
};

// ---------------------------------------------------------------------------
// returns true if any args defined
export var anyDefined = (...lObjs) => {
  var j, len1, obj;
  for (j = 0, len1 = lObjs.length; j < len1; j++) {
    obj = lObjs[j];
    if ((obj !== undef) && (obj !== null)) {
      return true;
    }
  }
  return false;
};

// ---------------------------------------------------------------------------
export var notdefined = (...lObjs) => {
  var j, len1, obj;
  for (j = 0, len1 = lObjs.length; j < len1; j++) {
    obj = lObjs[j];
    if ((obj !== undef) && (obj !== null)) {
      return false;
    }
  }
  return true;
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
  if ((hOptions === 'nonempty') || hOptions.nonempty) {
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
export var className = (x) => {
  var lMatches, text;
  // --- item can be a class or an object
  if (isClass(x)) {
    text = x.toString();
    if (lMatches = text.match(/class\s+(\w+)/)) {
      return lMatches[1];
    } else if (lMatches = text.match(/class/)) {
      return undef;
    } else {
      throw new Error("className(): Bad input class");
    }
  } else if (isClassInstance(x)) {
    return x.constructor.name;
  } else {
    return undef;
  }
};

// ---------------------------------------------------------------------------
export var isPromise = (x) => {
  if ((typeof x !== 'object') || (x === null)) {
    return false;
  }
  return typeof x.then === 'function';
};

// ---------------------------------------------------------------------------
export var isClassInstance = (x, lReqKeys = undef) => {
  var _, j, key, lMatches, len1, type;
  if (typeof x !== 'object') {
    return false;
  }
  if ((x instanceof String) || (x instanceof Number) || (x instanceof Boolean) || (x instanceof RegExp) || (x instanceof Function) || isArray(x) || isHash(x) || isPromise(x)) {
    return false;
  }
  if (defined(lReqKeys)) {
    if (isString(lReqKeys)) {
      lReqKeys = words(lReqKeys);
    }
    assert(isArray(lReqKeys), `lReqKeys not an array: ${OL(lReqKeys)}`);
    for (j = 0, len1 = lReqKeys.length; j < len1; j++) {
      key = lReqKeys[j];
      type = undef;
      if (lMatches = key.match(/^(\&)(.*)$/)) {
        [_, type, key] = lMatches;
      }
      if (notdefined(x[key])) {
        return false;
      }
      if ((type === '&') && (typeof x[key] !== 'function')) {
        return false;
      }
    }
  }
  return true;
};

// ---------------------------------------------------------------------------
//   escapeStr - escape newlines, carriage return, TAB chars, etc.
// --- NOTE: We can't use OL() inside here since it uses escapeStr()
export var hEsc = {
  "\r": '←',
  "\n": '↓',
  "\t": '→',
  " ": '˳'
};

export var hEscNoNL = {
  "\r": '←',
  "\t": '→',
  " ": '˳'
};

export var escapeStr = (str, hReplace = hEsc, hOptions = {}) => {
  var ch, i, lParts, offset, poschar, result;
  // --- hReplace can also be a string:
  //        'esc'     - escape space, newline, tab
  //        'escNoNL' - escape space, tab
  //     Valid options:
  //        offset    - indicate position of offset
  //        poschar   - char to use to indicate position
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
        hReplace = {};
    }
  }
  assert(isHash(hReplace), "not a hash");
  ({offset, poschar} = getOptions(hOptions, {
    offset: undef,
    poschar: '┊'
  }));
  lParts = [];
  i = 0;
  for (ch of str) {
    if (defined(offset)) {
      if (i === offset) {
        lParts.push(poschar);
      }
    }
    result = hReplace[ch];
    if (defined(result)) {
      lParts.push(result);
    } else {
      lParts.push(ch);
    }
    i += 1;
  }
  if (offset === str.length) {
    lParts.push(poschar);
  }
  return lParts.join('');
};

// ---------------------------------------------------------------------------
//   escapeBlock
//      - remove carriage returns
//      - escape spaces, TAB chars
export var escapeBlock = (block) => {
  return escapeStr(block, 'escNoNL');
};

// ---------------------------------------------------------------------------
// --- Can't use getOptions() !!!!!
export var OL = (obj, hOptions = {}) => {
  var esc, finalResult, myReplacer, result, short;
  if (obj === undef) {
    return 'undef';
  }
  if (obj === null) {
    return 'null';
  }
  if (hOptions.hasOwnProperty('esc')) {
    esc = hOptions.esc;
  } else {
    esc = true;
  }
  if (hOptions.hasOwnProperty('short')) {
    short = hOptions.short;
  } else {
    short = false;
  }
  if (short) {
    if (isHash(obj)) {
      return 'HASH';
    }
    if (isArray(obj)) {
      return 'ARRAY';
    }
    if (isFunction(obj)) {
      return 'FUNCTION';
    }
    if (isClassInstance(obj)) {
      return 'CLASS INSTANCE';
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
          return `.${tag} ${x.name}.`;
        } else {
          return `.${tag}.`;
        }
        break;
      case 'string':
        // --- NOTE: JSON.stringify will add quote chars
        if (esc) {
          return escapeStr(x);
        } else {
          return x;
        }
        break;
      case 'object':
        if (x instanceof RegExp) {
          return `.RegExp ${x.toString()}.`;
        }
        if (defined(x) && (typeof x.then === 'function')) {
          return ".Promise.";
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
  //     we remove them when using .
  finalResult = result.replaceAll('".', '.').replaceAll('."', '.');
  return finalResult;
};

// ---------------------------------------------------------------------------
export var CWS = (str) => {
  assert(isString(str), "CWS(): parameter not a string");
  return str.trim().replace(/\s+/sg, ' ');
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
  // --- may throw an exception
  hOptions = getOptions(hOptions, {
    encoding: 'utf8',
    windowsHide: true
  });
  return execSync(cmdLine, hOptions).toString();
};

// ---------------------------------------------------------------------------
export var execAndLogCmd = (cmdLine, hOptions = {}) => {
  var result;
  // --- may throw an exception
  hOptions = getOptions(hOptions, {
    encoding: 'utf8',
    windowsHide: true
  });
  result = execSync(cmdLine, hOptions).toString();
  console.log(result);
  return result;
};

// ---------------------------------------------------------------------------
export var execCmdAsync = (cmdLine, hOptions = {}) => {
  // --- may throw an exception
  hOptions = getOptions(hOptions, {
    encoding: 'utf8',
    windowsHide: true
  });
  return execAsync(cmdLine, hOptions);
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
//        HASH utilities
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
export var listdiff = (lItems, lToRemove) => {
  assert(isArray(lItems), `lItems is ${OL(lItems)}`);
  assert(isArray(lToRemove), `lToRemove is ${OL(lToRemove)}`);
  return lItems.filter((item) => {
    return !lToRemove.includes(item);
  });
};

// ---------------------------------------------------------------------------
export var untabify = (str, numSpaces = 3) => {
  return str.replace(/\t/g, ' '.repeat(numSpaces));
};

// ---------------------------------------------------------------------------
export var LOG = (item) => {
  if (isString(item)) {
    return console.log(untabify(item));
  } else {
    return console.log(item);
  }
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
export var leftAligned = (text, width, hOptions = {}) => {
  var numSpaces;
  if (text.length >= width) {
    return text;
  }
  numSpaces = width - text.length;
  return text + ' '.repeat(numSpaces);
};

// ---------------------------------------------------------------------------
export var rightAligned = (text, width, hOptions = {}) => {
  var numSpaces;
  if (text.length >= width) {
    return text;
  }
  numSpaces = width - text.length;
  return ' '.repeat(numSpaces) + text;
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
// --- Always logs using console.log, therefore
//     strings are untabified
export var log = (...lItems) => {
  var j, len1, x;
  for (j = 0, len1 = lItems.length; j < len1; j++) {
    x = lItems[j];
    if (isString(x)) {
      console.log(untabify(x));
    } else {
      console.log(x);
    }
  }
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
    croak(`Bad options: ${OL(options)}`);
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
  var _, eqSign, h, ident, j, lMatches, len1, neg, num, ref, word;
  assert(isString(str), `not a string: ${OL(str)}`);
  h = {};
  ref = words(str);
  for (j = 0, len1 = ref.length; j < len1; j++) {
    word = ref[j];
    if (lMatches = word.match(/^(\!)?([A-Za-z][A-Za-z_0-9]*)(?:(=)(.*))?$/)) { // negate value
      // identifier
      [_, neg, ident, eqSign, str] = lMatches;
      if (nonEmpty(eqSign)) {
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

// ---------------------------------------------------------------------------
export var behead = function(block) {
  var nlPos;
  nlPos = block.indexOf("\n");
  if (nlPos === -1) {
    return [block, ''];
  }
  return [chomp(block.substring(0, nlPos)), chomp(block.substring(nlPos + 1))];
};

// ---------------------------------------------------------------------------
export var isTAML = function(block) {
  var head, rest;
  [head, rest] = behead(block);
  return head === '---';
};

// ---------------------------------------------------------------------------
export var fromTAML = function(block) {
  var hOptions, head, rest;
  [head, rest] = behead(block);
  assert(head.startsWith('---'), "Missing '---'");
  hOptions = {
    skipInvalid: true
  };
  return YAML.parse(untabify(rest, 2), hOptions);
};

// ---------------------------------------------------------------------------
export var toTAML = function(ds) {
  var str;
  str = YAML.stringify(ds, {
    keepUndef: true,
    simpleKeys: true
  });
  return chomp("---\n" + tabify(str));
};

// ---------------------------------------------------------------------------
export var sliceBlock = function(block, start = 0, end = undef) {
  var lLines;
  lLines = toArray(block);
  if (notdefined(end)) {
    end = lLines.length;
  }
  return toBlock(lLines.slice(start, end));
};

// ---------------------------------------------------------------------------
export var sortArrayOfHashes = (lHashes, key) => {
  var compareFunc;
  // --- NOTE: works whether values are strings or numbers
  compareFunc = (a, b) => {
    if (a[key] < b[key]) {
      return -1;
    } else if (a[key] > b[key]) {
      return 1;
    } else {
      return 0;
    }
  };
  lHashes.sort(compareFunc);
  // --- NOTE: array is sorted in place, but sometimes
  //           it's useful if we return a ref to it anyway
  return lHashes;
};

// ---------------------------------------------------------------------------
export var sortedArrayOfHashes = (lHashes, key) => {
  var compareFunc;
  // --- NOTE: works whether values are strings or numbers
  compareFunc = (a, b) => {
    if (a[key] < b[key]) {
      return -1;
    } else if (a[key] > b[key]) {
      return 1;
    } else {
      return 0;
    }
  };
  return lHashes.toSorted(compareFunc);
};

// ---------------------------------------------------------------------------
export var cmdArgStr = (lArgs = undef) => {
  if (isString(lArgs)) {
    return lArgs;
  }
  if (defined(lArgs)) {
    assert(isArray(lArgs), `Not an array: ${OL(lArgs)}`);
  } else {
    lArgs = process.argv.slice(2) || [];
  }
  return lArgs.map((str) => {
    var _, lMatches, name, value;
    if (lMatches = str.match(/^-([^=\s]+)=(.*)$/)) { // a dash
      // option name
      // equal sign
      [_, name, value] = lMatches;
      if (value.includes(' ')) {
        return `-${name}=\"${value}\"`;
      } else {
        return `-${name}=${value}`;
      }
    } else if (str.includes(' ')) {
      return `\"${str}\"`;
    } else {
      return str;
    }
  }).join(' ');
};

// ---------------------------------------------------------------------------
export var rpad = (str, len, ch = ' ') => {
  var extra;
  assert(ch.length === 1, "Not a char");
  if (notdefined(str)) {
    return ch.repeat(len);
  }
  if (!isString(str)) {
    str = str.toString();
  }
  extra = len - str.length;
  if (extra < 0) {
    extra = 0;
  }
  return str + ch.repeat(extra);
};

// ---------------------------------------------------------------------------
export var lpad = (str, len, ch = ' ') => {
  var extra;
  assert(ch.length === 1, "Not a char");
  if (notdefined(str)) {
    return ch.repeat(len);
  }
  if (!isString(str)) {
    str = str.toString();
  }
  extra = len - str.length;
  if (extra < 0) {
    extra = 0;
  }
  return ch.repeat(extra) + str;
};

// ---------------------------------------------------------------------------
export var padString = function(str, width, align) {
  switch (align) {
    case 'left':
      return rpad(str, width);
    case 'center':
      return centered(str, width);
    case 'right':
      return lpad(str, width);
  }
};

// ---------------------------------------------------------------------------
export var zpad = (n, len) => {
  var nStr;
  nStr = n.toString();
  return lpad(nStr, len, '0');
};

// ---------------------------------------------------------------------------
export var findOneOf = (str, lSubStrings, pos = 0) => {
  var i, j, len1, loc, substr;
  assert(isString(str), `not a string: ${OL(str)}`);
  assert(isArray(lSubStrings), `Not an array: ${OL(lSubStrings)}`);
  assert(lSubStrings.length > 0, "lSubStrings is empty array");
  loc = -1;
  for (j = 0, len1 = lSubStrings.length; j < len1; j++) {
    substr = lSubStrings[j];
    i = str.indexOf(substr, pos);
    if (i >= 0) {
      // --- found
      if ((loc === -1) || (i < loc)) {
        loc = i;
      }
    }
  }
  return loc;
};

// ---------------------------------------------------------------------------
export var matchPos = (str, pos = 0) => {
  var count, endCh, loc, startCh;
  startCh = str[pos];
  endCh = (function() {
    switch (startCh) {
      case '(':
        return ')';
      case '[':
        return ']';
      case '{':
        return '}';
      default:
        return croak(`Invalid startCh: ${OL(startCh)}`);
    }
  })();
  count = 1;
  pos += 1;
  loc = findOneOf(str, [startCh, endCh], pos);
  while ((loc !== -1) && (count > 0)) {
    if (str[loc] === startCh) {
      count += 1;
    } else if (str[loc] === endCh) {
      count -= 1;
    }
    pos = loc;
    loc = findOneOf(str, [startCh, endCh], pos + 1);
  }
  assert((pos >= 0) && (pos < str.length) && (str[pos] === endCh) && (count === 0), `No matching ${endCh} found`);
  return pos;
};

// ---------------------------------------------------------------------------
// --- func will receive (str)
//     should return [extractedStr, newpos]
//        newpos must be > pos
//        extractedStr may be undef
export var splitStr = (str, splitFunc) => {
  var extractedStr, inc, lParts, pos;
  lParts = [];
  pos = 0;
  while (pos < str.length) {
    [extractedStr, inc] = splitFunc(str.substring(pos));
    assert(inc > 0, `inc = ${inc}`);
    pos += inc;
    if (defined(extractedStr)) {
      lParts.push(extractedStr);
    }
  }
  return lParts;
};

// ---------------------------------------------------------------------------
export var Block = class Block {
  constructor() {
    this.lLines = [];
    this.maxLen = 0;
  }

  getLines() {
    return this.lLines;
  }

  getBlock() {
    return toBlock(this.lLines);
  }

  add(block) {
    var j, len1, ref, results, str;
    ref = toArray(block);
    results = [];
    for (j = 0, len1 = ref.length; j < len1; j++) {
      str = ref[j];
      if (str.length > this.maxLen) {
        this.maxLen = str.length;
      }
      results.push(this.lLines.push(str));
    }
    return results;
  }

  prepend(block) {
    var j, len1, ref, results, str;
    ref = toArray(block).reverse();
    results = [];
    for (j = 0, len1 = ref.length; j < len1; j++) {
      str = ref[j];
      if (str.length > this.maxLen) {
        this.maxLen = str.length;
      }
      results.push(this.lLines.unshift(str));
    }
    return results;
  }

};

//# sourceMappingURL=llutils.js.map
