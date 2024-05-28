// CoffeeScript can be used both on the server, as a command-line compiler based
// on Node.js/V8, or to run CoffeeScript directly in the browser. This module
// contains the main entry functions for tokenizing, parsing, and compiling
// source CoffeeScript into JavaScript.
var FILE_EXTENSIONS, Lexer, SourceMap, base64encode, checkShebangLine, compile, getSourceMap, helpers, lexer, packageJson, parser, registerCompiled, withPrettyErrors;

({Lexer} = require('./lexer'));

({parser} = require('./parser'));

helpers = require('./helpers');

SourceMap = require('./sourcemap');

// Require `package.json`, which is two levels above this file, as this file is
// evaluated from `lib/coffeescript`.
packageJson = require('../../package.json');

// --- The current CoffeeScript version number.
exports.VERSION = packageJson.version;

exports.FILE_EXTENSIONS = FILE_EXTENSIONS = ['.coffee', '.litcoffee', '.coffee.md'];

// --- Expose helpers for testing.
exports.helpers = helpers;

({getSourceMap, registerCompiled} = SourceMap);

// This is exported to enable an external module to implement caching of
// sourcemaps. This is used only when `patchStackTrace` has been called to adjust
// stack traces for files with cached source maps.
exports.registerCompiled = registerCompiled;

// Function that allows for btoa in both nodejs and the browser.
base64encode = function(src) {
  switch (false) {
    case typeof Buffer !== 'function':
      return Buffer.from(src).toString('base64');
    case typeof btoa !== 'function':
      // The contents of a `<script>` block are encoded via UTF-16, so if any extended
      // characters are used in the block, btoa will fail as it maxes out at UTF-8.
      // See https://developer.mozilla.org/en-US/docs/Web/API/WindowBase64/Base64_encoding_and_decoding#The_Unicode_Problem
      // for the gory details, and for the solution implemented here.
      return btoa(encodeURIComponent(src).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
      }));
    default:
      throw new Error('Unable to base64 encode inline sourcemap.');
  }
};

// Function wrapper to add source file information to SyntaxErrors thrown by the
// lexer/parser/compiler.
withPrettyErrors = function(fn) {
  return function(code, options = {}) {
    var err;
    try {
      return fn.call(this, code, options);
    } catch (error) {
      err = error;
      if (typeof code !== 'string') { // Support `CoffeeScript.nodes(tokens)`.
        throw err;
      }
      throw helpers.updateSyntaxError(err, code, options.filename);
    }
  };
};

// Compile CoffeeScript code to JavaScript, using the Coffee/Jison compiler.

// If `options.sourceMap` is specified, then `options.filename` must also be
// specified. All options that can be passed to `SourceMap#generate` may also
// be passed here.

// This returns a javascript string, unless `options.sourceMap` is passed,
// in which case this returns a `{js, v3SourceMap, sourceMap}`
// object, where sourceMap is a sourcemap.coffee#SourceMap object, handy for
// doing programmatic lookups.

