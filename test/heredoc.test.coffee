# heredoc.test.coffee

import {
	undef, defined, notdefined, nonEmpty,
	isString, OL, CWS, behead, blockToArray,
	assert, croak,
	} from '@jdeighan/llutils'
import {undented} from '@jdeighan/llutils/indent'
import * as lib from '@jdeighan/llutils/heredoc'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------
symbol "lineToParts(line)"

equal lineToParts('this is not a heredoc'), [
	'this is not a heredoc'
	]

equal lineToParts('this <<< is <<< heredoc'), [
	'this '
	'<<<'
	' is '
	'<<<'
	' heredoc'
	]

equal lineToParts('<<< is <<< heredoc'), [
	''
	'<<<'
	' is '
	'<<<'
	' heredoc'
	]

equal lineToParts('this <<< is <<<'), [
	'this '
	'<<<'
	' is '
	'<<<'
	''
	]

equal lineToParts('<<< is <<<'), [
	''
	'<<<'
	' is '
	'<<<'
	''
	]

equal lineToParts('<<<'), [
	''
	'<<<'
	''
	]

equal lineToParts('<<<<<<'), [
	''
	'<<<'
	''
	'<<<'
	''
	]

# ---------------------------------------------------------------------------
symbol "mapHereDoc()"

equal mapHereDoc("""
		abc
		def
		"""),
		'"abc\\ndef"'

# ---------------------------------------------------------------------------

equal mapHereDoc("""
		===
		abc
		def
		"""),
		'"abc\\ndef"'

# ---------------------------------------------------------------------------

equal mapHereDoc("""
		...
		abc
		def
		"""),
		'"abc def"'

# ---------------------------------------------------------------------------

equal mapHereDoc("""
		---
		a: 1
		b: 2
		"""),
		'{"a":1,"b":2}'

# ---------------------------------------------------------------------------

equal mapHereDoc("""
		---
		- a
		- b
		"""),
		'["a","b"]'

# ---------------------------------------------------------------------------
symbol "HereDocTester - a custom tester"

class HereDocTester extends UnitTester

	transformValue: (block) ->

		return mapHereDoc(block)

tester = new HereDocTester()

# ------------------------------------------------------------------------
# Default heredoc type is a block

tester.equal """
		this is a
		block of text
		""",
		'"this is a\\nblock of text"'

# ------------------------------------------------------------------------
# Make explicit that the heredoc type is a block

tester.equal """
		===
		this is a
		block of text
		""",
		'"this is a\\nblock of text"'

# ------------------------------------------------------------------------
# One Line block

tester.equal """
		...this is a
		line of text
		""",
		'"this is a line of text"'

# ------------------------------------------------------------------------
# One Line block

tester.equal """
		...
		this is a
		line of text
		""",
		'"this is a line of text"'

# ---------------------------------------------------------------------------
symbol "MatrixHereDoc - custom heredoc"

class MatrixHereDoc extends BaseHereDoc

	map: (block) ->
		# --- if block starts with a digit
		if notdefined(block.match(/^\s*\d/s))
			return undef
		lArray = for line in blockToArray(block)
			line.split(/\s+/).map((str) => parseInt(str))
		return JSON.stringify(lArray)

addHereDocType 'matrix', new MatrixHereDoc()

tester.equal """
		1 2 3
		2 4 6
		""",
		'[[1,2,3],[2,4,6]]'

# ------------------------------------------------------------------------
symbol "UCHereDoc = custom heredoc"

class UCHereDoc extends BaseHereDoc

	map: (block) ->

		if (block.indexOf('^^^') != 0)
			return undef

		block = block.substring(4).toUpperCase()
		return JSON.stringify(block)

addHereDocType 'upper case', new UCHereDoc()

tester.equal """
		^^^
		This is a
		block of text
		""",
		'"THIS IS A\\nBLOCK OF TEXT"'

# ---------------------------------------------------------------------------
symbol "UCHereDoc1 - custom heredoc"

#
#     e.g. with header line ***,
#     we'll create an upper-cased single line string

class UCHereDoc2 extends BaseHereDoc

	map: (block) ->

		[head, rest] = behead(block)
		if (head != '***')
			return undef
		block = CWS(rest.toUpperCase())
		result = JSON.stringify(block)
		return result

addHereDocType 'upper case 2', new UCHereDoc2()

# ---------------------------------------------------------------------------

tester.equal """
		***
		select ID,Name
		from Users
		""",
		'"SELECT ID,NAME FROM USERS"'

# ---------------------------------------------------------------------------
symbol "TAML heredoc"

tester.equal """
		---
		- abc
		- def
		""",
		'["abc","def"]'

# ---------------------------------------------------------------------------
# TAML-like block, but actually a block

tester.equal """
		===
		---
		- abc
		- def
		""",
		'"---\\n- abc\\n- def"'

# ---------------------------------------------------------------------------
# TAML block 2

tester.equal """
		---
		-
			label: Help
			url: /help
		-
			label: Books
			url: /books
		""",
		'[{"label":"Help","url":"/help"},{"label":"Books","url":"/books"}]'

# ---------------------------------------------------------------------------
symbol "HereDocReplacer - custom tester"

class HereDocReplacer extends UnitTester

	transformValue: (block) ->

		[head, rest] = behead(block)
		lNewParts = for part in lineToParts(head)
			if part == '<<<'
				mapHereDoc(undented(rest))
			else
				part    # keep as is

		result = lNewParts.join('')
		return result

replacer = new HereDocReplacer()

# ---------------------------------------------------------------------------

replacer.equal """
		TopMenu lItems={<<<}
			---
			-
				label: Help
				url: /help
			-
				label: Books
				url: /books
		""", """
		TopMenu lItems={[{"label":"Help","url":"/help"},{"label":"Books","url":"/books"}]}
		"""

# ---------------------------------------------------------------------------

replacer.equal """
		<TopMenu lItems={<<<}>
			---
			-
				label: Help
				url: /help
			-
				label: Books
				url: /books
		""", """
		<TopMenu lItems={[{"label":"Help","url":"/help"},{"label":"Books","url":"/books"}]}>
		"""
