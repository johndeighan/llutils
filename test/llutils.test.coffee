# llutils.test.coffee

import eq from 'deep-equal'
import * as lib from '@jdeighan/llutils'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------
#symbol "undef"   # --- a synonym for undefined

equal undef, undefined
notequal undef, 23

# ---------------------------------------------------------------------------
#symbol "eq()"   # --- deep equality

truthy eq('abc', 'abc')
truthy eq(13, 13)
truthy eq(['a','b'], ['a', 'b'])
truthy eq({a:1, b:2}, {b:2, a:1})

falsy eq('abc', ['abc'])
falsy eq(['a','b'], ['b', 'a'])
falsy eq({a:1, b:2}, {a:1, b:2, c:3})

# ---------------------------------------------------------------------------
#symbol "dclone()"    # --- deep clone

equal dclone({a:1, b:['a',3,'z']}), {a:1, b:['a',3,'z']}

# ---------------------------------------------------------------------------
#symbol "pass()"    # --- do nothing

succeeds () => pass()

# ---------------------------------------------------------------------------
#symbol "range(n)"   # --- build iterable of ints

equal Array.from(range(10)), [0,1,2,3,4,5,6,7,8,9]

# ---------------------------------------------------------------------------
#symbol "inRange(i, n)"   # --- test that (i >= 0) && (i < n)

truthy inRange(0, 5)
truthy inRange(2, 5)
truthy inRange(4, 5)
falsy  inRange(5, 5)
falsy  inRange(10, 5)

# ---------------------------------------------------------------------------
#symbol "rev_range(n)"   # --- build iterable of ints

equal Array.from(rev_range(10)), [9,8,7,6,5,4,3,2,1,0]

# ---------------------------------------------------------------------------
#symbol "add_s(n)"    # --- add an 's' for plural things

equal add_s(0), 's'
equal add_s(1), ''
equal add_s(2), 's'
equal add_s(99), 's'

# ---------------------------------------------------------------------------
#symbol "assert(cond, msg)"    # --- assert some condition

fails () => assert(2 == 3)
succeeds () => assert(2 == 2)

# ---------------------------------------------------------------------------
#symbol "croak(msg)"    # --- throw an exception

fails () => croak("bad")

# ---------------------------------------------------------------------------
# --- define some objects for later testing

s = 'abc'
b = true
n = 3.14159
i = 42
l = [1, 2]
h = {a:1, b:2}
f = (x) -> return 2*x
r = /^a*$/
c = class Dummy
	constructor: (@name='my name') ->
		@key = 'nothing'
o = new c()
p = new Promise((resolve,reject) => return 42)
g = () ->
	yield 'a'
	yield 'b'
	yield 'c'
	return

# ---------------------------------------------------------------------------
#symbol "defined(obj)"    # --- equal a value defined

truthy defined(s)
truthy defined(i)
truthy defined(n)
truthy defined(l)
truthy defined(h)
truthy defined(c)
truthy defined(o)

falsy defined(undef)
falsy defined(null)

# ---------------------------------------------------------------------------
#symbol "notdefined(obj)"    # --- equal a value not defined

truthy notdefined(undef)
truthy notdefined(null)

falsy notdefined(s)
falsy notdefined(i)
falsy notdefined(n)
falsy notdefined([1,2])
falsy notdefined({a:1, b:2})
falsy notdefined(c)
falsy notdefined(o)

# ---------------------------------------------------------------------------
#symbol "words(str...)"    # --- extract words from 1 or more strings

equal words(), []
equal words(' ab cd', 'ef gh '), ['ab','cd','ef','gh']

# ---------------------------------------------------------------------------
#symbol "isString(obj)"    # --- test if obj equal a string

truthy isString('abc')
truthy isString('abc', {nonempty: true})

falsy isString(undef)
falsy isString(['abc'])
falsy isString('', {nonempty: true})

# ---------------------------------------------------------------------------
#symbol "isBoolean(obj)"    # --- test if obj equal a boolean

truthy isBoolean(true)
truthy isBoolean(false)
truthy isBoolean(new Boolean(true))

falsy isBoolean(s)

# ---------------------------------------------------------------------------
#symbol "isNumber(obj)"    # --- test if obj equal a number

