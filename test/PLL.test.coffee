# PLL.test.coffee

import {undef, fromTAML} from '@jdeighan/llutils'
import {BaseTracer} from '@jdeighan/llutils/peggy-utils'
import {parse} from './PLL/tree.js'
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

u = new UnitTester()
u.transformValue = (block) =>
	return parse block, {tracer: new BaseTracer()}

u.transformExpected = (block) =>
	return fromTAML block

# ---------------------------------------------------------------------------

succeeds () => """
	abc
	"""

succeeds () => """
	abc
	def
	"""

succeeds () => """
	abc
		def
	"""

succeeds () => """
	abc
			def
	"""

# ---------------------------------------------------------------------------

u.equal """
	abc
	""", """
	---
	type: tree
	body:
		-
			type: stmt
			ident: abc
	"""

u.equal """
	abc
	def
	""", """
	---
	type: tree
	body:
		-
			type: stmt
			ident: abc
		-
			type: stmt
			ident: def
	"""

u.equal """
	abc
		def
	""", """
	---
	type: tree
	body:
		-
			type: stmt
			ident: abc
			children:
				-
					type: stmt
					ident: def
	"""

u.equal """
	abc
		def
			ghi
	""", """
	---
	type: tree
	body:
		-
			type: stmt
			ident: abc
			children:
				-
					type: stmt
					ident: def
					children:
						-
							type: stmt
							ident: ghi
	"""

u.equal """
	abc
			def
	""", """
	---
	type: tree
	body:
		-
			type: stmt
			ident: abc def
	"""

u.equal """
	abc
			def
	ghi
	""", """
	---
	type: tree
	body:
		-
			type: stmt
			ident: abc def
		-
			type: stmt
			ident: ghi
	"""

u.equal """
	abc
			def
		ghi
	""", """
	---
	type: tree
	body:
		-
			type: stmt
			ident: abc def
			children:
				-
					type: stmt
					ident: ghi
	"""

# ---------------------------------------------------------------------------
# --- blank lines should be ignored

u.equal "\nabc", """
	---
	type: tree
	body:
		-
			type: stmt
			ident: abc
	"""

u.equal "abc\n", """
	---
	type: tree
	body:
		-
			type: stmt
			ident: abc
	"""

u.equal "\nabc\n", """
	---
	type: tree
	body:
		-
			type: stmt
			ident: abc
	"""

u.equal """
	abc

	def
	""", """
	---
	type: tree
	body:
		-
			type: stmt
			ident: abc
		-
			type: stmt
			ident: def
	"""

u.equal """

	abc

	def

	""", """
	---
	type: tree
	body:
		-
			type: stmt
			ident: abc
		-
			type: stmt
			ident: def
	"""

u.equal """

	abc

		def

	""", """
	---
	type: tree
	body:
		-
			type: stmt
			ident: abc
			children:
				-
					type: stmt
					ident: def
	"""

u.equal """


	abc


		def


			ghi


	""", """
	---
	type: tree
	body:
		-
			type: stmt
			ident: abc
			children:
				-
					type: stmt
					ident: def
					children:
						-
							type: stmt
							ident: ghi
	"""

u.equal """

	abc


			def

	""", """
	---
	type: tree
	body:
		-
			type: stmt
			ident: abc def
	"""

u.equal """

	abc

			def

	ghi
	""", """
	---
	type: tree
	body:
		-
			type: stmt
			ident: abc def
		-
			type: stmt
			ident: ghi
	"""

u.equal """

	abc

			def

		ghi

	""", """
	---
	type: tree
	body:
		-
			type: stmt
			ident: abc def
			children:
				-
					type: stmt
					ident: ghi
	"""

