# ast-walker.test.coffee

import {
	undef, defined, notdefined, hasKey, dclone,
	assert, words
	} from '@jdeighan/llutils'
import {coffeeInfo} from '@jdeighan/llutils/coffee'
import * as lib from '@jdeighan/llutils/ast-walker'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------
symbol "coffeeInfo(codeOrAST)"

(() =>
	code = """
		export x = y
		export func1 = (arg) => return 13
		export func2 = (arg) -> return 13
		"""
	equal coffeeInfo(code).setExports, new Set(['x','func1','func2'])
	)()

(() =>
	code = """
		import {
			undef, defined, notdefined,
			} from '@jdeighan/llutils'
		"""
	equal coffeeInfo(code).hImports, {
		'@jdeighan/llutils': new Set(['undef','defined','notdefined'])
		}
	)()

# ---------------------------------------------------------------------------

(() =>
	code = """
		import {
			undef, defined, notdefined,
			} from '@jdeighan/llutils'
		import {withExt} from '@jdeighan/llutils/fs'
		"""
	equal coffeeInfo(code).hImports, {
		'@jdeighan/llutils': new Set(['undef','defined','notdefined'])
		'@jdeighan/llutils/fs': new Set(['withExt'])
		}
	)()

# ---------------------------------------------------------------------------

(() =>
	code = """
		export x = 42
		"""
	equal coffeeInfo(code).setExports, new Set(['x'])
	)()

# ---------------------------------------------------------------------------

fails () => coffeeInfo("""
	export x = 33
	export x = 42
	""")

# ---------------------------------------------------------------------------

(() =>
	code = """
		export x = 42
		export y = func(33)
		"""
	equal coffeeInfo(code).setExports, new Set(['x','y'])
	)()