truthy isNumber(i)
truthy isNumber(n)

falsy isNumber('abc')
falsy isNumber(undef)
falsy isNumber(['abc'])

# ---------------------------------------------------------------------------
#symbol "isInteger(obj)"    # --- test if obj equal n integer

truthy isInteger(i)

falsy isInteger(n)
falsy isInteger('abc')
falsy isInteger(undef)
falsy isInteger(['abc'])

# ---------------------------------------------------------------------------
#symbol "isArray(obj)"    # --- test if obj equal an array

truthy isArray(['abc'])
truthy isArray(['abc'], 'nonempty')
truthy isArray(['abc','def'], 'allStrings')

falsy isArray('abc')
falsy isArray(undef)
falsy isArray([], {nonempty: true})
falsy isArray([], 'nonempty')
falsy isArray(['abc', []], {allStrings: true})
falsy isArray(['abc', []], 'allStrings')

# ---------------------------------------------------------------------------
#symbol "isHash(obj)"    # --- test if obj equal a hash

truthy isHash({a:1, b:2})

falsy isHash('abc')
falsy isHash(undef)
falsy isHash(o)

# ---------------------------------------------------------------------------
#symbol "isFunction(obj)"    # --- test if obj equal a function

truthy isFunction(() -> return 'abc')

falsy isFunction(s)

# ---------------------------------------------------------------------------
#symbol "isRegExp(obj)"    # --- test if obj equal a regular expression

truthy isRegExp(/^abc$/)

falsy isRegExp(s)

# ---------------------------------------------------------------------------
#symbol "isClass(obj)"    # --- test if obj equal a class

truthy isClass(class NewClass)

falsy isClass(s)

# ---------------------------------------------------------------------------
#symbol "isPromise(obj)"    # --- test if obj equal a promise

truthy isPromise(p)

falsy isPromise(s)

# ---------------------------------------------------------------------------
#symbol "isClassInstance(obj)"    # --- test if obj equal a class instance

truthy isClassInstance(o)

falsy isClassInstance(s)

# ---------------------------------------------------------------------------
#symbol "escapeStr(str)"

equal escapeStr("\t\tabc def"), "→→abc˳def"
equal escapeStr("\t\tabc def\r\n"), "→→abc˳def←↓"
equal escapeStr("\t\tabc def\r\nghi", 'escNoNL'), """
		→→abc˳def←
		ghi
		"""

# ---------------------------------------------------------------------------
#symbol "OL(x)"

equal OL(undef), 'undef'
equal OL(null), 'null'
equal OL('abc def'), '"abc˳def"'
equal OL([1,2]), '[1,2]'
equal OL({a:1, b:2}), '{"a":1,"b":2}'
equal OL({a:'a', b:'b'}), '{"a":"a","b":"b"}'

# ---------------------------------------------------------------------------
#symbol "CWS"    # --- trim & collapse whitespace to ' '

equal CWS("""

		abc
		def
				ghi

		"""), "abc def ghi"

# ---------------------------------------------------------------------------
#symbol "ML(x)"

equal ML(undef), '.undef.'
equal ML(null), '.null.'
equal ML(true), 'true'
equal ML(false), 'false'
equal ML('abc def'), '"abc˳def"'
equal ML([1,2]), """
		[
			1,
			2
		]
		"""
equal ML({a:1, b:2}), """
		{
			"a": 1,
			"b": 2
		}
		"""
equal ML({a:'a', b:'b'}), """
		{
			"a": "a",
			"b": "b"
		}
		"""
equal ML({
		meaning: 42
		parse: (str) => return 42
		}), """
	{
		"meaning": 42,
		"parse": «Function parse»
	}
	"""

# ---------------------------------------------------------------------------
#symbol "OLS(lItems)"

equal OLS([[1,2], {a:1, b:2}]), '[1,2],{"a":1,"b":2}'

# ---------------------------------------------------------------------------
#symbol "isEmpty(obj)"

truthy isEmpty(undef)
truthy isEmpty(null)
truthy isEmpty('')
truthy isEmpty('   ')
truthy isEmpty([])
truthy isEmpty({})

