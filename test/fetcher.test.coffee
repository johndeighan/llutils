# fetcher.test.coffee

import {undef, nonEmpty} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/fetcher'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------
symbol "LineFetcher"

(() =>
	src = new LineFetcher("""
		abc
		def
		ghi
		""")
	equal src.peek(), 'abc'
	truthy src.moreLines()
	equal src.peek(), 'abc'
	equal src.fetch(), 'abc'
	truthy src.moreLines()
	equal src.fetch(), 'def'
	equal src.fetch(), 'ghi'
	falsy src.moreLines()
	equal src.fetch(), undef
	equal src.fetch(), undef
	)()

# ---------------------------------------------------------------------------
symbol "LineFetcher - filter"

(() =>
	src = new LineFetcher("""
		abc
		def
		ghi
		""")
	src.filter = (line) => return (line != 'def')

	equal src.peek(), 'abc'
	truthy src.moreLines()
	equal src.peek(), 'abc'
	equal src.fetch(), 'abc'
	truthy src.moreLines()
	equal src.fetch(), 'ghi'
	falsy src.moreLines()
	equal src.fetch(), undef
	equal src.fetch(), undef
	)()

(() =>
	src = new LineFetcher("""
		abc
		def
		ghi
		""")
	src.filter = (line) =>
		return nonEmpty(line) && ! (line.match(/^\s*#\s/))

	equal src.peek(), 'abc'
	truthy src.moreLines()
	equal src.peek(), 'abc'
	equal src.fetch(), 'abc'
	truthy src.moreLines()
	equal src.fetch(), 'def'
	equal src.fetch(), 'ghi'
	falsy src.moreLines()
	equal src.fetch(), undef
	equal src.fetch(), undef
	)()

# ---------------------------------------------------------------------------
symbol "LineFetcher - filter & transform"

(() =>
	src = new LineFetcher("""
		abc
		def
		ghi
		""")
	src.filter = (line) => return (line != 'DEF')
	src.transform = (line) => return line.toUpperCase()

	equal src.peek(), 'ABC'
	truthy src.moreLines()
	equal src.peek(), 'ABC'
	equal src.fetch(), 'ABC'
	truthy src.moreLines()
	equal src.fetch(), 'GHI'
	falsy src.moreLines()
	equal src.fetch(), undef
	equal src.fetch(), undef
	)()

# ---------------------------------------------------------------------------
symbol "LineFetcher - internal empty line"

(() =>
	src = new LineFetcher("""
		abc

		def
		""")
	equal src.peek(), 'abc'
	truthy src.moreLines()
	equal src.peek(), 'abc'
	equal src.fetch(), 'abc'
	truthy src.moreLines()
	equal src.fetch(), ''
	equal src.fetch(), 'def'
	falsy src.moreLines()
	equal src.fetch(), undef
	equal src.fetch(), undef
	)()

# ---------------------------------------------------------------------------
symbol "LineFetcher - trailing empty line"

(() =>
	src = new LineFetcher("""
		abc

		def

		""")
	equal src.peek(), 'abc'
	truthy src.moreLines()
	equal src.peek(), 'abc'
	equal src.fetch(), 'abc'
	truthy src.moreLines()
	equal src.fetch(), ''
	equal src.fetch(), 'def'
	equal src.fetch(), ''
	falsy src.moreLines()
	equal src.fetch(), undef
	equal src.fetch(), undef
	)()

# ---------------------------------------------------------------------------
symbol "PLLFetcher"

(() =>
	src = new PLLFetcher("""
		GLOBAL
			import undef
			meaning = 42
		cmdArgs
			arg (ws arg)*
				return hOptions
		""")

	equal src.peek(), [0, 'GLOBAL']
	truthy src.moreLines()
	equal src.peek(), [0, 'GLOBAL']
	equal src.fetch(), [0, 'GLOBAL']
	truthy src.moreLines()
	equal src.fetch(), [1, 'import undef']
	equal src.fetch(), [1, 'meaning = 42']
	truthy src.moreLines()
	equal src.fetch(), [0, 'cmdArgs']
	equal src.fetch(), [1, 'arg (ws arg)*']
	equal src.fetch(), [2, 'return hOptions']
	equal src.fetch(), undef
	equal src.fetch(), undef
	falsy src.moreLines()
	)()


# ---------------------------------------------------------------------------
symbol "PLLFetcher- test getBlock()"

(() =>
	src = new PLLFetcher("""
		GLOBAL
			import undef
			meaning = 42
		cmdArgs
			arg (ws arg)*
				return hOptions
		extra
		""")

	equal src.fetch(), [0, 'GLOBAL']
	equal src.getBlock(1), """
		import undef
		meaning = 42
		"""
	equal src.fetch(), [0, 'cmdArgs']
	equal src.fetch(), [1, 'arg (ws arg)*']
	equal src.getBlock(2), """
		return hOptions
		"""
	equal src.fetch(), [0, 'extra']
	equal src.fetch(), undef
	equal src.fetch(), undef
	falsy src.moreLines()
	)()

# ---------------------------------------------------------------------------
symbol "PLLFetcher - getBlock(), src has blank lines"

(() =>
	src = new PLLFetcher("""

		GLOBAL

			import undef
			meaning = 42

		cmdArgs

			arg (ws arg)*

				return hOptions

		extra
		""")

	equal src.fetch(), [0, 'GLOBAL']
	equal src.getBlock(1), """
		import undef
		meaning = 42
		"""
	equal src.fetch(), [0, 'cmdArgs']
	equal src.fetch(), [1, 'arg (ws arg)*']
	equal src.getBlock(2), """
		return hOptions
		"""
	equal src.fetch(), [0, 'extra']
	equal src.fetch(), undef
	equal src.fetch(), undef
	falsy src.moreLines()
	)()
