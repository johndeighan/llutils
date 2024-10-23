# indent.tabs.test.coffee

import {undef, spaces, tabs} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/indent'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# USE TABS

# ---------------------------------------------------------------------------
#symbol "indentLevel(str)"

(() =>
	equal indentLevel('abc'), 0
	equal indentLevel('\tabc'), 1
	equal indentLevel('\t\tabc'), 2
	fails () => indentLevel('\t abc')
	fails () => indentLevel(' \tabc')
	equal indentLevel('abc'), 0
	)()

(() =>
	equal indentLevel('abc'), 0
	equal indentLevel('\tabc'), 1
	equal indentLevel('\t\tabc'), 2
	)()

# ---------------------------------------------------------------------------
#symbol "splitLine(line, oneIndent)"

(() =>
	equal splitLine('abc'), [0, 'abc']
	equal splitLine('\t\tabc'), [2, 'abc']
	)()

(() =>
	equal splitLine('\tabc'), [1, 'abc']

	# --- fails since we're now expecting TABs
	fails () =>  splitLine('      abc')
	)()

# ---------------------------------------------------------------------------
#symbol "indented(input, level, oneIndent)"

(() =>
	equal indented('abc'), '\tabc'
	equal indented('abc', 2), '\t\tabc'
	)()

(() =>
	equal indentLevel('\tabc'), 1
	equal indented('abc', 2), tabs(2) + 'abc'
	)()

# --- Test with blocks

(() =>
	equal indented("""
		first line
		\tsecond line
		\t\tthird line
		"""), """
		\tfirst line
		\t\tsecond line
		\t\t\tthird line
		"""

	equal indented("""
		first line
		\tsecond line
		\t\tthird line
		""", 2), """
		\t\tfirst line
		\t\t\tsecond line
		\t\t\t\tthird line
		"""

	# --- Test with arrays

	equal indented([
		'first line'
		'\tsecond line'
		'\t\tthird line'
		]), [
		'\tfirst line'
		'\t\tsecond line'
		'\t\t\tthird line'
		]

	equal indented([
		'first line'
		'\tsecond line'
		'\t\tthird line'
		], 2), [
		'\t\tfirst line'
		'\t\t\tsecond line'
		'\t\t\t\tthird line'
		]
	)()

# ---------------------------------------------------------------------------
#symbol "undented(input)"
(() =>
	equal undented("""
		\tabc
		\t\tdef
		\t\t\tghi
		"""), """
		abc
		\tdef
		\t\tghi
		"""
	)()
