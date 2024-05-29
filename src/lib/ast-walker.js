  // ast-walker.coffee
import {
  undef,
  defined,
  notdefined,
  listdiff,
  hasKey,
  assert,
  croak,
  DUMP,
  dclone,
  keys,
  OL
} from '@jdeighan/llutils';

import {
  NodeWalker,
  stackMatches
} from '@jdeighan/llutils/node-walker';

// ---------------------------------------------------------------------------
export var ASTWalker = class ASTWalker extends NodeWalker {
  init() {
    super.init();
    this.hImports = {}; // --- {<src>: [<ident>,...], ...}
    this.lExports = [];
    return this.lUsed = [];
  }

  // ..........................................................
  addImport(src, ident) {
    if (hasKey(this.hImports, src)) {
      assert(!this.hImports[src].includes(ident), `Import already declared: ${OL(ident)}`);
      this.hImports[src].push(ident);
    } else {
      this.hImports[src] = [ident];
    }
  }

  // ..........................................................
  addExport(ident) {
    assert(!this.lExports.includes(ident), `Export already declared: ${OL(ident)}`);
    this.lExports.push(ident);
  }

  // ..........................................................
  addUsed(ident) {
    assert(!this.lUsed.includes(ident), `Used symbol already declared: ${OL(ident)}`);
    this.lUsed.push(ident);
  }

  // ..........................................................
  getNeeded() {
    var i, lNeeded, len, ref, src;
    lNeeded = dclone(this.lUsed);
    ref = keys(this.hImports);
    for (i = 0, len = ref.length; i < len; i++) {
      src = ref[i];
      lNeeded = listdiff(lNeeded, this.hImports[src]);
    }
    return lNeeded;
  }

  // ..........................................................
  //    @level() gives you the level
  //    @lStack is stack of {key, hNode} to get parents
  visit(type, hNode) {
    var name, src;
    super.visit(type, hNode);
    switch (type) {
      case 'Identifier':
        assert(hasKey(hNode, 'name'), `No name key: ${OL(hNode)}`);
        ({name} = hNode);
        if (this.debug) {
          console.log(`Identifier: ${OL(name)}`);
          this.dumpStack();
        }
        if (this.stackMatches(`imported: ImportSpecifier
specifiers: ImportDeclaration`)) {
          src = this.lStack.at(-2).hNode.source.value;
          this.addImport(src, name);
        }
        if (this.stackMatches(`right: AssignmentExpression
declaration: ExportNamedDeclaration`)) {
          this.addUsed(name);
        }
        if (this.stackMatches(`left: AssignmentExpression
declaration: ExportNamedDeclaration`)) {
          return this.addExport(name);
        }
    }
  }

};

//# sourceMappingURL=ast-walker.js.map
