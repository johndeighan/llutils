# utest.coffee

import test from 'ava'

import {
	undef, defined, notdefined, rtrim, isEmpty, nonEmpty, OL,
	isString, isNumber, isArray, isClass, isFunction, isRegExp, isInteger,
	assert, croak, blockToArray, untabify,
	} from '@jdeighan/llutils'
import {fileExt} from '@jdeighan/llutils/fs'
import {getMyOutsideCaller} from '@jdeighan/llutils/v8-stack'
import {toNICE} from '@jdeighan/llutils/to-nice'

# ---------------------------------------------------------------------------
# --- Available tests w/num required params
#        equal 2
#        notequal 2
#        like 2
#        samelines 2
#        truthy 1
#        falsy 1
#        includes 2
#        matches 2
#        fails 1 (a function)
#        throws 1 (a function) - check throws a specific error type
#        succeeds 1 (a function)
# ---------------------------------------------------------------------------

nextID = 1

export class UnitTester

	constructor: () ->

		@depth = 0
		@debug = false
		@hFound = {}

	# ........................................................................
	# --- returns, e.g. "test 1"

	getLabel: (tag=undef) =>

		# --- We need to figure out the line number of the caller
		{filePath, line, column} = getMyOutsideCaller()
		if @debug
			console.log "getLabel()"
			console.log "   filePath = '#{filePath}'"
			console.log "   line = #{line}, col = #{column}"

		assert isInteger(line), "getMyOutsideCaller() line = #{OL(line)}"
		assert (fileExt(filePath) == '.js') || (fileExt(filePath) == '.coffee'),
			"caller not a JS or Coffee file: #{OL(filePath)}"

		while @hFound[line]
			line += 1000
		@hFound[line] = true

		return "line #{line}"

	# ........................................................................

	transformValue: (val) -> return val
	transformExpected: (expected) -> return expected

	# ........................................................................

	begin: (val=undef, expected=undef, tag=undef) ->

		if (tag == 'symbol')
			return ["===== #{val} ====="]

		if (@depth == 0)
			@beforeEachTest()
		@depth += 1
		label = @getLabel(tag)
		if defined(val)
			try
				val = @transformValue(val)
			catch err
				val = "ERROR: #{err.message}"
		if defined(expected)
			try
				expected = @transformExpected(expected)
			catch err
				expected = "ERROR: #{err.message}"
		return [label, val, expected]

	# ........................................................................

	end: () ->

		@depth -= 1
		if (@depth == 0)
			@afterEachTest()
		return

	# ..........................................................

	beforeEachTest: () ->

		return

	# ..........................................................

	afterEachTest: () ->

		return

	# ..........................................................

	norm: (str) ->

		return rtrim(str).replaceAll("\r", "")

	# ..........................................................
	# ..........................................................

	symbol: (label) ->

		croak "Deprecated test 'symbol'"
		[label] = @begin(label, undef, 'symbol')
		test label, (t) =>
			t.is(1, 1)
		@end()
		return

	# ..........................................................

	equal: (val, expected) ->

		[label, val, expected] = @begin(val, expected, 'equal')
		test label, (t) =>
			t.deepEqual(val, expected)
		@end()
		return

	# ..........................................................

	notequal: (val, expected) ->

		[label, val, expected] = @begin(val, expected, 'notequal')
		test label, (t) =>
			t.notDeepEqual(val, expected)
		@end()
		return

	# ..........................................................

	like: (val, expected) ->

		[label, val, expected] = @begin(val, expected, 'like')
		if isString(val) && isString(expected)
			test label, (t) =>
				t.is(@norm(val), @norm(expected))
		else if isNumber(val) && isNumber(expected)
			test label, (t) =>
				t.truthy (Math.abs(val - expected) < 0.0001)
		else
			test label, (t) =>
				t.like(val, expected)
		@end()
		return

	# ..........................................................

	samelines: (val, expected) ->

		assert isString(val), "not a string: #{OL(val)}"
		assert isString(expected), "not a string: #{OL(expected)}"
		[label, val, expected] = @begin(val, expected, 'samelines')

		lValLines = blockToArray(val).filter((line) => return nonEmpty(line)).sort()
		lExpLines = blockToArray(expected).filter((line) => return nonEmpty(line)).sort()

		test label, (t) =>
			t.deepEqual(lValLines, lExpLines)
		@end()
		return

	# ..........................................................

	samelist: (val, expected) ->

		[label, val, expected] = @begin(val, expected, 'samewordlist')
		test label, (t) =>
			t.deepEqual(val.sort(), expected.sort())
		@end()
		return

	# ..........................................................

	truthy: (bool) ->

		[label] = @begin(undef, undef, 'truthy')
		test label, (t) =>
			t.truthy(bool)
		@end()
		return

	# ..........................................................

	falsy: (bool) ->

		[label] = @begin(undef, undef, 'falsy')
		test label, (t) =>
			t.falsy(bool)
		@end()
		return

	# ..........................................................

	showInConsole: (value, format='nice') ->

		[label] = @begin(undef, undef, 'showInConsole')
		switch format.toLowerCase()
			when 'json'
				console.log JSON.stringify(value, null, 3)
			else
				console.log untabify(toNICE(value))
		test label, (t) =>
			t.truthy(true)
		@end()
		return

	# ..........................................................
	# --- NOTE: both strings and arrays have an includes() method

	includes: (val, expected) ->

		[label, val, expected] = @begin(val, expected, 'includes')
		assert isString(val) || isArray(val), "Not a string or array: #{OL(val)}"
		test label, (t) =>
			t.truthy(val.includes(expected))
		@end()
		return

	# ..........................................................

	matches: (val, regexp) ->

		assert isString(val), "Not a string: #{OL(val)}"
		[label, val] = @begin(val, undef, 'matches')

		# --- convert strings to regular expressions
		if isString(regexp)
			regexp = new RegExp(regexp)
		assert isRegExp(regexp), "Not a string or regexp: #{OL(regexp)}"
		test label, (t) =>
			t.truthy(defined(val.match(regexp)))
		@end()
		return

	# ..........................................................

	fails: (func) ->

		[label] = @begin(undef, undef, 'fails')
		assert isFunction(func), "Not a function: #{OL(func)}"
		try
			func()
			ok = true
		catch err
			ok = false

		test label, (t) => t.false(ok)
		@end()
		return

	# ..........................................................
	# --- with errClass == undef, same as fails()

	throws: (func, errClass=undef) ->

		if notdefined(errClass)
			return @fails(func)

		[label] = @begin(undef, undef, 'throws')
		assert isFunction(func), "Not a function: #{OL(func)}"
		assert isClass(errClass) || isFunction(errClass),
			"Not a class or function: #{OL(errClass)}"
		errObj = undef
		try
			func()
			ok = true
		catch err
			errObj = err
			ok = false

		test label, (t) =>
			t.truthy(!ok && (errObj instanceof errClass))
		@end()
		return

	# ..........................................................

	succeeds: (func) ->

		assert (typeof func == 'function'), "function expected"
		[label] = @begin(undef, undef, 'succeeds')
		try
			func()
			ok = true
		catch err
			console.error err
			ok = false

		test label, (t) => t.truthy(ok)
		@end()
		return

# ---------------------------------------------------------------------------

export u = new UnitTester()
export symbol = (arg1) => return u.symbol(arg1)
export equal = (arg1, arg2) => return u.equal(arg1, arg2)
export notequal = (arg1, arg2) => return u.notequal(arg1, arg2)
export like = (arg1, arg2) => return u.like(arg1, arg2)
export samelines = (arg1, arg2) => return u.samelines(arg1, arg2)
export truthy = (arg) => return u.truthy(arg)
export falsy = (arg) => return u.falsy(arg)
export showInConsole = (arg, format) => return u.showInConsole(arg, format)
export includes = (arg1, arg2) => return u.includes(arg1, arg2)
export matches = (str, regexp) => return u.matches(str, regexp)
export fails = (func) => return u.fails(func)
export throws = (func, errClass) => return u.throws(func, errClass)
export succeeds = (func) => return u.succeeds(func)
