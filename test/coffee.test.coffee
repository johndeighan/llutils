# coffee.test.coffee

import test from 'ava'

import {undef} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/coffee'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------
#symbol brew(code) - compile coffee code

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
#symbol brewFile(filePath) - compile coffee code

(() =>
	filePath = './test/coffee/test1.coffee'
	equal brewFile(filePath).js, """
		var v;

		v = 5;
		"""
	)()

# ---------------------------------------------------------------------------
#symbol toAST(code) - compile coffee code to an AST

succeeds () => toAST('v = 5')
fails () => toAST('let v = 5')
