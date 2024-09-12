// peggy.test.coffee
var exprPath, parseExpr;

import {
  undef,
  splitStr
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/peggy';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

exprPath = './test/peggy/expr.peggy';

parseExpr = (await getParser(exprPath));

// ---------------------------------------------------------------------------
//symbol matchExprSplitter(str)    # --- returns [str, skipLen]
(() => {
  var expect, str;
  str = "result: expr DO {add(result)} lChars: [A-Z]+";
  expect = "result: expr & {add(result);return true;} lChars: [A-Z]+";
  return equal(splitStr(str, meSplitter).join(' '), expect);
})();

// ---------------------------------------------------------------------------
//symbol "procPeggy(code, hMeta, hOptions)"    # --- compile peggy code
succeeds(() => {
  return procPeggy(`start
	"abc"
		return 42
	"def"
		return 13`, {
    type: 'coffee'
  });
});

// ---------------------------------------------------------------------------
//symbol "getParser(filePath)"    # --- get parser

// --- This has already been executed
// parseExpr = await getParser(exprPath)
equal(parseExpr('2+2'), 4);

equal(parseExpr('3*5'), 15);

fails(() => {
  return parseExpr('*44');
});

equal(parseExpr('2 + 2'), 4);

equal(parseExpr('(2 + 4) * 3'), 18);

like(parseExpr('3.14 * 5'), 15.7);

// ---------------------------------------------------------------------------
succeeds(function() {
  var writer;
  return writer = new ByteCodeWriter();
});

//# sourceMappingURL=peggy.test.js.map