// ---------------------------------------------------------------------------
exports.compile = compile = withPrettyErrors(function(code, options = {}) {
  var ast, currentColumn, currentLine, encoded, filename, fragment, fragments, generateSourceMap, header, i, j, js, len, len1, map, newLines, nodes, range, ref, sourceCodeLastLine, sourceCodeNumberOfLines, sourceMapDataURI, sourceURL, token, tokens, transpiler, transpilerOptions, transpilerOutput, v3SourceMap;
  // --- Clone `options`
  options = Object.assign({}, options);
  generateSourceMap = options.sourceMap || options.inlineMap || (options.filename == null);
  filename = options.filename || helpers.anonymousFileName();
  checkShebangLine(filename, code);
  if (generateSourceMap) {
    map = new SourceMap();
  }
  tokens = lexer.tokenize(code, options);
  // --- Pass a list of referenced variables, so that
  //     generated variables won’t get the same name.
  options.referencedVars = (function() {
    var i, len, results;
    results = [];
    for (i = 0, len = tokens.length; i < len; i++) {
      token = tokens[i];
      if (token[0] === 'IDENTIFIER') {
        results.push(token[1]);
      }
    }
    return results;
  })();
  // --- Check for import or export; if found, force bare mode.
  if (!((options.bare != null) && options.bare === true)) {
    for (i = 0, len = tokens.length; i < len; i++) {
      token = tokens[i];
      if ((ref = token[0]) === 'IMPORT' || ref === 'EXPORT') {
        options.bare = true;
        break;
      }
    }
  }
  // --- This contains the AST inside it
  nodes = parser.parse(tokens);
  // If all that was requested was a POJO representation of the nodes, e.g.
  // the abstract syntax tree (AST), we can stop now and just return that
  // (after fixing the location data for the root/`File`»`Program` node,
  // which might’ve gotten misaligned from the original source due to the
  // `clean` function in the lexer).
  if (options.ast) {
    nodes.allCommentTokens = helpers.extractAllCommentTokens(tokens);
    sourceCodeNumberOfLines = (code.match(/\r?\n/g) || '').length + 1;
    sourceCodeLastLine = /.*$/.exec(code)[0];
    ast = nodes.ast(options);
    range = [0, code.length];
    ast.start = ast.program.start = range[0];
    ast.end = ast.program.end = range[1];
    ast.range = ast.program.range = range;
    ast.loc.start = ast.program.loc.start = {
      line: 1,
      column: 0
    };
    ast.loc.end.line = ast.program.loc.end.line = sourceCodeNumberOfLines;
    ast.loc.end.column = ast.program.loc.end.column = sourceCodeLastLine.length;
    ast.tokens = tokens;
    return ast;
  }
  fragments = nodes.compileToFragments(options);
  currentLine = 0;
  if (options.header) {
    currentLine += 1;
  }
  if (options.shiftLine) {
    currentLine += 1;
  }
  currentColumn = 0;
  js = "";
  for (j = 0, len1 = fragments.length; j < len1; j++) {
    fragment = fragments[j];
    // Update the sourcemap with data from each fragment.
    if (generateSourceMap) {
      // Do not include empty, whitespace, or semicolon-only fragments.
      if (fragment.locationData && !/^[;\s]*$/.test(fragment.code)) {
        map.add([fragment.locationData.first_line, fragment.locationData.first_column], [currentLine, currentColumn], {
          noReplace: true
        });
      }
      newLines = helpers.count(fragment.code, "\n");
      currentLine += newLines;
      if (newLines) {
        currentColumn = fragment.code.length - (fragment.code.lastIndexOf("\n") + 1);
      } else {
        currentColumn += fragment.code.length;
      }
    }
    // Copy the code from each fragment into the final JavaScript.
    js += fragment.code;
  }
  if (options.header) {
    header = `Generated by CoffeeScript ${this.VERSION}`;
    js = `// ${header}\n${js}`;
  }
  if (generateSourceMap) {
    v3SourceMap = map.generate(options, code);
  }
  if (options.transpile) {
    if (typeof options.transpile !== 'object') {
      // This only happens if run via the Node API and `transpile` is set to
      // something other than an object.
      throw new Error('The transpile option must be given an object with options to pass to Babel');
    }
    // Get the reference to Babel that we have been passed if this compiler
    // is run via the CLI or Node API.
    transpiler = options.transpile.transpile;
    delete options.transpile.transpile;
    transpilerOptions = Object.assign({}, options.transpile);
    // See https://github.com/babel/babel/issues/827#issuecomment-77573107:
    // Babel can take a v3 source map object as input in `inputSourceMap`
    // and it will return an *updated* v3 source map object in its output.
    if (v3SourceMap && (transpilerOptions.inputSourceMap == null)) {
      transpilerOptions.inputSourceMap = v3SourceMap;
    }
    transpilerOutput = transpiler(js, transpilerOptions);
    js = transpilerOutput.code;
    if (v3SourceMap && transpilerOutput.map) {
      v3SourceMap = transpilerOutput.map;
    }
  }
  if (options.inlineMap) {
    encoded = base64encode(JSON.stringify(v3SourceMap));
    sourceMapDataURI = `//# sourceMappingURL=data:application/json;base64,${encoded}`;
    sourceURL = `//# sourceURL=${filename}`;
    js = `${js}\n${sourceMapDataURI}\n${sourceURL}`;
  }
  registerCompiled(filename, code, map);
  if (options.sourceMap) {
    return {
      js,
      sourceMap: map,
      v3SourceMap: JSON.stringify(v3SourceMap, null, 2)
    };
  } else {
    return js;
  }
});