falsy isEmpty(s)
falsy isEmpty(i)
falsy isEmpty(0)     # zero equal not empty!!!
falsy isEmpty(n)
falsy isEmpty(l)
falsy isEmpty(h)

# ---------------------------------------------------------------------------
#symbol "nonEmpty(obj)"

truthy nonEmpty(s)
truthy nonEmpty(i)
truthy nonEmpty(0)     # zero equal not empty!!!
truthy nonEmpty(n)
truthy nonEmpty(l)
truthy nonEmpty(h)

falsy nonEmpty(undef)
falsy nonEmpty(null)
falsy nonEmpty('')
falsy nonEmpty('   ')
falsy nonEmpty([])
falsy nonEmpty({})

# ---------------------------------------------------------------------------
#symbol "chomp(str)"    # --- remove trailing \r and/or \n

equal chomp("abc\n"), "abc"
equal chomp("abc\r\n"), "abc"

# ---------------------------------------------------------------------------
#symbol "hasKey(h, key)"

truthy hasKey({a:1, b:2, c:3}, 'b')

falsy hasKey({a:1, c:3}, 'b')

# ---------------------------------------------------------------------------
#symbol "removeKeys(h, lKeys)"

equal removeKeys({a:1, b:2, c:3}, ['b']), {a:1, c:3}

hash = {
	a:1
	b:2
	c:3
	lItems: [{a:1, b:2}, {b:2, c:3}]
	}
equal removeKeys(hash, ['b','c']), {
	a:1
	lItems: [{a:1}, {}]
	}

hAST = {
	body: [
		{
			declarations: Array [{start:0}],
			end: 11,
			kind: 'let',
			start: 0,
			type: 'VariableDeclaration',
			},
		],
	end: 11,
	sourceType: 'script',
	start: 0,
	type: 'Program',
	}

equal(
	removeKeys(hAST, ['start','end']), {
		body: [
			{
				declarations: Array [{}],
				kind: 'let',
				type: 'VariableDeclaration',
				},
			],
		sourceType: 'script',
		type: 'Program',
		})

hAST2 = {
	body: [
		{
			declarations: Array [{start:0}],
			end: 12,
			kind: 'let',
			start: 0,
			type: 'VariableDeclaration',
			},
		],
	end: 12,
	sourceType: 'script',
	start: 0,
	type: 'Program',
	}

equal(
	removeKeys(hAST2, ['start','end']), {
	body: [
		{
			declarations: Array [{}],
			kind: 'let',
			type: 'VariableDeclaration',
			},
		],
	sourceType: 'script',
	type: 'Program',
	})

# ---------------------------------------------------------------------------
#symbol "blockToArray(block)"    # --- split string on \r?\n

equal blockToArray(''), []
equal blockToArray("a\nb\nc"), ['a','b','c']
equal blockToArray("a\r\nb\r\nc"), ['a','b','c']

l = blockToArray("""
	abc
	def
	""")
equal l, [
	'abc'
	'def'
	]

# ---------------------------------------------------------------------------
#symbol "toArray(strOrArray)"

equal toArray(['a','b','c']), ['a','b','c']
equal toArray("""
	abc
	def
	"""), ['abc','def']

# ---------------------------------------------------------------------------
#symbol "arrayToBlock(lItems)"    # --- join lines with \n

equal arrayToBlock(['a','b','c']), "a\nb\nc"

# ---------------------------------------------------------------------------
#symbol "toBlock(strOrArray)"

equal toBlock(['a','b','c']), """
	a
	b
	c
	"""
equal toBlock("""
	abc
	def
	"""), """
	abc
	def
	"""

# ---------------------------------------------------------------------------
#symbol "listdiff(lItems, lItemsToRemove)"

equal listdiff(['a','b','c','d'], ['a','d']), ['b','c']

# ---------------------------------------------------------------------------
#symbol "untabify(str)"    # --- convert TAB to n chars

equal untabify("abc\n\tdef"), "abc\n   def"

# ---------------------------------------------------------------------------
#symbol "splitPrefix(str)"    # --- separate into indentation and rest

equal splitPrefix("   abc"), ["   ","abc"]
equal splitPrefix("\t\tabc"), ["\t\t","abc"]

# ---------------------------------------------------------------------------
#symbol "substrCount(str, substr)"

