---
type: coffee
debug: false
---

GLOBAL

	import {
		undef, defined, notdefined, pass, isEmpty,
		hasKey, keys, OL, words, add_s,
		assert, croak, getOptions, mkString,
		isString, isFunction, isBoolean, isArray,
		} from '@jdeighan/llutils'
	import {DUMP} from '@jdeighan/llutils/dump'
	import {getTracer} from '@jdeighan/llutils/peggy'

	hOptions = {}

	# ------------------------------------------------------------------------
	# --- hDesc is: {
	#        <tag>: <type>    - <tag>s are allowed names
	#                         - <type> is 'boolean','string',
	#                           'number','integer'
	#        _: [min, max]    - min/max may be undef
	#        }
	#
	# --- If hDesc is undef, no checking is done

	export getArgs = (argStr=undef, hDesc=undef, tracer='none') =>

		if notdefined(argStr)
			argStr = process.argv.slice(2).join(' ')
		assert isString(argStr), "Not a string: #{OL(argStr)}"
		if isFunction(tracer)
			hParseOptions = {tracer}
		else
			hParseOptions = {tracer: getTracer(tracer)}

		hResult = peg$parse argStr, hParseOptions
		if defined(hDesc)
			check hResult, hDesc
		return hResult

	# ..........................................................

	check = (hResult, hDesc) =>

		# --- Check number of non-options
		lLimits = hDesc._
		if defined(lLimits)
			assert isArray(lLimits), "Not an array: #{OL(lLimits)}"
			[min, max] = lLimits
			if notdefined(min)
				min = 0
			if notdefined(max)
				max = Infinity

			# --- How many non-options were provided?
			lNonOptions = hResult._
			if defined(lNonOptions)
				assert isArray(lNonOptions), "Not an array: #{OL(lNonOptions)}"
				n = lNonOptions.length
			else
				n = 0

			assert (n >= min),
					"There must be at least #{min} non-option#{add_s(min)}"
			assert (n <= max),
					"There can be at most #{max} non-option#{add_s(max)}"


		for key in keys(hResult)
			if (key != '_')
				type = hDesc[key]
				value = hResult[key]
				switch type
					when 'string'
						pass()
					when 'boolean'
						assert isBoolean(value), "Bad boolean: #{OL(value)}"
					when 'number'
						hResult[key] = parseFloat(value)
					when 'integer'
						hResult[key] = parseInt(value, 10)
					else
						croak "Invalid type: #{OL(type)}"
		return

PER_PARSE

	hOptions = {}

cmdArgs
	arg (ws arg)*
		return hOptions

arg

	'-' lChars:[A-Za-z]+ value:(@'=' @stringVal)?
		if isEmpty(value)
			for ch in lChars
				hOptions[ch] = true
		else
			hOptions[mkString(lChars)] = value[1]

	val:stringVal

		if hasKey(hOptions, '_')
			hOptions._.push val
		else
			hOptions._ = [val]

stringVal

	'"'  str::[^"]*  '"'
		return str

	"'"  str::[^']*  "'"
		return str

	!'-' str::[^ \t]+
		return str

ws
	[ \t]+
