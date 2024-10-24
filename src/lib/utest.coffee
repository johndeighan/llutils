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
	transformFunction: (func) -> return func

	# ........................................................................

	begin: () ->

		if (@depth == 0)
			@beforeEachTest()
		@depth += 1
		return

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
	#                  TESTS
	# ..........................................................

	equal: (val, expected) ->

		@begin()
		test @getLabel('equal'), (t) =>
			val = await @transformValue(val)
			expected = await @transformExpected(expected)
			t.deepEqual(val, expected)
		@end()
		return

	# ..........................................................

	notequal: (val, expected) ->

		@begin()
		test @getLabel('notequal'), (t) =>
			val = await @transformValue(val)
			expected = await @transformExpected(expected)
			t.notDeepEqual(val, expected)
		@end()
		return

	# ..........................................................

	like: (val, expected) ->

		@begin()
		test @getLabel('like'), (t) =>
			val = await @transformValue(val)
			expected = await @transformExpected(expected)
			if isString(val) && isString(expected)
				t.is(@norm(val), @norm(expected))
			else if isNumber(val) && isNumber(expected)
				t.truthy (Math.abs(val - expected) < 0.0001)
			else
				t.like(val, expected)
		@end()
		return

	# ..........................................................

	samelines: (val, expected) ->

		@begin()
		test @getLabel('samelines'), (t) =>
			val = await @transformValue(val)
			expected = await @transformExpected(expected)
			assert isString(val), "not a string: #{OL(val)}"
			assert isString(expected), "not a string: #{OL(expected)}"

			lValLines = blockToArray(val)
					.filter((line) => return nonEmpty(line))
					.sort()
			lExpLines = blockToArray(expected)
					.filter((line) => return nonEmpty(line))
					.sort()

			t.deepEqual(lValLines, lExpLines)
		@end()
		return

	# ..........................................................

	samelist: (val, expected) ->

		@begin()
		test @getLabel('samelist'), (t) =>
			val = await @transformValue(val)
			expected = await @transformExpected(expected)
			assert isArray(val), "not an array: #{OL(val)}"
			assert isArray(expected), "not an array: #{OL(expected)}"
			t.deepEqual(val.sort(), expected.sort())
		@end()
		return

	# ..........................................................

	truthy: (val) ->

		@begin()
		test @getLabel('truthy'), (t) =>
			val = await @transformValue(val)
			t.truthy(val)
		@end()
		return

	# ..........................................................

	falsy: (val) ->

		@begin()
		test @getLabel('falsy'), (t) =>
			val = await @transformValue(val)
			t.falsy(val)
		@end()
		return

	# ..........................................................

	showInConsole: (value, format='nice') ->

		@begin()
		test @getLabel('showInConsole'), (t) =>
			switch format.toLowerCase()
				when 'json'
					console.log JSON.stringify(value, null, 3)
				else
					console.log untabify(toNICE(value))
			t.truthy(true)
		@end()
		return

	# ..........................................................
	# --- NOTE: both strings and arrays have an includes() method

	includes: (val, expected) ->

		@begin()
		test @getLabel('includes'), (t) =>
			val = await @transformValue(val)
			expected = await @transformExpected(expected)
			assert isString(val) || isArray(val), "Not a string or array: #{OL(val)}"
			t.truthy(val.includes(expected))
		@end()
		return

	# ..........................................................

	matches: (val, pattern) ->

		@begin()

#		debug = val.startsWith('test/file-processor')
#		if debug
#			console.log "IN match()"

		test @getLabel('matches'), (t) =>
			val = await @transformValue(val)
			assert isString(val), "Not a string: #{OL(val)}"

			# --- if pattern is a string, that string must exist within val
			if isString(pattern)
				pos = val.indexOf(pattern)
				t.truthy(pos >= 0)
			else
				assert isRegExp(pattern), "Not a string or regexp: #{OL(pattern)}"
				t.truthy(defined(val.match(pattern)))
		@end()
		return

	# ..........................................................

	fileExists: (filePath, contents=undef) ->

		@begin()
		test @getLabel('fileExists'), (t) =>
			t.truthy(isFile(filePath))
			if defined(contents)
				t.is slurp(filePath).trim(), contents.trim()
		@end()
		return

	# ..........................................................

	compiles: (filePath) ->

		@begin()
		test @getLabel('compiles'), (t) =>
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
			t.truthy(ok)
		@end()
		return

	# ..........................................................

	fails: (func) ->

		@begin()
		test @getLabel('fails'), (t) =>
			func = await @transformFunction(func)
			assert isFunction(func), "Not a function: #{OL(func)}"
			[ok, err] = await @executesOK(func)
			t.falsy(ok)
		@end()
		return

	# ..........................................................
	# --- with errClass == undef, same as fails()

	throws: (func, errClass=undef) ->

		@begin()
		test @getLabel('throws'), (t) =>
			func = await @transformFunction(func)
			assert defined(errClass), "Missing error class"
			assert isFunction(func), "Not a function: #{OL(func)}"
			assert isClass(errClass) || isFunction(errClass),
				"Not a class or function: #{OL(errClass)}"
			[ok, err] = await @executesOK(func)
			t.truthy(!ok && (err instanceof errClass))
		@end()
		return

	# ..........................................................

	succeeds: (func) ->

		@begin()
		test @getLabel('succeeds'), (t) =>
			func = await @transformFunction(func)
			assert isFunction(func), "Not a function: #{OL(func)}"
			[ok, err] = await @executesOK(func)

			t.truthy(ok)
		@end()
		return

	# ..........................................................
	#           END TESTS
	# ..........................................................

	executesOK: (func) ->

#		if isAsyncFunction(func)
		try
			await func()
			return [true, undef]
		catch err
			return [false, err]
#		else
#			try
#				func()
#				return [true, undef]
#			catch err
#				return [false, err]

# ---------------------------------------------------------------------------

u = new UnitTester()
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
export compiles = (filePath) => return u.compiles(filePath)