equal substrCount('   abc', ' '), 3
equal substrCount('abcabcabc', 'ab'), 3

# ---------------------------------------------------------------------------
#symbol "tabify(str)"    # --- convert leading spaces to TABs

str = """
	abc
	  def
	    ghi
	"""

equal tabify(str), "abc\n\tdef\n\t\tghi"

# ---------------------------------------------------------------------------
#symbol "gen2array(generator)"

equal gen2array(g), ['a','b','c']

# ---------------------------------------------------------------------------
#symbol "gen2block(generator)"

equal gen2block(g), """
		a
		b
		c
		"""

# ---------------------------------------------------------------------------
#symbol "spaces(n)"    # --- create a string of n spaces

equal spaces(3), '   '

# ---------------------------------------------------------------------------
#symbol "tabs(n)"    # --- create a string of n TAB chars

equal tabs(3), "\t\t\t"

# ---------------------------------------------------------------------------
#symbol "centered(n)"    # --- create a string of n TAB chars

equal centered('abcdefg', 5), 'abcdefg'
equal centered('abc', 5), ' abc '
equal centered('ab', 10, {char:'-'}), '--  ab  --'

# ---------------------------------------------------------------------------
#symbol "countChars(str, ch)"

equal countChars("abc,def", ","), 1
equal countChars(",abc,def", ","), 2
equal countChars("abc,def,", ","), 2
equal countChars(",abc,def,", ","), 3

# ---------------------------------------------------------------------------
#symbol "rtrim(str)"

equal rtrim("abc  "), "abc"
equal rtrim("abc\t\t"), "abc"
equal rtrim("abc \t"), "abc"
equal rtrim("abc"), "abc"

# ---------------------------------------------------------------------------
#symbol "now()"

succeeds () => now()

# ---------------------------------------------------------------------------
#symbol "timeit(func, numReps=100)"

succeeds () => timeit(() -> return 42)

# ---------------------------------------------------------------------------
#symbol "behead(block)"    # --- separate out first line

equal behead("""
	---
	- a
	- b
	"""), [
		'---'
		"""
		- a
		- b
		"""
		]

# ---------------------------------------------------------------------------
#symbol "isTAML(block)"    # --- must start with '---'

truthy isTAML('---\n23')
truthy isTAML('---\n{\na:1\n}')

falsy isTAML('abc')

# ---------------------------------------------------------------------------
#symbol "fromTAML(block)"

equal fromTAML("""
	---
	- a
	- b
	"""), [
	'a'
	'b'
	]

equal fromTAML("""
	---
	a: 1
	"""), {
	a: 1
	}

equal fromTAML("""
	---
	type: tree
	body:
		-
			type: stmt
			ident: abc
	"""), {
	type: 'tree'
	body: [
		{type: 'stmt', ident: 'abc'}
		]
	}

# ---------------------------------------------------------------------------
#symbol "toTAML(ds)"

equal toTAML([1,2]), """
	---
	- 1
	- 2
	"""

equal toTAML({a:1, b:2}), """
	---
	a: 1
	b: 2
	"""

equal toTAML([13, {key: 'fName', value: 'John'}]), """
	---
	- 13
	- key: fName
		value: John
	"""
# ---------------------------------------------------------------------------
#symbol "sliceBlock(block)"

(() =>
	block = """
		aaa
		bbb
		ccc
		ddd
		eee
		"""

	equal sliceBlock(block, 0, 3), """
		aaa
		bbb
		ccc
		"""

	equal sliceBlock(block, 1, 4), """
		bbb
		ccc
		ddd
		"""

	equal sliceBlock(block, 3, 4), """
		ddd
		"""
)()

# ---------------------------------------------------------------------------
#symbol "sortArrayOfHashes(lHashes)"

