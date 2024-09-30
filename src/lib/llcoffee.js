  // llcoffee.coffee
import {
  compile
} from 'coffeescript';

import {
  undef,
  defined,
  OL,
  isString,
  getOptions,
  removeKeys,
  words,
  assert,
  croak,
  isEmpty,
  nonEmpty,
  blockToArray
} from '@jdeighan/llutils';

import {
  isFile,
  readTextFile
} from '@jdeighan/llutils/fs';

import {
  NodeWalker
} from '@jdeighan/llutils/node-walker';

// ---------------------------------------------------------------------------
export var analyzeCoffee = function(code, hMetaData) {
  return {
    hMetaData,
    contents: code,
    lDependencies: getCoffeeDependencies(code)
  };
};

// ---------------------------------------------------------------------------
export var analyzeCoffeeFile = function(filePath) {
  var contents, hMetaData;
  // --- get file contents, including meta data
  ({hMetaData, contents} = readTextFile(filePath, 'eager'));
  return analyzeCoffee(contents, hMetaData);
};

// ---------------------------------------------------------------------------
export var getCoffeeDependencies = (code) => {
  var ImportWalker, lDependencies, walker;
  lDependencies = [];
  ImportWalker = class ImportWalker extends NodeWalker {
    visit(hNode) {
      var source;
      super.visit(hNode);
      if (hNode.type === 'ImportDeclaration') {
        source = hNode.source.value;
        return lDependencies.push(source);
      }
    }

  };
  walker = new ImportWalker();
  walker.walk(toAST(code));
  return lDependencies;
};

// ---------------------------------------------------------------------------
export var procCoffee = function(contents, hMetaData = {}, filePath = undef, hOptions = {}) {
  var code, debug, shebang, v3SourceMap;
  // --- meta data can be used to add a shebang line
  //     if true, use "#!/usr/bin/env node"
  //     else use value of shebang key

  // --- filePath is used to check for a source map
  //     without it, no source map is produced
  assert(isString(contents), `Not a string: ${OL(contents)}`);
  assert(nonEmpty(contents), `Empty contents: ${OL(contents)}`);
  ({debug} = getOptions(hOptions, {
    debug: false
  }));
  ({shebang} = getOptions(hMetaData, {
    shebang: undef
  }));
  if (defined(filePath)) {
    ({
      js: code,
      v3SourceMap
    } = compile(contents, {
      sourceMap: true,
      bare: true,
      header: false,
      filename: filePath
    }));
  } else {
    code = compile(contents, {
      bare: true,
      header: false
    });
    v3SourceMap = undef;
  }
  assert(defined(code), "No JS generated");
  code = code.trim();
  if (defined(shebang)) {
    if (isString(shebang)) {
      code = `${shebang}\n${code}`;
    } else {
      code = `#!/usr/bin/env node\n${code}`;
    }
  }
  return {
    code,
    sourceMap: v3SourceMap
  };
};

// ---------------------------------------------------------------------------
export var procCoffeeFile = function(filePath, hOptions = {}) {
  var contents, hMetaData;
  assert(isFile(filePath), `No such file: ${OL(filePath)}`);
  ({hMetaData, contents} = readTextFile(filePath, 'eager'));
  return procCoffee(contents, hMetaData, filePath, hOptions);
};

// ---------------------------------------------------------------------------
export var toAST = (code, hOptions = {}) => {
  var hAST, minimal;
  ({minimal} = getOptions(hOptions, {
    minimal: false
  }));
  hAST = compile(code, {
    ast: true
  });
  if (minimal) {
    removeExtraASTKeys(hAST);
  }
  return hAST;
};

// ---------------------------------------------------------------------------
export var toASTFile = function(code, filePath, hOptions = {}) {
  var hAST;
  hAST = toAST(code, hOptions);
  barf(JSON.stringify(hAST, null, "\t"), filePath);
};

// ---------------------------------------------------------------------------
export var removeExtraASTKeys = (hAST) => {
  removeKeys(hAST, words('loc range extra start end', 'directives comments tokens'));
  return hAST;
};

// ---------------------------------------------------------------------------

//# sourceMappingURL=llcoffee.js.map
