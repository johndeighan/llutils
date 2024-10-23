# utest.test.coffee

import {isString, OL, assert} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/utest'
Object.assign(global, lib)

# ---------------------------------------------------------------------------

equal 2+2, 4
like {a:1, b:2, c:3}, {a:1, c:3}
notequal 2+2, 5
truthy 42
falsy false
includes "this is a long sentence", "long"
includes ['a','b','c'], 'b'
matches "another 42 lines", /\d+/
fails () => throw new Error("bad")
succeeds () => return 'me'
like "abc\n", "abc"           # strings are right trimmed
like "abc\n", "abc   "

# ---------------------------------------------------------------------------

(() =>
	u = new UnitTester()
	u.transformValue = (val) =>
		assert isString(val), "val is #{val}"
		return val.toUpperCase()

	u.equal 'abc', 'ABC'
	)()

# ---------------------------------------------------------------------------
# --- test samelines

samelines """
	abc
	def
	""", """
	def
	abc
	"""

samelines """
	abc

	def
	""", """
	def
	abc
	"""

samelines """
	abc
	def
	""", """
	def

	abc
	"""

# ---------------------------------------------------------------------------
# --- test throws()

(() =>
	func = () =>
		JSON.parse('{"key": 42,}')
		return

	fails func
	)()

(() =>
	func = () =>
		JSON.parse('{"key": 42,}')
		return

	throws func, SyntaxError
	)()

(() =>
	func = () =>
		JSON.parse('{"key": 42}')
		return

	succeeds func
	)()
