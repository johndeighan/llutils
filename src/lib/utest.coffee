# utest.coffee

import test from 'ava'

import {
	undef, defined, notdefined, rtrim, nonEmpty, OL,
	isString, isNumber, isArray, isClass, isRegExp,
	isFunction, isAsyncFunction, isInteger,
	assert, croak, blockToArray, untabify,
	} from '@jdeighan/llutils'
import {execCmd} from '@jdeighan/llutils/exec-utils'
import {isFile, slurp, fileExt} from '@jdeighan/llutils/fs'
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
#        fails 1 (function)
#        throws 2 (function, error class)
#           - check throws a specific error type
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
				if isAsyncFunction(@transformValue)
					val = await @transformValue(val)
				else
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
		[label] = await @begin(label, undef, 'symbol')
		test label, (t) =>
			t.is(1, 1)
		@end()
		return

	# ..........................................................

	equal: (val, expected) ->

		[label, val, expected] = await @begin(val, expected, 'equal')
		test label, (t) =>
			t.deepEqual(val, expected)
		@end()
		return

	# ..........................................................

	notequal: (val, expected) ->

		[label, val, expected] = await @begin(val, expected, 'notequal')
		test label, (t) =>
			t.notDeepEqual(val, expected)
		@end()
		return

	# ..........................................................

	like: (val, expected) ->

		[label, val, expected] = await @begin(val, expected, 'like')
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
		[label, val, expected] = await @begin(val, expected, 'samelines')

		lValLines = blockToArray(val).filter((line) => return nonEmpty(line)).sort()
		lExpLines = blockToArray(expected).filter((line) => return nonEmpty(line)).sort()

		test label, (t) =>
			t.deepEqual(lValLines, lExpLines)
		@end()
		return

	# ..........................................................

	samelist: (val, expected) ->

		[label, val, expected] = await @begin(val, expected, 'samelist')
		test label, (t) =>
			t.deepEqual(val.sort(), expected.sort())
		@end()
		return

	# ..........................................................

	truthy: (bool) ->

		[label] = await @begin(undef, undef, 'truthy')
		test label, (t) =>
			t.truthy(bool)
		@end()
		return

	# ..........................................................

	falsy: (bool) ->

		[label] = await @begin(undef, undef, 'falsy')
		test label, (t) =>
			t.falsy(bool)
		@end()
		return

	# ..........................................................

	showInConsole: (value, format='nice') ->

		[label] = await @begin(undef, undef, 'showInConsole')
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

		[label, val, expected] = await @begin(val, expected, 'includes')
		assert isString(val) || isArray(val), "Not a string or array: #{OL(val)}"
		test label, (t) =>
			t.truthy(val.includes(expected))
		@end()
		return

	# ..........................................................

	matches: (val, regexp) ->

		assert isString(val), "Not a string: #{OL(val)}"
		[label, val] = await @begin(val, undef, 'matches')

		debug = val.startsWith('test/file-processor')
		if debug
			console.log "IN match()"

		# --- if regexp is a string, that string must exist within val
		if isString(regexp)
			pos = val.indexOf(regexp)
			if (pos == -1)
				console.log '-'.repeat(40)
				console.log val
				console.log '-'.repeat(40)
			test label, (t) =>
				t.truthy(pos >= 0)
		else
			assert isRegExp(regexp), "Not a string or regexp: #{OL(regexp)}"
			test label, (t) =>
				t.truthy(defined(val.match(regexp)))
		@end()
		return

	# ..........................................................

	fileExists: (filePath, contents=undef) ->

		[label] = await @begin(undef, undef, 'fileExists')
		test label, (t) =>
			t.truthy(isFile(filePath))
			if defined(contents)
				t.is slurp(filePath).trim(), contents.trim()
		@end()
		return

	# ..........................................................

	fileCompiles: (filePath) ->

		[label] = await @begin(undef, undef, 'compiles')
		try
			switch ext = fileExt(filePath)
				when '.js'
					execCmd "node -c #{filePath}"
				else
					croak "Unsupported file type: #{ext}"
			ok = true
		catch err
			console.log err
			ok = false
		test label, (t) => t.truthy(ok)
		@end()
		return

	# ..........................................................

	executesOK: (func) ->

		if isAsyncFunction(func)
			try
				await func()
				return [true, undef]
			catch err
				return [false, err]
		else
			try
				func()
				return [true, undef]
			catch err
				return [false, err]

	# ..........................................................

	fails: (func) ->

		[label] = await @begin(undef, undef, 'fails')
		assert isFunction(func), "Not a function: #{OL(func)}"
		[ok, err] = await @executesOK(func)

		test label, (t) => t.falsy(ok)
		@end()
		return

	# ..........................................................
	# --- with errClass == undef, same as fails()

	throws: (func, errClass=undef) ->

		if notdefined(errClass)
			return @fails(func)

		[label] = await @begin(undef, undef, 'throws')
		assert isFunction(func), "Not a function: #{OL(func)}"
		assert isClass(errClass) || isFunction(errClass),
			"Not a class or function: #{OL(errClass)}"
		[ok, err] = await @executesOK(func)

		test label, (t) =>
			t.truthy(!ok && (err instanceof errClass))
		@end()
		return

	# ..........................................................

	succeeds: (func) ->

		assert (typeof func == 'function'), "function expected"
		[label] = await @begin(undef, undef, 'succeeds')
		[ok, err] = await @executesOK(func)

		test label, (t) => t.truthy(ok)
		@end()
		return

# ---------------------------------------------------------------------------

u = new UnitTester()
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
export fileExists = (filePath, contents) => return u.fileExists(filePath, contents)
export fileCompiles = (filePath) => return u.fileCompiles(filePath)
