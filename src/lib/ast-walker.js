  // ast-walker.coffee
import {
  undef,
  defined,
  notdefined,
  listdiff
} from '@jdeighan/llutils';

import {
  NodeWalker
} from '@jdeighan/llutils/node-walker';

// ---------------------------------------------------------------------------
export var ASTWalker = class ASTWalker extends NodeWalker {
  init() {
    this.lImports = [];
    this.lExports = [];
    return this.lUsed = [];
  }

  getImports() {
    return this.lImports;
  }

  getExports() {
    return this.lExports;
  }

  getUsed() {
    return this.lUsed;
  }

  getNeeded() {
    return listdiff(this.lUsed, this.lImports);
  }

  // ..........................................................
  //    @level() gives you the level
  //    @lStack is stack of {key, hNode} to get parents
  visit(type, hNode) {
    return super.visit(type, hNode);
  }

};

//# sourceMappingURL=ast-walker.js.map
