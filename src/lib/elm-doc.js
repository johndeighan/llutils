// elm-doc.coffee
var hKnownSymbols, hSymbols, hTypes, i, j, lTypes, len, len1, lib, mapType, name, ref, ref1;

import {
  undef,
  defined,
  notdefined,
  assert,
  croak,
  hasKey,
  keys,
  isTAML,
  fromTAML,
  OL,
  isEmpty,
  nonEmpty,
  isString,
  isHash,
  isArray,
  escapeStr
} from '@jdeighan/llutils';

import {
  SectionMap
} from '@jdeighan/llutils/section-map';

// ---------------------------------------------------------------------------

// An Elm AST has the following types:
//    module
//       name
//       lFuncDefs
//    funcDef
//       name
//       lParms    - an array of identifiers
//       lStmts
//    funcApply
//       name
//       lArgs
//    const
//       value
// ---------------------------------------------------------------------------
export var ElmDocument = class ElmDocument extends SectionMap {
  constructor(outfile = undef) {
    super(['header', 'imports', 'code']);
    this.outfile = outfile;
    this.hImports = {}; // --- symbols that must be imported
    this.section('imports').converter = (block) => {
      return this.importStr();
    };
    this.section('imports').add('imports'); // --- shouldn't be needed
    this.hDefinedFuncs = {}; // --- {<name>: <arity>, ... }
  }

  
    // ..........................................................
  addImport(name, lArgs) {
    var lSymbols, lTypes, lib, numArgs;
    assert(defined(hSymbols[name]), `Unknown symbol: ${OL(name)}`);
    ({lib, lTypes} = hSymbols[name]);
    numArgs = lTypes.length;
    assert(lArgs.length === lTypes.length, `arity mismatch in ${OL(name)}`);
    if (hasKey(this.hImports, lib)) {
      lSymbols = this.hImports[lib];
      if (!lSymbols.includes(name)) {
        lSymbols.push(name);
      }
    } else {
      this.hImports[lib] = [name];
    }
  }

  // ..........................................................
  getStmt(hStmt) {
    var arg, i, lArgs, lParts, len, name, str, value;
    assert(isHash(hStmt), `stmt not a hash: ${OL(hStmt)}`);
    switch (hStmt.type) {
      case 'funcApply':
        ({name, lArgs} = hStmt);
        if (isString(lArgs)) {
          lArgs = [lArgs];
        }
        // --- Add import, if needed
        this.addImport(name, lArgs);
        lParts = [name];
        for (i = 0, len = lArgs.length; i < len; i++) {
          arg = lArgs[i];
          if (isString(arg)) {
            str = escapeStr(arg, {
              hEsc: {
                "\r": '\\r',
                "\n": '\\n',
                "\t": '\\t'
              }
            });
            lParts.push(`\"${str}\"`);
          } else {
            croak("Not implemented");
          }
        }
        return lParts.join(' ');
      case 'const':
        ({value} = hStmt);
        return OL(value);
      default:
        croak(`Not a stmt: ${OL(hStmt)}`);
    }
  }

  // ..........................................................
  addFuncDef(hAST, level) {
    var hStmt, i, lParms, lStmts, len, name;
    assert(isHash(hAST), `Not a hash: ${OL(hAST)}`);
    assert(hAST.type === 'funcDef', "Not a function def");
    ({name, lParms, lStmts} = hAST);
    assert(nonEmpty(name), `Empty name: ${OL(name)}`);
    assert(!hasKey(this.hDefinedFuncs, name), `Function ${OL(name)} is already defined`);
    this.hDefinedFuncs[name] = lParms.length;
    this.section('code').add(level, `${name} =`);
    for (i = 0, len = lStmts.length; i < len; i++) {
      hStmt = lStmts[i];
      this.section('code').add(level + 1, this.getStmt(hStmt));
    }
  }

  // ..........................................................
  addModule(hAST) {
    var hDef, i, lFuncDefs, len, name;
    if (isTAML(hAST)) {
      hAST = fromTAML(hAST);
    }
    assert(isHash(hAST), `Not a hash: ${OL(hAST)}`);
    assert(hAST.type === 'module', "Not a module");
    ({name, lFuncDefs} = hAST);
    assert(nonEmpty(name), `Empty module name: ${OL(name)}`);
    this.section('header').add(`module ${name} exposing(main)\n`);
    for (i = 0, len = lFuncDefs.length; i < len; i++) {
      hDef = lFuncDefs[i];
      this.addFuncDef(hDef, 0);
    }
  }

  // ..........................................................
  importStr() {
    var i, lLines, lSymbols, len, lib, ref, str;
    lLines = [];
    ref = keys(this.hImports);
    for (i = 0, len = ref.length; i < len; i++) {
      lib = ref[i];
      lSymbols = this.hImports[lib];
      str = lSymbols.join(',');
      lLines.push(`import ${lib} exposing(${str})`);
    }
    return lLines.join("\n") + "\n";
  }

};

// ---------------------------------------------------------------------------
hTypes = {
  attr: 'Element.Attribute',
  lAttr: 'list Element.Attribute',
  lElem: 'list Element.Element'
};

mapType = (str) => {
  if (defined(hTypes[str])) {
    return hTypes[str];
  } else {
    return str;
  }
};

hKnownSymbols = {
  Element: [['layout', ['lAttr', 'lElem']], ['text', ['String']], ['row', []], ['width', ['Int']], ['centerX', []], ['centerY', []], ['spacing', ['Int']], ['padding', ['Int']], ['el', ['lAttr']], ['rgb255', ['Int', 'Int', 'Int']], ['alignRight', []], ['alignLeft', []], ['alignCenter', []]]
};

hSymbols = {};

ref = keys(hKnownSymbols);
for (i = 0, len = ref.length; i < len; i++) {
  lib = ref[i];
  ref1 = hKnownSymbols[lib];
  for (j = 0, len1 = ref1.length; j < len1; j++) {
    [name, lTypes] = ref1[j];
    hSymbols[name] = {
      lib,
      lTypes: lTypes.map(mapType)
    };
  }
}

//# sourceMappingURL=elm-doc.js.map
