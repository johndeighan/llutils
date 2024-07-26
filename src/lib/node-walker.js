  // node-walker.coffee
import {
  undef,
  defined,
  notdefined,
  OL,
  getOptions,
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
  keys,
  untabify
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
  walk(hAST, hOptions = {}) {
    assert(this.isNode(hAST), `Not a node: ${OL(hAST)}`);
    this.hAST = hAST;
    ({
      trace: this.trace,
      debug: this.debug,
      hDumpNode: this.hDumpNode
    } = getOptions(hOptions, {
      trace: false,
      debug: false,
      hDumpNode: {}
    }));
    if (this.debug) {
      this.trace = true; // always trace when debugging
    }
    this.init(); // --- init() can modify the AST
    this.lStack = []; // --- Array of {key, hNode}
    this.lTrace = [];
    this.visit(this.hAST);
    this.visitChildren(this.hAST);
    this.end(this.hAST);
    return this; // allow chaining
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
      console.log(`{key: ${leftAligned(item.key, 12)}, hNode: {type: ${item.hNode.type}}}`);
    }
    console.log('-'.repeat(40));
  }

  // ..........................................................
  stackMatches(str) {
    return stackMatches(this.lStack, str);
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
  level() {
    return this.lStack.length;
  }

  // ..........................................................
  dbg(str, addLevel = 0) {
    var level;
    if (this.trace) {
      level = this.level() + addLevel;
      str = '  '.repeat(level) + str;
      console.log(str);
    }
  }

  // ..........................................................
  // --- By default, children are visited in normal order
  //     to change, override this
  getChildKeys(hNode) {
    return keys(hNode);
  }

  // ..........................................................
  visitChildren(hNode) {
    var h, j, k, key, len, len1, ref, value;
    ref = this.getChildKeys(hNode);
    for (j = 0, len = ref.length; j < len; j++) {
      key = ref[j];
      value = hNode[key];
      this.lStack.push({key, hNode});
      if (this.isNode(value)) {
        this.visit(value);
        this.visitChildren(value);
        this.end(value);
      } else if (this.isArrayOfNodes(value)) {
        for (k = 0, len1 = value.length; k < len1; k++) {
          h = value[k];
          this.visit(h);
          this.visitChildren(h);
          this.end(h);
        }
      }
      this.lStack.pop();
    }
  }

  // ..........................................................
  // --- Override these
  init(hAST = undef) {
    // --- ADVICE: if you modify the AST,
    //             pass in a cloned version
    if (defined(hAST)) {
      this.hAST = hAST;
    }
  }

  // ..........................................................
  // --- override to add details to a traced node
  traceDetail(hNode) {
    return undef;
  }

  // ..........................................................
  visit(hNode) {
    var details, str, type;
    ({type} = hNode);
    if (details = this.traceDetail(hNode)) {
      this.dbg(`VISIT ${this.stringifyNode(hNode)} ${details}`);
    } else {
      this.dbg(`VISIT ${this.stringifyNode(hNode)}`);
    }
    if (this.hDumpNode[type]) {
      DUMP(hNode, type);
    }
    str = this.stringifyNode(hNode);
    this.lTrace.push(indented(str, this.level()));
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
    return this.lTrace.join("\n");
  }

};

//# sourceMappingURL=node-walker.js.map
