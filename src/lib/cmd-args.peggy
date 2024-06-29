---
type: coffee
---

GLOBAL

	import {
		undef, defined, notdefined, pass, isEmpty,
		hasKey, keys, OL, words, add_s,
		assert, croak, getOptions, cmdArgStr,
		isString, isFunction, isBoolean, isArray, isHash,
		} from '@jdeighan/llutils'
	import {DUMP} from '@jdeighan/llutils/dump'
	import {getTracer} from '@jdeighan/llutils/tracer'

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

	export getArgs = (argStr=undef, hDesc=undef, tracerStr='none') =>

		debugger
		argStr = cmdArgStr(argStr)
		try
			tracer = getTracer(tracerStr, argStr)
		catch err
			console.log "ERROR: getTracer() failed: #{err.message}"
			process.exit()

		try
			hResult = peg$parse argStr, {tracer}
		catch err
			console.log "ERROR parsing #{OL(argStr)}: #{err.message}"
			process.exit()
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

		# --- Check types of all options
		for key in keys(hResult)
			if (key != '_')
				type = hDesc[key]
				value = hResult[key]
				switch (typeof type)
					when 'string'
						switch type
							when 'string'
								pass()
							when 'boolean'
								assert isBoolean(value),
										"Bad boolean: #{OL(value)}, key = #{OL(key)}"
							when 'number'
								try
									hResult[key] = parseFloat(value)
								catch err
									croak "Bad number: #{OL(value)}, key = #{OL(key)}"
							when 'integer'
								try
									hResult[key] = parseInt(value, 10)
								catch err
									croak "Bad integer: #{OL(value)}, key = #{OL(key)}"
							else
								croak "Invalid type: #{OL(type)}, key = #{OL(key)}"
					when 'object'
						if (type instanceof RegExp)
							assert isString(value),
									"value not a string: #{OL(value)}"
							assert value.match(type),
									"value #{OL(value)} does not match regexp"
						else
							croak "Invalid type: #{OL(type)}, key = #{OL(key)}"
					else
						croak "Invalid type: #{OL(type)}, key = #{OL(key)}"
		return

cmdArgs

	lArgs: arg |.., ws|

		hOptions = {}
		lNonOptions = []

		for arg in lArgs
			if isHash(arg)
				Object.assign hOptions, arg
			else if isArray(arg)
				lNonOptions.push arg...
			else
				croak "Bad return from arg: #{OL(arg)}"

		if (lNonOptions.length > 0)
			hOptions._ = lNonOptions
		return hOptions

arg

	'-' lChars:[A-Za-z]+ value:('=' @stringVal)?

		if isEmpty(value)
			hOptions = {}
			for ch in lChars
				hOptions[ch] = true
			return hOptions
		else
			key = lChars.join('')
			return {[key]: value}

	val:stringVal

		return [val]

stringVal

	'"'  str: $ [^"]*  '"'
		return str

	"'"  str: $ [^']*  "'"
		return str

	!'-' str: $ [^ \t]+
		return str

ws
	[ \t]+
