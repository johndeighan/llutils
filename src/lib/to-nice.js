// to-nice.coffee
var getSortKeysFunc;

import {
  undef,
  defined,
  notdefined,
  getOptions,
  OL,
  assert,
  croak,
  isString,
  isBoolean,
  isArray,
  isHash,
  isFunction,
  isNumber,
  isInteger,
  isClassInstance,
  isClass,
  className,
  toBlock
} from '@jdeighan/llutils';

import {
  indented
} from '@jdeighan/llutils/indent';

// ---------------------------------------------------------------------------
export var toNICE = (obj, hOptions = {}) => {
  var block, item, j, k, key, lKeys, lLines, len, len1, name, sortKeys, val;
  hOptions = getOptions(hOptions, {
    sortKeys: false // --- can be boolean/array/function
  });
  ({sortKeys} = hOptions);
  if (isArray(sortKeys)) {
    sortKeys = getSortKeysFunc(sortKeys);
    assert(isFunction(sortKeys), `Not a function: ${OL(sortKeys)}`);
  } else {
    assert(isBoolean(sortKeys) || isFunction(sortKeys), "sortKeys not boolean, array or function");
  }
  switch (typeof obj) {
    case 'undefined':
      return '.undef.';
    case 'boolean':
      if (obj) {
        return '.true.';
      } else {
        return '.false.';
      }
      break;
    case 'string':
      return obj;
    case 'number':
      if (Number.isNaN(obj)) {
        return '.NaN.';
      } else {
        return obj.toString();
      }
      break;
    case 'function':
      if (isClass(obj)) {
        name = className(obj);
        if (name) {
          return `.Class ${name}.`;
        } else {
          return ".Class.";
        }
      } else if (isFunction(obj)) {
        name = obj.name;
        if (name) {
          return `.Function ${name}.`;
        } else {
          return ".Function.";
        }
      }
      break;
    case 'object':
      if (obj === null) {
        return '.null.';
      }
      if ((obj instanceof String) || (obj instanceof Number) || (obj instanceof RegExp)) {
        return obj.toString();
      } else if (isArray(obj)) {
        lLines = [];
        for (j = 0, len = obj.length; j < len; j++) {
          item = obj[j];
          block = toNICE(item, hOptions);
          if (shouldSplit(item)) {
            lLines.push('-');
            lLines.push(indented(block));
          } else {
            lLines.push(`- ${block}`);
          }
        }
        return toBlock(lLines);
      } else if (obj instanceof Function) {
        if (obj.prototype && (obj.prototype.constructor === obj)) {
          return ".Class.";
        } else if (obj.name) {
          return `.Function ${obj.name}.`;
        } else {
          return ".Function.";
        }
      } else if (isHash(obj) || isClassInstance(obj)) {
        lLines = [];
        lKeys = Object.keys(obj);
        if (sortKeys === true) {
          lKeys.sort();
        } else if (isFunction(sortKeys)) {
          lKeys.sort(sortKeys);
        }
        for (k = 0, len1 = lKeys.length; k < len1; k++) {
          key = lKeys[k];
          assert(isString(key), `key not a string: ${OL(key)}`);
          val = obj[key];
          block = toNICE(val, hOptions);
          if (shouldSplit(val)) {
            lLines.push(`${key}:`);
            lLines.push(indented(block));
          } else {
            lLines.push(`${key}: ${block}`);
          }
        }
        return toBlock(lLines);
      }
  }
  return croak(`Unknown object: ${OL(obj)}`);
};

// ---------------------------------------------------------------------------
getSortKeysFunc = (lSortKeys) => {
  var h, i, j, key, len;
  // --- Convert to a function
  h = {};
  for (i = j = 0, len = lSortKeys.length; j < len; i = ++j) {
    key = lSortKeys[i];
    h[key] = i + 1;
  }
  return function(aKey, bKey) {
    var aVal, bVal;
    aVal = h[aKey];
    bVal = h[bKey];
    if (defined(aVal)) {
      if (defined(bVal)) {
        // --- compare numerically
        return baseCompare(aVal, bVal);
      } else {
        return -1;
      }
    } else {
      if (defined(bVal)) {
        return 1;
      } else {
        // --- compare keys alphabetically
        return baseCompare(aKey, bKey);
      }
    }
  };
};

// ---------------------------------------------------------------------------
export var needsQuotes = (str) => {
  // --- if it looks like an array item, it needs quotes
  if (str.match(/^\s*-/)) {
    return true;
  }
  // --- if it looks like a hash key, it needs quotes
  if (str.match(/^\s*\S+\s*:/)) {
    return true;
  }
  // --- if it looks like a number, it needs quotes
  if (str.match(/^\s*\d+(?:\.\d*)?/)) {
    return true;
  }
  return false;
};

// ---------------------------------------------------------------------------
export var shouldSplit = (obj) => {
  return isHash(obj) || isArray(obj) || isClass(obj) || isClassInstance(obj);
};

// ---------------------------------------------------------------------------
export var baseCompare = (a, b) => {
  if (a < b) {
    return -1;
  } else if (a > b) {
    return 1;
  } else {
    return 0;
  }
};

//# sourceMappingURL=to-nice.js.map