// ---------------------------------------------------------------------------

// Tokenize a string of CoffeeScript code, and return the array of tokens.
exports.tokens = withPrettyErrors(function(code, options) {
  return lexer.tokenize(code, options);
});

// Parse a string of CoffeeScript code or an array of lexed tokens, and
// return the AST. You can then compile it by calling `.compile()` on the root,
// or traverse it by using `.traverseChildren()` with a callback.
exports.nodes = withPrettyErrors(function(source, options) {
  if (typeof source === 'string') {
    source = lexer.tokenize(source, options);
  }
  return parser.parse(source);
});

// This file used to export these methods; leave stubs that throw warnings
// instead. These methods have been moved into `index.coffee` to provide
// separate entrypoints for Node and non-Node environments, so that static
// analysis tools don’t choke on Node packages when compiling for a non-Node
// environment.
exports.run = exports.eval = exports.register = function() {
  throw new Error('require index.coffee, not this file');
};

// Instantiate a Lexer for our use here.
lexer = new Lexer();

// The real Lexer produces a generic stream of tokens. This object provides a
// thin wrapper around it, compatible with the Jison API. We can then pass it
// directly as a “Jison lexer.”
parser.lexer = {
  yylloc: {
    range: []
  },
  options: {
    ranges: true
  },
  lex: function() {
    var tag, token;
    token = parser.tokens[this.pos++];
    if (token) {
      [tag, this.yytext, this.yylloc] = token;
      parser.errorToken = token.origin || token;
      this.yylineno = this.yylloc.first_line;
    } else {
      tag = '';
    }
    return tag;
  },
  setInput: function(tokens) {
    parser.tokens = tokens;
    return this.pos = 0;
  },
  upcomingInput: function() {
    return '';
  }
};

// Make all the AST nodes visible to the parser.
parser.yy = require('./nodes');

// Override Jison's default error handling function.
parser.yy.parseError = function(message, {token}) {
  var errorLoc, errorTag, errorText, errorToken, tokens;
  // Disregard Jison's message, it contains redundant line number information.
  // Disregard the token, we take its value directly from the lexer in case
  // the error is caused by a generated token which might refer to its origin.
  ({errorToken, tokens} = parser);
  [errorTag, errorText, errorLoc] = errorToken;
  errorText = (function() {
    switch (false) {
      case errorToken !== tokens[tokens.length - 1]:
        return 'end of input';
      case errorTag !== 'INDENT' && errorTag !== 'OUTDENT':
        return 'indentation';
      case errorTag !== 'IDENTIFIER' && errorTag !== 'NUMBER' && errorTag !== 'INFINITY' && errorTag !== 'STRING' && errorTag !== 'STRING_START' && errorTag !== 'REGEX' && errorTag !== 'REGEX_START':
        return errorTag.replace(/_START$/, '').toLowerCase();
      default:
        return helpers.nameWhitespaceCharacter(errorText);
    }
  })();
  // The second argument has a `loc` property, which should have the location
  // data for this token. Unfortunately, Jison seems to send an outdated `loc`
  // (from the previous token), so we take the location information directly
  // from the lexer.
  return helpers.throwSyntaxError(`unexpected ${errorText}`, errorLoc);
};

