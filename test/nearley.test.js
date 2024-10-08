  // nearley.test.coffee
import {
  undef,
  defined,
  notdefined
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/nearley';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

// ---------------------------------------------------------------------------
//symbol "fixNearlyJs(jsCode)
(() => {
  var code, result;
  code = `// Generated automatically by nearley
// http://github.com/Hardmath123/nearley
(function() {
  var grammar, id;
  id = function(d) {
	 return d[0];
  };
  grammar = {
	 Lexer: void 0,
  };
  if (typeof module !== 'undefined' && typeof module.exports !== 'undefined') {
	 return module.exports = grammar;
  } else {
	 return window.grammar = grammar;
  }
})();`;
  result = fixNearlyJs(code);
  return equal(result, `// Generated automatically by nearley
// http://github.com/Hardmath123/nearley

  var grammar, id;
  id = function(d) {
	 return d[0];
  };
  grammar = {
	 Lexer: void 0,
  };
export {grammar};`);
})();

(() => {
  var code, result;
  code = `// Generated automatically by nearley, version unknown
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }
var grammar = {
	 Lexer: undefined,
	 ParserRules: [
	 {"name": "a$string$1", "symbols": [{"literal":"a"}, {"literal":"b"}, {"literal":"c"}], "postprocess": function joiner(d) {return d.join('');}},
	 {"name": "a", "symbols": ["a$string$1"]}
]
  , ParserStart: "a"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
	module.exports = grammar;
} else {
	window.grammar = grammar;
}
})();`;
  result = fixNearlyJs(code);
  return equal(result, `// Generated automatically by nearley, version unknown
// http://github.com/Hardmath123/nearley

function id(x) { return x[0]; }
var grammar = {
	 Lexer: undefined,
	 ParserRules: [
	 {"name": "a$string$1", "symbols": [{"literal":"a"}, {"literal":"b"}, {"literal":"c"}], "postprocess": function joiner(d) {return d.join('');}},
	 {"name": "a", "symbols": ["a$string$1"]}
]
  , ParserStart: "a"
}
export {grammar};`);
})();

// ---------------------------------------------------------------------------
//symbol "getNearleyParser(code, filePath=undef, hOptions)"
(async() => {
  var parser;
  parser = (await getNearleyParser(`expr ->
	  int "+" int {% ([fst, _, snd]) => fst + snd %}
	| int "-" int {% ([fst, _, snd]) => fst - snd %}
	| int "*" int {% ([fst, _, snd]) => fst * snd %}
	| int "/" int {% ([fst, _, snd]) => fst / snd %}
int -> [0-9]:+`));
  return truthy(defined(parser));
})();

// ---------------------------------------------------------------------------
//symbol "parseInput(parser, code, hMeta, hOptions)"    # --- compile nearley code

// ---------------------------------------------------------------------------
//symbol "procNearley(code, hMeta, hOptions)"    # --- compile nearley code
succeeds(() => {
  return procNearley(`start -> "abc" {%
	(data) =>
		return 42
		%}
start -> "def" {%
	(data) =>
		return 13
		%}`, {
    type: 'coffee'
  }, undef, {
    debug: true
  });
});

// ---------------------------------------------------------------------------
//symbol "getNearleyParser(code, hMeta, hOptions)"
(async() => {
  var exprPath, parseExpr;
  exprPath = './test/nearley/expr.ne';
  parseExpr = (await getNearleyParser(undef, exprPath));
  return LOG(parseExpr);
})();

//# sourceMappingURL=nearley.test.js.map
