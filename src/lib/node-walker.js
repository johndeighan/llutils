  // node-walker.coffee
import {
  undef,
  defined,
  notdefined,
  OL,
  getOptions,
  LOG,
  assert,
  croak,
  dclone,
  range,
  rev_range,
  centered,
  leftAligned,
  isString,
  isArray,
  isHash,
  isEmpty,
  hasKey,
  keys
} from '@jdeighan/llutils';

import {
  DUMP
} from '@jdeighan/llutils/dump';

import {
  indented,
  undented
} from '@jdeighan/llutils/indent';

// ---------------------------------------------------------------------------
export var stackMatches = (lStack, str) => {
  debugger;
  var i, item, lPath, pos, ref;
  lPath = parsePath(str);
  if (lStack.length < lPath.length) {
    return false;
  }
  pos = lStack.length;
  ref = range(lPath.length);
  for (i of ref) {
    pos -= 1;
    item = lStack[pos];
    if (!itemMatches(item, lPath[i])) {
      return false;
    }
  }
  return true;
};

// ---------------------------------------------------------------------------
export var parsePath = (str) => {
  var re, splitter;
  assert(isString(str), `Not a string: ${OL(str)}`);
  splitter = (substr) => {
    var key, type;
    [key, type] = substr.split(':');
    if (isEmpty(key)) {
      key = '';
    }
    if (isEmpty(type)) {
      type = '';
    }
    return [key.trim(), type.trim()];
  };
  re = /[\r\n\/]+/;
  return str.split(re).map(splitter);
};

// ---------------------------------------------------------------------------
export var itemMatches = function(hStackItem, [key, type]) {
  if (key && (hStackItem.key !== key.trim())) {
    return false;
  }
  if (type && (hStackItem.hNode.type !== type.trim())) {
    return false;
  }
  return true;
};

// ---------------------------------------------------------------------------
// --- anything named 'item'
//     can always be a node or array of nodes
export var NodeWalker = class NodeWalker {
  constructor(hOptions = {}) {
    ({
      debug: this.debug
    } = getOptions(hOptions, {
      debug: false
    }));
    // --- Array of {key, hNode}
    this.lStack = [];
  }

  // ..........................................................
  dumpStack() {
    var i, item, pos, ref;
    console.log(centered('STACK', 40, 'char=-'));
    pos = this.lStack.length;
    ref = range(pos);
    for (i of ref) {
      pos -= 1;
      item = this.lStack[pos];
      // console.log "#{item.key}: #{item.hNode.type}"
      console.log(`{key: ${leftAligned(item.key, 12)}, hNode: {type: ${item.hNode.type}}}`);
    }
    console.log('-'.repeat(40));
  }

  // ..........................................................
  stackMatches(str) {
    return stackMatches(this.lStack, str);
  }

  // ..........................................................
  level() {
    return this.lStack.length;
  }

  // ..........................................................
  isNode(item) {
    return isHash(item) && hasKey(item, 'type');
  }

  // ..........................................................
  isArrayOfNodes(item) {
    var j, len, x;
    if (!isArray(item)) {
      return false;
    }
    for (j = 0, len = item.length; j < len; j++) {
      x = item[j];
      if (!this.isNode(x)) {
        return false;
      }
    }
    return true;
  }

  // ..........................................................
  dbg(str) {
    if (this.debug) {
      LOG(indented(str, this.level()));
    }
  }

  // ..........................................................
  walk(hAST) {
    assert(this.isNode(hAST), `Not a node: ${OL(hAST)}`);
    this.init();
    this.visit(hAST.type, hAST);
    this.visitChildren(hAST);
    this.end(hAST);
    return this; // allow chaining
  }

  
    // ..........................................................
  visitChildren(hNode) {
    var h, j, k, key, lKeys, len, len1, value;
    lKeys = keys(hNode);
    for (j = 0, len = lKeys.length; j < len; j++) {
      key = lKeys[j];
      value = hNode[key];
      this.lStack.push({key, hNode});
      if (this.isNode(value)) {
        this.visit(value.type, value);
        this.visitChildren(value);
        this.end(value);
      } else if (this.isArrayOfNodes(value)) {
        for (k = 0, len1 = value.length; k < len1; k++) {
          h = value[k];
          this.visit(h.type, h);
          this.visitChildren(h);
          this.end(h);
        }
      }
      this.lStack.pop();
    }
  }

  // ..........................................................
  // --- Override these
  init() {
    this.lLines = [];
  }

  // ..........................................................
  visit(type, hNode) {
    var str;
    this.dbg(indented(`VISIT ${type}`));
    str = this.stringifyNode(hNode);
    this.lLines.push(indented(str, this.level()));
  }

  // ..........................................................
  stringifyNode(hNode) {
    var key;
    if (this.lStack.length === 0) {
      return hNode.type;
    } else {
      ({key} = this.lStack.at(-1));
      return `${key}: ${hNode.type}`;
    }
  }

  // ..........................................................
  end(hNode) {
    this.dbg(indented(`END   ${hNode.type}`));
  }

  // ..........................................................
  getTrace() {
    return this.lLines.join("\n");
  }

};

//# sourceMappingURL=node-walker.js.map
