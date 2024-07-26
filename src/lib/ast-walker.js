  // ast-walker.coffee
import {
  undef,
  defined,
  notdefined,
  listdiff,
  hasKey,
  words,
  assert,
  croak,
  dclone,
  keys,
  OL,
  removeKeys,
  isString,
  nonEmpty,
  setsAreEqual
} from '@jdeighan/llutils';

import {
  DUMP
} from '@jdeighan/llutils/dump';

import {
  extract
} from '@jdeighan/llutils/data-extractor';

import {
  NodeWalker,
  stackMatches
} from '@jdeighan/llutils/node-walker';

import {
  EnvNodeStack
} from '@jdeighan/llutils/env-stack';

// ---------------------------------------------------------------------------
export var removeExtraASTKeys = (hAST) => {
  removeKeys(hAST, words('loc range extra start end', 'directives comments tokens'));
  return hAST;
};

// ---------------------------------------------------------------------------
export var ASTWalker = class ASTWalker extends NodeWalker {
  init() {
    // --- clone AST, remove extra keys
    this.hAST = removeExtraASTKeys(dclone(this.hAST));
    this.envStack = new EnvNodeStack();
    this.hImports = {}; // --- {<src>: <Set>, ...}
    this.importsSet = new Set();
    this.exportsSet = new Set();
    this.missingSet = new Set();
    this.missingFuncSet = new Set(); // missing only if never defined
    // at top level
    this.usedSet = new Set();
    this.dbgMissingSet = new Set();
    return this.dbgMissingFuncSet = new Set();
  }

  // ..........................................................
  getTopLevelSymbols() {
    return Array.from(this.envStack.topLevelSet);
  }

  // ..........................................................
  getSymbols(type) {
    var h, i, len, lib, ref, setUnused;
    switch (type) {
      case 'exports':
        return Array.from(this.exportsSet.values());
      case 'imports':
        return Array.from(this.importsSet.values());
      case 'detailed-imports':
        h = {};
        ref = keys(this.hImports);
        for (i = 0, len = ref.length; i < len; i++) {
          lib = ref[i];
          h[lib] = Array.from(this.hImports[lib]);
        }
        return h;
      case 'missing':
        return Array.from(this.missingSet.values());
      case 'used':
        return Array.from(this.usedSet.values());
      case 'unused':
        setUnused = this.importsSet.difference(this.usedSet);
        return Array.from(setUnused);
      case 'toplevel':
        return Array.from(this.envStack.topLevelSet);
      default:
        croak(`getSymbols(): Bad type ${OL(type)}`);
    }
  }

  // ..........................................................
  addDefined(name) {
    this.dbg(`DEFINED: ${OL(name)}`, 1);
    this.envStack.add(name);
  }

  // ..........................................................
  addUsed(name) {
    this.usedSet.add(name);
    if (!this.envStack.inCurEnv(name)) {
      this.dbg(`USED: ${OL(name)} - missing`, 1);
      this.missingSet.add(name);
    } else {
      this.dbg(`USED: ${OL(name)}`, 1);
    }
  }

  // ..........................................................
  addUsedFunc(name) {
    this.usedSet.add(name);
    if (!this.envStack.inCurEnv(name)) {
      this.dbg(`USED: ${OL(name)} - missing func`, 1);
      this.missingFuncSet.add(name);
    } else {
      this.dbg(`USED: ${OL(name)}`, 1);
    }
  }

  // ..........................................................
  addImport(src, name) {
    assert(isString(name), `Not a string: ${OL(name)}`);
    assert(nonEmpty(name), `Not empty: ${OL(name)}`);
    this.importsSet.add(name);
    if (hasKey(this.hImports, src)) {
      this.hImports[src].add(name);
    } else {
      this.hImports[src] = new Set([name]);
    }
    this.addDefined(name);
  }

  // ..........................................................
  addExport(name) {
    assert(!this.exportsSet.has(name), `Export already declared: ${OL(name)}`);
    this.exportsSet.add(name);
  }

  // ..........................................................
  addMissing(name) {
    this.missingSet.add(name);
  }

  // ..........................................................
  addMissingFunc(name) {
    this.missingFuncSet.add(name);
  }

  // ..........................................................
  addMissingFunc(name) {
    this.missingFuncSet.add(name);
  }

  // ..........................................................
  traceDetail(hNode) {
    switch (hNode.type) {
      case 'Identifier':
        return hNode.name;
      default:
        return undef;
    }
  }

  // ..........................................................
  getChildKeys(hNode) {
    var type;
    ({type} = hNode);
    if (type === 'AssignmentExpression') {
      return ['right', 'left'];
    } else {
      return super.getChildKeys(hNode);
    }
  }

  // ..........................................................
  dbgChanges(which, type) {
    var item, ref, ref1;
    if (!setsAreEqual(this.dbgMissingSet, this.missingSet)) {
      this.dbg(`(lMissing = ${OL([...this.missingSet])})`);
      this.dbgMissingSet.clear();
      ref = this.missingSet.values();
      for (item of ref) {
        this.dbgMissingSet.add(item);
      }
    }
    if (!setsAreEqual(this.dbgMissingFuncSet, this.missingFuncSet)) {
      this.dbg(`(lMissingFuncs = ${OL([...this.missingFuncSet])})`);
      this.dbgMissingFuncSet.clear();
      ref1 = this.missingFuncSet.values();
      for (item of ref1) {
        this.dbgMissingFuncSet.add(item);
      }
    }
  }

  // ..........................................................
  end(hNode) {
    var left, name, operator, ref, right, type;
    ({type} = hNode);
    switch (type) {
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        debugger;
        this.envStack.endEnv();
        break;
      case 'File':
        ref = this.missingFuncSet;
        for (name of ref) {
          if (!this.envStack.inCurEnv(name)) {
            this.dbg(`FINALLY: ${OL(name)} still missing`);
            this.missingSet.add(name);
          }
        }
        this.envStack.endEnv();
        break;
      case 'AssignmentExpression':
        ({left, operator, right} = hNode);
        if ((left.type === 'Identifier') && left.declaration) {
          this.addDefined(left.name);
        }
    }
    this.dbgChanges('END', type);
  }

  // ..........................................................
  //    @level() gives you the level
  //    @lStack is stack of {key, hNode} to get parents
  visit(hNode) {
    var callee, calleeName, calleeType, h, i, j, k, lArgs, left, len, len1, len2, name, operator, params, parm, right, specifiers, src, type;
    super.visit(hNode);
    ({type} = hNode);
    switch (type) {
      case 'ImportDeclaration':
        ({src, specifiers} = extract(hNode, `importKind="value"
!source
	type="StringLiteral"
	value as src
specifiers`));
        for (i = 0, len = specifiers.length; i < len; i++) {
          h = specifiers[i];
          assert(h.type === 'ImportSpecifier', "Bad");
          name = h.imported.name;
          this.addImport(src, name);
        }
        break;
      case 'ExportNamedDeclaration':
        ({name} = extract(hNode, `exportKind="value"
declaration
	type="AssignmentExpression"
	left.type="Identifier"
	left.name`));
        this.addExport(name);
        break;
      case 'AssignmentExpression':
        ({right} = hNode);
        if (right.type === 'Identifier') {
          this.addUsed(right.name);
        }
        break;
      case 'BinaryExpression':
        ({left, operator, right} = hNode);
        if (left.type === 'Identifier') {
          this.addUsed(left.name);
        }
        if (right.type === 'Identifier') {
          this.addUsed(right.name);
        }
        break;
      case 'CallExpression':
      case 'NewExpression':
        debugger;
        h = extract(hNode, `callee
	type as calleeType
	?name as calleeName
[arguments as lArgs]
	type
	name`);
        ({callee, calleeType, calleeName, lArgs} = h);
        if (calleeType === 'Identifier') {
          this.addUsedFunc(calleeName, true);
        } else if ((calleeType === 'MemberExpression') && (callee.object.type === 'Identifier')) {
          this.addUsed(callee.object.name);
        }
        for (j = 0, len1 = lArgs.length; j < len1; j++) {
          ({type, name} = lArgs[j]);
          if (type === 'Identifier') {
            this.addUsed(name);
          }
        }
        break;
      case 'FunctionExpression':
      case 'ArrowFunctionExpression':
        this.envStack.addEnv();
        this.dbg("ADD ENV");
        ({params} = hNode);
        if (defined(params)) {
          for (k = 0, len2 = params.length; k < len2; k++) {
            parm = params[k];
            if (parm.type === 'Identifier') {
              this.addDefined(parm.name);
            }
          }
        }
    }
    return this.dbgChanges('VISIT', type);
  }

};

//# sourceMappingURL=ast-walker.js.map
