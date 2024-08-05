# coffee.test.coffee

import {undef, isString} from '@jdeighan/llutils'
import {slurp} from '@jdeighan/llutils/fs'
import {TextBlockList} from '@jdeighan/llutils/text-block'
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
#symbol "basicInfo(astOrCode)"

(() =>
	t = new UnitTester()
	t.transformValue = (code) ->
		return basicInfo(code).lMissing || []

	t.samelist """
		import {undef} from '@jdeighan/llutils'
		""", []

	t.samelist """
		import {undef} from '@jdeighan/llutils'
		import {LOG} from '@jdeighan/llutils/log'
		""", []

	t.samelist """
		x = a
		""", ['a']

	t.samelist """
		import {a} from 'xyz'
		x = a
		""", []

	t.samelist """
		import {a} from 'xyz'
		x = a
		""", []

	t.samelist """
		n = 23
		""", []

	t.samelist """
		n = 23
		x = n
		""", []

	t.samelist """
		import {f} from 'xyz'

		func = () =>
			f(x,y)

		f(a,b)
		""", ['x','y','a','b']

	t.samelist """
		if (f() == undef)
			console.log "Not defined"
		""", ['f', 'undef', 'console']

	t.samelist """
		x = x + y
		""", ['x', 'y']

	t.samelist """
		func = () =>
			f(x,y)
		""", ['x','y','f']

	t.samelist """
		func = () =>
			f(x,y)
		f = (m,n) =>
			console.log 'OK'
		""", ['x','y','console']

	)()

# ---------------------------------------------------------------------------

filePath = "test/brew/test.coffee"
code = slurp filePath

truthy isString(code)

blocks = new TextBlockList()
blocks.addBlock filePath, code

{orgCode, js} = brew code
truthy (orgCode == code)

blocks.addBlock 'JavaScript', js

equal blocks.asString('format=box'), '''
	┌────────  test/brew/test.coffee  ─────────┐
	│ import {undef} from '@jdeighan/llutils'  │
	│                                          │
	│ hAST = {                                 │
	│    type: 'program'                       │
	│    name: 'John'                          │
	│    }                                     │
	│                                          │
	│ equal extract(hAST, """                  │
	│    type="program"                        │
	│    """), {name: 'John'}                  │
	│                                          │
	├──────────────  JavaScript  ──────────────┤
	│ var hAST;                                │
	│                                          │
	│ import {                                 │
	│   undef                                  │
	│ } from '@jdeighan/llutils';              │
	│                                          │
	│ hAST = {                                 │
	│   type: 'program',                       │
	│   name: 'John'                           │
	│ };                                       │
	│                                          │
	│ equal(extract(hAST, `type="program"`), { │
	│   name: 'John'                           │
	│ });                                      │
	└──────────────────────────────────────────┘
	'''
