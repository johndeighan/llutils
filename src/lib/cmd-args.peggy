---
type: coffee
opDumper: true
byteCodeWriter: false
dumpAST: true
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
	# --- Valid options:
	#        tracer - valid string designating a tracer
	#        args - args to use - a string or array
	#
	# --- hDesc is: {
	#        <tag>: <type>    - <tag>s are allowed names
	#                         - <type> is 'boolean','string',
	#                           'number','integer'
	#        _: [min, max]    - min/max may be undef
	#        }
	#
	# --- If hDesc is undef, no checking is done

	export getArgs = (hDesc=undef, hOptions={}) =>

		{args, tracer} = getOptions hOptions, {
			args: undef
			tracer: 'none'
			}
		argStr = cmdArgStr(args)
		hOptions.tracer = getTracer(tracer)

		try
			hResult = peg$parse argStr, hOptions
		catch err
			console.log "ERROR parsing #{OL(argStr)}: #{err.message}"
			process.exit()
		if defined(hDesc)
			check hResult, hDesc
		return hResult

	# ..........................................................

	check = (hResult, hDesc) =>

		# --- Check number of non-options
		#     hDesc._ may have keys:
		#        min
		#        max
		#        exactly
		h = hDesc._
		if defined(h)
			min = h.min || h.exactly || 0
			max = h.max || h.exactly || Infinity

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

	lArgs: arg |.., _|

		hOptions = {}
		lNonOptions = []

		for arg in lArgs
			if isHash(arg)
				Object.assign hOptions, arg
			else if isArray(arg)
				lNonOptions.push arg...
			else
				croak "Bad return from arg: #{OL(arg)}"

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

_
	[ \t]+