exports.patchStackTrace = function() {
  var formatSourcePosition, getSourceMapping;
  // Based on http://v8.googlecode.com/svn/branches/bleeding_edge/src/messages.js
  // Modified to handle sourceMap
  formatSourcePosition = function(frame, getSourceMapping) {
    var as, column, fileLocation, filename, functionName, isConstructor, isMethodCall, line, methodName, source, tp, typeName;
    filename = void 0;
    fileLocation = '';
    if (frame.isNative()) {
      fileLocation = "native";
    } else {
      if (frame.isEval()) {
        filename = frame.getScriptNameOrSourceURL();
        if (!filename) {
          fileLocation = `${frame.getEvalOrigin()}, `;
        }
      } else {
        filename = frame.getFileName();
      }
      filename || (filename = "<anonymous>");
      line = frame.getLineNumber();
      column = frame.getColumnNumber();
      // Check for a sourceMap position
      source = getSourceMapping(filename, line, column);
      fileLocation = source ? `${filename}:${source[0]}:${source[1]}` : `${filename}:${line}:${column}`;
    }
    functionName = frame.getFunctionName();
    isConstructor = frame.isConstructor();
    isMethodCall = !(frame.isToplevel() || isConstructor);
    if (isMethodCall) {
      methodName = frame.getMethodName();
      typeName = frame.getTypeName();
      if (functionName) {
        tp = as = '';
        if (typeName && functionName.indexOf(typeName)) {
          tp = `${typeName}.`;
        }
        if (methodName && functionName.indexOf(`.${methodName}`) !== functionName.length - methodName.length - 1) {
          as = ` [as ${methodName}]`;
        }
        return `${tp}${functionName}${as} (${fileLocation})`;
      } else {
        return `${typeName}.${methodName || '<anonymous>'} (${fileLocation})`;
      }
    } else if (isConstructor) {
      return `new ${functionName || '<anonymous>'} (${fileLocation})`;
    } else if (functionName) {
      return `${functionName} (${fileLocation})`;
    } else {
      return fileLocation;
    }
  };
  getSourceMapping = function(filename, line, column) {
    var answer, sourceMap;
    sourceMap = getSourceMap(filename, line, column);
    if (sourceMap != null) {
      answer = sourceMap.sourceLocation([line - 1, column - 1]);
    }
    if (answer != null) {
      return [answer[0] + 1, answer[1] + 1];
    } else {
      return null;
    }
  };
  // Based on [michaelficarra/CoffeeScriptRedux](http://goo.gl/ZTx1p)
  // NodeJS / V8 have no support for transforming positions in stack traces using
  // sourceMap, so we must monkey-patch Error to display CoffeeScript source
  // positions.
  return Error.prepareStackTrace = function(err, stack) {
    var frame, frames;
    frames = (function() {
      var i, len, results;
      results = [];
      for (i = 0, len = stack.length; i < len; i++) {
        frame = stack[i];
        if (frame.getFunction() === exports.run) {
          // Don’t display stack frames deeper than `CoffeeScript.run`.
          break;
        }
        results.push(`		at ${formatSourcePosition(frame, getSourceMapping)}`);
      }
      return results;
    })();
    return `${err.toString()}\n${frames.join('\n')}\n`;
  };
};

checkShebangLine = function(file, input) {
  var args, firstLine, ref, rest;
  firstLine = input.split(/$/m, 1)[0];
  rest = firstLine != null ? firstLine.match(/^#!\s*([^\s]+\s*)(.*)/) : void 0;
  args = rest != null ? (ref = rest[2]) != null ? ref.split(/\s/).filter(function(s) {
    return s !== '';
  }) : void 0 : void 0;
  if ((args != null ? args.length : void 0) > 1) {
    console.error(`The script to be run begins with a shebang line with more than one
argument. This script will fail on platforms such as Linux which only
allow a single argument.`);
    console.error(`The shebang line was: '${firstLine}' in file '${file}'`);
    return console.error(`The arguments were: ${JSON.stringify(args)}`);
  }
};

//# sourceMappingURL=coffeescript.js.map
