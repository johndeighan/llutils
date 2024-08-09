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
		assert, croak, getOptions, cmdScriptName, cmdArgStr,
		isString, isFunction, isBoolean, isArray, isHash, isRegExp,
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
		if (hResult.h == true)
			showHelp hDesc
			process.exit()
		if defined(hDesc)
			check hResult, hDesc
		return hResult

	# ..........................................................

	check = (hResult, hDesc) =>

		assert isHash(hResult), "check(): hResult not a hash: #{OL(hResult)}"
		assert isHash(hDesc),   "check(): hDesc not a hash: #{OL(hDesc)}"

		# --- Check options
		for key in keys(hResult).filter((x) => x != '_')
			{type, desc, msg} = hDesc[key]
			if isString(type)
				value = hResult[key]
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
						croak "Invalid type: #{OL(desc)}, key = #{OL(key)}"
			else if isRegExp(type)
				value = hResult[key]
				assert isString(value),
						"value not a string: #{OL(value)}"
				assert value.match(type),
						"value #{OL(value)} does not match regexp"
			else if isFunction(type)
				type()     # --- call the function
			else if defined(type)
				croak "Bad type: #{OL(type)}"

		# --- Check non-options
		#     hDesc._ may have keys:
		#        min
		#        max
		#        exactly

		if defined(h = hDesc._)
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
		#     typeof hDesc[key] can be:
		#        string - 'string','boolean','number,'integer'
		#        function
		#        object

		return

	# ..........................................................

	showHelp = (hDesc) =>

		assert isHash(hDesc), "showHelp(): not a hash: #{OL(hDesc)}"

		usageStr = cmdScriptName()

		# --- Build lists of flags and non-flags
		lFlags = []
		lNonFlags = []
		for key in keys(hDesc).filter (k) => (k != '_')
			if (key.length == 1) && (hDesc[key].type == 'boolean')
				lFlags.push key
			else
				lNonFlags.push key

		if (lFlags.length > 0)
			usageStr += " -#{lFlags.join('')}"
		for key in lNonFlags
			{type, desc} = hDesc[key]
			label = desc || 'type'
			usageStr += " -#{key}=<#{desc || type}>"

		if defined(_ = hDesc._)
			{exactly, min, max, desc} = _
			if defined(desc)
				usageStr += " #{desc}"
			else
				if defined(exactly)
					strIter = "{#{exactly}}"
				else
					strIter = "{"
					if defined(min)
						strIter += min
					strIter += ','
					if defined(max) && (max < 1000)
						strIter += max
					strIter += '}'
				usageStr += " <string>#{strIter}"

		console.log "USAGE: #{usageStr}"
		for key in keys(hDesc).filter (k) => (k != '_')
			{msg} = hDesc[key]
			if msg
				console.log "   -#{key} - #{msg}"
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
