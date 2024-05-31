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
    this.lEnvironments = []; // --- stack of Set objects
    this.hImports = {}; // --- {<src>: <Set obj>, ...}
    this.setExports = new Set();
    return this.setUsed = new Set();
  }

  // ..........................................................
  pushEnv(set) {
    this.lEnvironments.push(set);
  }

  // ..........................................................
  popEnv() {
    return this.lEnvironments.pop();
  }

  // ..........................................................
  inEnv(name) {
    var i, len, ref, set;
    ref = this.lEnvironments;
    for (i = 0, len = ref.length; i < len; i++) {
      set = ref[i];
      if (set.has(name)) {
        return true;
      }
    }
    return false;
  }

  // ..........................................................
  addUsed(name) {
    if (!this.inEnv(name)) {
      this.setUsed.add(name);
    }
  }

  // ..........................................................
  addImport(src, name) {
    if (hasKey(this.hImports, src)) {
      this.hImports[src].add(name);
    } else {
      this.hImports[src] = new Set([name]);
    }
  }

  // ..........................................................
  addExport(name) {
    assert(!this.setExports.has(name), `Export already declared: ${OL(name)}`);
    this.setExports.add(name);
  }

  // ..........................................................
  getMissing() {
    var i, len, ref, ref1, ref2, setMissing, src, val;
    setMissing = new Set();
    ref = this.setUsed.values();
    for (val of ref) {
      setMissing.add(val);
    }
    ref1 = keys(this.hImports);
    for (i = 0, len = ref1.length; i < len; i++) {
      src = ref1[i];
      ref2 = this.hImports[src].values();
      for (val of ref2) {
        setMissing.delete(val);
      }
    }
    return setMissing;
  }

  // ..........................................................
  analyzeExpr(type, hNode) {
    var left, operator, right;
    // --- Add all identifiers used in this expression
    switch (type) {
      case 'AssignmentExpression':
        ({left, operator, right} = hNode);
        if (right.type === 'Identifier') {
          this.addUsed(right.name);
        }
    }
  }

  // ..........................................................
  end(type, hNode) {
    switch (type) {
      case 'ArrowFunctionExpression':
        this.popEnv();
    }
  }

  // ..........................................................
  //    @level() gives you the level
  //    @lStack is stack of {key, hNode} to get parents
  visit(type, hNode) {
    var declaration, exportKind, expression, i, importKind, imported, j, left, len, len1, operator, params, parm, results, right, set, source, spec, specifiers, src;
    super.visit(type, hNode);
    switch (type) {
      case 'ImportDeclaration':
        ({importKind, specifiers, source} = hNode);
        if (importKind !== 'value') {
          return;
        }
        if (source.type !== 'StringLiteral') {
          return;
        }
        src = source.value;
        results = [];
        for (i = 0, len = specifiers.length; i < len; i++) {
          spec = specifiers[i];
          ({type, imported} = spec);
          if (type !== 'ImportSpecifier') {
            continue;
          }
          if ((imported != null ? imported.type : void 0) === 'Identifier') {
            results.push(this.addImport(src, imported.name));
          } else {
            results.push(void 0);
          }
        }
        return results;
        break;
      case 'ExportNamedDeclaration':
        ({exportKind, declaration} = hNode);
        if (exportKind !== 'value') {
          return;
        }
        if (notdefined(declaration)) {
          return;
        }
        ({type, left, right} = declaration);
        if (left.type === 'Identifier') {
          return this.addExport(left.name);
        }
        break;
      case 'ExpressionStatement':
        ({expression} = hNode);
        return this.analyzeExpr(expression.type, expression);
      case 'BinaryExpression':
        ({left, operator, right} = hNode);
        if (left.type === 'Identifier') {
          this.addUsed(left.name);
        }
        if (right.type === 'Identifier') {
          return this.addUsed(right.name);
        }
        break;
      case 'ArrowFunctionExpression':
        ({params} = hNode);
        set = new Set();
        if (defined(params)) {
          for (j = 0, len1 = params.length; j < len1; j++) {
            parm = params[j];
            if (parm.type === 'Identifier') {
              set.add(parm.name);
            }
          }
        }
        return this.pushEnv(set);
    }
  }

};

//# sourceMappingURL=ast-walker.js.map
