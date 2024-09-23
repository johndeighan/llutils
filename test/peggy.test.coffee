# peggy.test.coffee

import {undef, splitStr} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/peggy'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

exprPath = './test/peggy/expr.peggy'
parseExpr = await getParser(exprPath)

# ---------------------------------------------------------------------------
#symbol matchExprSplitter(str)    # --- returns [str, skipLen]

(() =>
	str = "result: expr DO {add(result)} lChars: [A-Z]+"
	expect = "result: expr & {add(result);return true;} lChars: [A-Z]+"

	equal splitStr(str, meSplitter).join(' '), expect
	)()

# ---------------------------------------------------------------------------
#symbol "procPeggy(code, hMeta, hOptions)"    # --- compile peggy code

succeeds () => procPeggy("""
	start
		"abc"
			return 42
		"def"
			return 13
	""", {type: 'coffee'})

# ---------------------------------------------------------------------------
#symbol "getParser(filePath)"    # --- get parser

# --- This has already been executed
# parseExpr = await getParser(exprPath)

equal parseExpr('2+2'), 4
equal parseExpr('3*5'), 15
fails () => parseExpr('*44')
equal parseExpr('2 + 2'), 4
equal parseExpr('(2 + 4) * 3'), 18
like parseExpr('3.14 * 5'), 15.7

# ---------------------------------------------------------------------------

succeeds () ->
	writer = new ByteCodeWriter()

# ---------------------------------------------------------------------------

succeeds () ->
	dumper = new OpDumper()

# ---------------------------------------------------------------------------
#symbol "getTracer(type, inputStr, hVars={})"

(() =>
	tracer = getTracer('advanced')

	equal tracer.traceStr({
		type: 'rule.enter'
		rule: 'start'
		}), """
		? start
		"""

	equal tracer.traceStr({
		type: 'rule.fail'
		}, 1), """
		└─> FAIL
		"""

	equal tracer.traceStr({
		type: 'rule.match'
		}, 1), """
		└─> YES
		"""

	equal tracer.traceStr({
		type: 'rule.match'
		result: 'IDENT'
		}, 1), """
		└─> "IDENT"
		"""

	equal tracer.traceStr({
		type: 'rule.enter'
		rule: 'start'
		}, 1), """
		│  ? start
		"""

	equal tracer.traceStr({
		type: 'string.fail'
		}, 1), """
		x   string
		"""

	equal tracer.traceStr({
		type: 'rule.match'
		}, 1), """
		└─> YES
		"""

	equal tracer.traceStr({
		type: 'rule.match'
		result: 'IDENT'
		}, 1), """
		└─> "IDENT"
		"""

	)()
