// peggy.test.coffee
var exprPath, parseExpr;

import {
  undef
} from '@jdeighan/llutils';

import * as lib from '@jdeighan/llutils/peggy';

Object.assign(global, lib);

import * as lib2 from '@jdeighan/llutils/utest';

Object.assign(global, lib2);

exprPath = './test/peggy/expr.peggy';

parseExpr = (await getParser(exprPath));

// ---------------------------------------------------------------------------
//symbol "peggify(code, hMeta, hOptions)"    # --- compile peggy code
succeeds(() => {
  return peggify(`start
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

//# sourceMappingURL=peggy.test.js.map
