// node-walker.coffee
var hasProp = {}.hasOwnProperty;

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
  isString,
  isArray,
  isHash,
  hasKey,
  keys
} from '@jdeighan/llutils';

import {
  indented,
  undented
} from '@jdeighan/llutils/indent';

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
  level() {
    return this.lStack.length;
  }

  // ..........................................................
  isNode(item) {
    return isHash(item) && hasKey(item, 'type');
  }

  // ..........................................................
  isArrayOfNodes(item) {
    var i, len, x;
    if (!isArray(item)) {
      return false;
    }
    for (i = 0, len = item.length; i < len; i++) {
      x = item[i];
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
    this.visit(hAST);
    this.visitChildren(hAST);
    this.end(hAST);
    return this; // allow chaining
  }

  
    // ..........................................................
  visitChildren(hNode) {
    var i, key, len, value;
    for (key in hNode) {
      if (!hasProp.call(hNode, key)) continue;
      value = hNode[key];
      this.lStack.push({key, hNode});
      if (this.isNode(value)) {
        this.visit(value);
        this.visitChildren(value);
        this.end(value);
      } else if (this.isArrayOfNodes(value)) {
        for (i = 0, len = value.length; i < len; i++) {
          hNode = value[i];
          this.visit(hNode);
          this.visitChildren(hNode);
          this.end(hNode);
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
  visit(hNode) {
    this.dbg(indented(`VISIT ${hNode.type}`));
    this.lLines.push(indented(this.stringify(hNode), this.level()));
  }

  // ..........................................................
  stringify(hNode) {
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