(() =>
	equal sortArrayOfHashes([
		{a:1}
		{a:3}
		{a:2}
		], 'a'), [
		{a:1}
		{a:2}
		{a:3}
		]

	equal sortArrayOfHashes([
		{name: 'John', age: 71}
		{name: 'Arathi', age: 35}
		{name: 'Lewis', age: 33}
		{name: 'Ben', age: 39}
		], 'name'), [
		{name: 'Arathi', age: 35}
		{name: 'Ben', age: 39}
		{name: 'John', age: 71}
		{name: 'Lewis', age: 33}
		]

	equal sortArrayOfHashes([
		{name: 'John', age: 71}
		{name: 'Arathi', age: 35}
		{name: 'Lewis', age: 33}
		{name: 'Ben', age: 39}
		], 'age'), [
		{name: 'Lewis', age: 33}
		{name: 'Arathi', age: 35}
		{name: 'Ben', age: 39}
		{name: 'John', age: 71}
		]

	)()

# ---------------------------------------------------------------------------
#symbol "cmdArgStr(lArgs=undef)"

equal cmdArgStr(["-cmd=doit"]), '-cmd=doit'
equal cmdArgStr(["-cmd=echo <file>"]), '-cmd="echo <file>"'
equal cmdArgStr(["something"]), 'something'
equal cmdArgStr(["some thing"]), '"some thing"'
equal cmdArgStr([
	"-cmd=doit"
	"-cmd=echo <file>"
	"something"
	"some thing"
	]), """
	-cmd=doit -cmd="echo <file>" something "some thing"
	"""

# ---------------------------------------------------------------------------
#symbol rpad(str, len, ch)

equal rpad('abc', 5), 'abc  '

# ---------------------------------------------------------------------------
#symbol lpad(str, len, ch)

equal lpad('abc', 5), '  abc'

# ---------------------------------------------------------------------------
#symbol zpad(str, len, ch)

equal zpad(3, 5), '00003'

# ---------------------------------------------------------------------------
#symbol findOneOf(str, lChars, pos)

equal findOneOf('abcde', ['b','d']), 1
equal findOneOf('abcde', ['b','e']), 1
equal findOneOf('ace', ['b','e']), 2
equal findOneOf('acd', ['b','e']), -1

equal findOneOf('some thing DO {xxx} CHECK {xxx} yyy', ['CHECK']), 20
equal findOneOf('some thing DO {xxx} CHECK {xxx} yyy', ['DO']), 11
equal findOneOf('some thing DO {xxx} CHECK {xxx} yyy', ['CHECK','DO']), 11
equal findOneOf('some thing DO {xxx} CHECK {xxx} yyy', ['DO','CHECK']), 11

# ---------------------------------------------------------------------------
#symbol matchPos(str, pos)

equal matchPos("(where f() = '23')"), 17
equal matchPos("{return addContext(result[1])}"), 29
equal matchPos("{return popContext()}"), 20
equal matchPos("some text {return addContext(result[1])}", 10), 39
equal matchPos("some text {return popContext()}", 10), 30

fails () => matchPos("(missing", 0)
fails () => matchPos("(miss()ing", 0)
equal matchPos("(miss()ing", 5), 6

# ---------------------------------------------------------------------------
#symbol splitString(str, func) - func is (pos, str) => [extract, newpos]

(() =>
	splitter = (str) =>
		i = str.indexOf('DO')
		if (i == -1)
			return [str.trim() || undef, str.length]
		else if (i == 0)
			return ['DO', 2]
		else
			return [str.substring(0, i).trim() || undef, i]

	equal splitStr('abc', splitter), ['abc']
	equal splitStr('abcDOxyz', splitter), ['abc','DO','xyz']
	equal splitStr('abc DO xyz', splitter), ['abc','DO','xyz']
	equal splitStr('DO   ', splitter), ['DO']
	equal splitStr('   DO', splitter), ['DO']
	equal splitStr('   DO   ', splitter), ['DO']
	)()

# ---------------------------------------------------------------------------
#symbol cleanHash(h) - removes empty values

equal cleanHash({a:1, b:undef, c:[], d:{}, e:'   '}), {a:1}

# ---------------------------------------------------------------------------
#symbol setsAreEqual(a, b)

truthy setsAreEqual(new Set([1,2,3]), new Set([1,3,2]))
falsy  setsAreEqual(new Set([1,2,3]), new Set([1,2,4]))
falsy  setsAreEqual(new Set([1,2,3]), new Set([1,2,3,4]))

# ---------------------------------------------------------------------------
#symbol tla(stub)

equal tla('low-level-build'), 'llb'
