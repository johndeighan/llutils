# coffee.test.coffee

import {undef} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/coffee'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------
#symbol "brew(code)"

succeeds () => brew('v = 5')
fails () => brew('let v = 5')
equal brew('v = 5').js, """
	var v;

	v = 5;
	"""

equal brew('v = 5', {shebang: true}).js, """
	#!/usr/bin/env node
	var v;

	v = 5;
	"""

equal brew('v = 5', {shebang: 'abc'}).js, """
	abc
	var v;

	v = 5;
	"""

# ---------------------------------------------------------------------------
#symbol "brewFile(filePath)"

(() =>
	filePath = './test/coffee/test1.coffee'
	equal brewFile(filePath).js, """
		var v;

		v = 5;
		"""
	)()

# ---------------------------------------------------------------------------
#symbol "toAST(code)"

succeeds () => toAST('v = 5')
fails () => toAST('let v = 5')

# ---------------------------------------------------------------------------
#symbol "coffeeInfo(astOrCode)"

(() =>
	code = """
		import {undef, defined} from '@jdeighan/llutils'
		"""
	like coffeeInfo(code), {
		hImports: {'@jdeighan/llutils': ['undef','defined']}
		}
	)()

(() =>
	code = """
		import {undef} from '@jdeighan/llutils'
		import {LOG} from '@jdeighan/llutils/log'
		"""
	like coffeeInfo(code), {
		hImports: {
			'@jdeighan/llutils': ['undef']
			'@jdeighan/llutils/log': ['LOG']
			}
		}
	)()

(() =>
	code = """
		export meaning = 42
		"""
	like coffeeInfo(code), {
		lExports: ['meaning']
		}
	)()

(() =>
	code = """
		x = a
		"""
	like coffeeInfo(code), {
		lUsed: ['a']
		}
	)()
