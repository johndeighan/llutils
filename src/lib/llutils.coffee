# llutils.coffee

import assertLib from 'node:assert'
import {exec, execSync} from 'node:child_process'
import {promisify} from 'node:util'
execAsync = promisify(exec)
import YAML from 'yaml'
module = await import('deep-equal')
deepEqual = module.default

`export const undef = void 0`

# ---------------------------------------------------------------------------

export eq = (x, y) =>

	return deepEqual(x, y, {strict: true})

# ---------------------------------------------------------------------------

export dclone = (x) =>

	return structuredClone(x)

# ---------------------------------------------------------------------------

export stripCR = (str) =>

	if notdefined(str)
		return undef
	assert isString(str), "Not a string: #{OL(str)}"
	return str.replaceAll('\r', '')

# ---------------------------------------------------------------------------

export pass = () =>    # do nothing

# ---------------------------------------------------------------------------

export range = (n) ->

	i = 0
	while (i < n)
		yield i
		i += 1
	return

# ---------------------------------------------------------------------------

export rev_range = (n) ->

	i = n
	while (i > 0)
		i -= 1
		yield i
	return

# ---------------------------------------------------------------------------

export add_s = (n) =>

	return if (n == 1) then '' else 's'

# ---------------------------------------------------------------------------
# low-level version of assert()

export assert = (cond, msg) =>

	assertLib.ok cond, msg
	return true

# ---------------------------------------------------------------------------
# low-level version of croak()

export croak = (msg) =>

	throw new Error(msg)
	return true

# ---------------------------------------------------------------------------
# returns true if all args defined

export defined = (...lObjs) =>

	for obj in lObjs
		if (obj == undef) || (obj == null)
			return false
	return true

# ---------------------------------------------------------------------------
# returns true if any args defined

export anyDefined = (...lObjs) =>

	for obj in lObjs
		if (obj != undef) && (obj != null)
			return true
	return false

# ---------------------------------------------------------------------------

export notdefined = (...lObjs) =>

	for obj in lObjs
		if (obj != undef) && (obj != null)
			return false
	return true

# ---------------------------------------------------------------------------

export words = (lStrings...) =>

	lWords = []
	for str in lStrings
		str = str.trim()
		if (str != '')
			for word in str.split(/\s+/)
				lWords.push word
	return lWords

# ---------------------------------------------------------------------------

export isString = (x, hOptions={}) =>

	if (typeof x != 'string') && !(x instanceof String)
		return false
	if (hOptions == 'nonempty') || hOptions.nonempty
		return nonEmpty(x)
	return true

# ---------------------------------------------------------------------------
# --- sometimes we can't use getOptions() because
#     it calls the current function

export getOneOption = (name, hOptions) =>

	if (typeof hOptions == 'string') || (hOptions instanceof String)
		return hOptions.split(/\s+/).includes(name)
	else
		return hasKey(hOptions, name) && hOptions[name]

# ---------------------------------------------------------------------------
# Valid options:
#    allStrings: boolean
#    nonempty: boolean

export isArray = (x, hOptions={}) =>

	nonempty = getOneOption 'nonempty', hOptions
	allStrings = getOneOption 'allStrings', hOptions

	if ! Array.isArray(x)
		return false
	if nonempty && (x.length == 0)
		return false
	if allStrings
		for item in x
			if ! isString(item)
				return false
	return true

# ---------------------------------------------------------------------------

export isBoolean = (x, hOptions={}) =>

	return (x == true) || (x == false) || (x instanceof Boolean)

# ---------------------------------------------------------------------------

export isNumber = (x, hOptions=undef) =>

	if (typeof x == 'number') || (typeof x == 'bigint')
		result = true
	else if (x instanceof Number)
		result = true
	else
		return false

	if defined(hOptions)
		assert isHash(hOptions), "2nd arg not a hash: #{OL(hOptions)}"
		{min, max} = hOptions
		if defined(min) && (x < min)
			result = false
		if defined(max) && (x > max)
			result = false
	return result

# ---------------------------------------------------------------------------

export isInteger = (x, hOptions={}) =>

	if (typeof x == 'bigint')
		result = true
	if (typeof x == 'number')
		result = Number.isInteger(x)
	else if (x instanceof Number)
		result = Number.isInteger(x.valueOf())
	else
		return false

	if result
		if defined(hOptions.min) && (x < hOptions.min)
			result = false
		if defined(hOptions.max) && (x > hOptions.max)
			result = false
	return result

# ---------------------------------------------------------------------------

export isHash = (x) =>

	if notdefined(x?.constructor?.name)
		return false
	return (x.constructor.name == 'Object')

# ---------------------------------------------------------------------------

export isFunction = (x) =>

	if (typeof x != 'function') && !(x instanceof Function)
		return false
	return !(x.toString().startsWith('class'))

# ---------------------------------------------------------------------------

export isRegExp = (x) =>

	return (typeof x == 'regexp') || (x instanceof RegExp)

# ---------------------------------------------------------------------------

export isClass = (x) =>

	if (typeof x != 'function')
		return false
	return (x.toString().startsWith('class'))

# ---------------------------------------------------------------------------

export className = (x) =>
	# --- item can be a class or an object

	if isClass(x)
		text = x.toString()
		if lMatches = text.match(/class\s+(\w+)/)
			return lMatches[1]
		else if lMatches = text.match(/class/)
			return undef
		else
			throw new Error("className(): Bad input class")
	else if isClassInstance(x)
		return x.constructor.name
	else
		return undef

# ---------------------------------------------------------------------------

export isPromise = (x) =>

	if (typeof x != 'object') || (x == null)
		return false
	return (typeof x.then == 'function')

# ---------------------------------------------------------------------------

export isClassInstance = (x, lReqKeys=undef) =>

	if (typeof x != 'object')
		return false
	if (x instanceof String) \
			|| (x instanceof Number) \
			|| (x instanceof Boolean) \
			|| (x instanceof RegExp) \
			|| (x instanceof Function) \
			|| isArray(x) \
			|| isHash(x) \
			|| isPromise(x)
		return false
	if defined(lReqKeys)
		if isString(lReqKeys)
			lReqKeys = words(lReqKeys)
		assert isArray(lReqKeys), "lReqKeys not an array: #{OL(lReqKeys)}"
		for key in lReqKeys
			type = undef
			if lMatches = key.match(///^ (\&) (.*) $///)
				[_, type, key] = lMatches
			if notdefined(x[key])
				return false
			if (type == '&') && (typeof x[key] != 'function')
				return false
	return true

# ---------------------------------------------------------------------------
#   escapeStr - escape newlines, carriage return, TAB chars, etc.
# --- NOTE: We can't use OL() inside here since it uses escapeStr()

export hEsc = {
	"\r": '←'
	"\n": '↓'
	"\t": '→'
	" ": '˳'
	}
export hEscNoNL = {
	"\r": '←'
	"\t": '→'
	" ": '˳'
	}

export escapeStr = (str, hReplace=hEsc, hOptions={}) =>
	# --- hReplace can also be a string:
	#        'esc'     - escape space, newline, tab
	#        'escNoNL' - escape space, tab

	assert isString(str), "not a string: #{typeof str}"
	if isString(hReplace)
		switch hReplace
			when 'esc'
				hReplace = hEsc
			when 'escNoNL'
				hReplace = hEscNoNL
			else
				hReplace = {}
	assert isHash(hReplace), "not a hash"

	{offset} = getOptions hOptions, {
		offset: undef
		}

	lParts = []
	i = 0
	for ch from str
		if defined(offset)
			if (i == offset)
				lParts.push ':'
			else
				lParts.push ' '
		result = hReplace[ch]
		if defined(result)
			lParts.push result
		else
			lParts.push ch
		i += 1
	if (offset == str.length)
		lParts.push ':'
	return lParts.join('')

# ---------------------------------------------------------------------------
#   escapeBlock
#      - remove carriage returns
#      - escape spaces, TAB chars

export escapeBlock = (block) =>

	return escapeStr(block, 'escNoNL')

# ---------------------------------------------------------------------------
# --- Can't use getOptions() !!!!!

export OL = (obj, hOptions={}) =>

	if (obj == undef) then return 'undef'
	if (obj == null) then return 'null'

	if hOptions.hasOwnProperty('esc')
		esc = hOptions.esc
	else
		esc = true

	if hOptions.hasOwnProperty('short')
		short = hOptions.short
	else
		short = false

	if short
		if isHash(obj) then return 'HASH'
		if isArray(obj) then return 'ARRAY'
		if isFunction(obj) then return 'FUNCTION'
		if isClassInstance(obj) then return 'CLASS INSTANCE'

	myReplacer = (key, x) =>
		type = typeof x
		switch type
			when 'bigint'
				return "«BigInt #{x.toString()}»"
			when 'function'
				if x.toString().startsWith('class')
					tag = 'Class'
				else
					tag = 'Function'
				if defined(x.name)
					return ".#{tag} #{x.name}."
				else
					return ".#{tag}."
			when 'string'
				# --- NOTE: JSON.stringify will add quote chars
				if esc
					return escapeStr(x)
				else
					return x
			when 'object'
				if x instanceof RegExp
					return ".RegExp #{x.toString()}."
				if defined(x) && (typeof x.then == 'function')
					return ".Promise."
				else
					return x
			else
				return x

	result = JSON.stringify(obj, myReplacer)

	# --- Because JSON.stringify adds quote marks,
	#     we remove them when using .
	finalResult = result \
		.replaceAll('".','.').replaceAll('."','.')
	return finalResult

# ---------------------------------------------------------------------------

export CWS = (str) =>

	assert isString(str), "CWS(): parameter not a string"
	return str.trim().replace(/\s+/sg, ' ')

# ---------------------------------------------------------------------------

export ML = (obj, hOptions={}) =>

	if (obj == undef) then return '.undef.'
	if (obj == null) then return '.null.'

	myReplacer = (key, x) =>
		type = typeof x
		switch type
			when 'bigint'
				return "«BigInt #{x.toString()}»"
			when 'function'
				if x.toString().startsWith('class')
					tag = 'Class'
				else
					tag = 'Function'
				if defined(x.name)
					return "«#{tag} #{x.name}»"
				else
					return "«#{tag}»"
			when 'string'
				# --- NOTE: JSON.stringify will add quote chars
				return escapeStr(x)
			when 'object'
				if x instanceof RegExp
					return "«RegExp #{x.toString()}»"
				if defined(x) && (typeof x.then == 'function')
					return "«Promise»"
				else
					return x
			else
				return x

	result = JSON.stringify(obj, myReplacer, "\t")

	# --- Because JSON.stringify adds quote marks,
	#     we remove them when using « and »
	finalResult = result.replaceAll('"«','«').replaceAll('»"','»')
	return finalResult

# ---------------------------------------------------------------------------
# returns a single string

export OLS = (lObjects, hOptions={}) =>

	sep = hOptions.sep || ','
	short = hOptions.short || false

	assert isArray(lObjects), "not an array"
	lParts = []
	for obj in lObjects
		lParts.push OL(obj, {short})
	return lParts.join(sep)

# ---------------------------------------------------------------------------
#   isEmpty - one of:
#      - string is whitespace
#      - array has no elements
#      - hash has no keys

export isEmpty = (x) =>

	if (x == undef) || (x == null) || (x == '')
		return true
	if isString(x)
		return (x.match(/^\s*$/) != null)
	if isArray(x)
		return (x.length == 0)
	if isHash(x)
		return (Object.keys(x).length == 0)
	else
		return false

# ---------------------------------------------------------------------------
#   nonEmpty - not isEmpty(x)

export nonEmpty = (x) =>

	return ! isEmpty(x)

# ---------------------------------------------------------------------------

export execCmd = (cmdLine, hOptions={}) =>
	# --- may throw an exception

	hOptions = getOptions hOptions, {
		encoding: 'utf8'
		windowsHide: true
		}
	return execSync(cmdLine, hOptions).toString()

# ---------------------------------------------------------------------------

export execAndLogCmd = (cmdLine, hOptions={}) =>
	# --- may throw an exception

	hOptions = getOptions hOptions, {
		encoding: 'utf8'
		windowsHide: true
		}
	result = execSync(cmdLine, hOptions).toString()
	console.log result
	return result

# ---------------------------------------------------------------------------

export execCmdAsync = (cmdLine, hOptions={}) =>
	# --- may throw an exception

	hOptions = getOptions hOptions, {
		encoding: 'utf8'
		windowsHide: true
		}
	return execAsync(cmdLine, hOptions)

# ---------------------------------------------------------------------------

export chomp = (str) =>
	# --- Remove trailing \n if present

	len = str.length
	if (str[len-1] == '\n')
		if (str[len-2] == '\r')
			return str.substring(0, len-2)
		else
			return str.substring(0, len-1)
	else
		return str

# ---------------------------------------------------------------------------
#        HASH utilities
# ---------------------------------------------------------------------------

export keys = Object.keys

# ---------------------------------------------------------------------------

export hasKey = (h, key) =>

	assert isHash(h), "h is #{OL(h)}"
	return h.hasOwnProperty(key)

# ---------------------------------------------------------------------------
# --- item can be a hash or array

export removeKeys = (item, lKeys) =>

	assertLib.ok isArray(lKeys), "not an array"
	if isArray(item)
		for subitem in item
			removeKeys subitem, lKeys
	else if isHash(item)
		for key in lKeys
			if item.hasOwnProperty(key)
				delete item[key]
		for prop,value of item
			removeKeys value, lKeys
	return item

# ---------------------------------------------------------------------------
# ---------------------------------------------------------------------------

export npmLogLevel = () =>

	result = execCmd('npm config get loglevel')
	return chomp(result)

# ---------------------------------------------------------------------------

export blockToArray = (block) =>

	assert isString(block), "block is: #{typeof block}"
	if isEmpty(block)
		return []
	else
		return block.split(/\r?\n/)

# ---------------------------------------------------------------------------

export toArray = (strOrArray) =>

	if isArray(strOrArray)
		return strOrArray
	else
		return blockToArray(strOrArray)

# ---------------------------------------------------------------------------

export arrayToBlock = (lLines) =>

	assert isArray(lLines), "lLines is not an array"
	return lLines.filter((line) => defined(line)).join("\n")

# ---------------------------------------------------------------------------

export toBlock = (strOrArray) =>

	if isString(strOrArray)
		return strOrArray
	else
		return arrayToBlock(strOrArray)

# ---------------------------------------------------------------------------

export listdiff = (lItems, lToRemove) =>

	assert isArray(lItems), "lItems is #{OL(lItems)}"
	assert isArray(lToRemove), "lToRemove is #{OL(lToRemove)}"
	return lItems.filter((item) =>
		return ! lToRemove.includes(item))

# ---------------------------------------------------------------------------

export untabify = (str, numSpaces=3) =>

	return str.replace(/\t/g, ' '.repeat(numSpaces))

# ---------------------------------------------------------------------------

export LOG = (item) =>

	if isString(item)
		console.log untabify(item)
	else
		console.log item

# ---------------------------------------------------------------------------

export splitPrefix = (line) =>

	assert isString(line), "non-string: #{typeof line}"
	lMatches = line.match(/^(\s*)(.*)$/)
	return [lMatches[1], lMatches[2]]

# ---------------------------------------------------------------------------
#    tabify - convert leading spaces to TAB characters
#             if numSpaces is not defined, then the first line
#             that contains at least one space sets it

export tabify = (str, numSpaces=undef) =>

	lLines = []
	for str in blockToArray(str)
		[prefix, theRest] = splitPrefix(str)
		prefixLen = prefix.length
		if prefixLen == 0
			lLines.push theRest
		else
			assert (prefix.indexOf('\t') == -1), "found TAB"
			if numSpaces == undef
				numSpaces = prefixLen
			assert (prefixLen % numSpaces == 0), "Bad prefix"
			level = prefixLen / numSpaces
			lLines.push '\t'.repeat(level) + theRest
	return arrayToBlock(lLines)

# ---------------------------------------------------------------------------

export gen2array = (reader) =>

	lLines = []
	for line from reader()
		lLines.push line
	return lLines

# ---------------------------------------------------------------------------

export gen2block = (reader) =>

	lLines = gen2array(reader)
	return lLines.join("\n")

# ---------------------------------------------------------------------------

export spaces = (n) =>

	return " ".repeat(n)

# ---------------------------------------------------------------------------

export tabs = (n) =>

	return "\t".repeat(n)

# ---------------------------------------------------------------------------
# --- valid options:
#        char - char to use on left and right
#        buffer - num spaces around text when char <> ' '

export centered = (text, width, hOptions={}) =>

	{char} = getOptions hOptions, {
		char: ' '
		}

	numBuffer = hOptions.numBuffer || 2

	totSpaces = width - text.length
	if (totSpaces <= 0)
		return text
	numLeft = Math.floor(totSpaces / 2)
	numRight = totSpaces - numLeft
	if (char == ' ')
		return spaces(numLeft) + text + spaces(numRight)
	else
		buf = ' '.repeat(numBuffer)
		left = char.repeat(numLeft - numBuffer)
		right = char.repeat(numRight - numBuffer)
		numLeft -= numBuffer
		numRight -= numBuffer
		return left + buf + text + buf + right

# ---------------------------------------------------------------------------

export leftAligned = (text, width, hOptions={}) =>

	if (text.length >= width)
		return text
	numSpaces = width - text.length
	return text + ' '.repeat(numSpaces)

# ---------------------------------------------------------------------------

export rightAligned = (text, width, hOptions={}) =>

	if (text.length >= width)
		return text
	numSpaces = width - text.length
	return ' '.repeat(numSpaces) + text

# ---------------------------------------------------------------------------

export countChars = (str, ch) =>

	count = 0
	pos = -1
	while (pos = str.indexOf(ch, pos+1)) != -1
		count += 1
	return count

# ---------------------------------------------------------------------------
#   rtrim - strip trailing whitespace

export rtrim = (line) =>

	assert isString(line), "not a string: #{typeof line}"
	lMatches = line.match(/^(.*?)\s+$/)
	if defined(lMatches)
		return lMatches[1]
	else
		return line

# ---------------------------------------------------------------------------
# --- Always logs using console.log, therefore
#     strings are untabified

export log = (...lItems) =>

	for x in lItems
		if isString(x)
			console.log untabify(x)
		else
			console.log x
	return

# ---------------------------------------------------------------------------

export getOptions = (options=undef, hDefault={}) =>

	if isEmpty(options)
		hOptions = {}
	else if isHash(options)
		hOptions = options
	else if isString(options)
		hOptions = hashFromString(options)
	else
		croak "Bad options: #{OL(options)}"

	# --- Fill in defaults for missing values
	for own key,value of hDefault
		if ! hasKey(hOptions, key) && defined(value)
			hOptions[key] = value

	return hOptions

# ---------------------------------------------------------------------------

export hashFromString = (str) =>

	assert isString(str), "not a string: #{OL(str)}"
	h = {}
	for word in words(str)
		if lMatches = word.match(///^
				(\!)?                    # negate value
				([A-Za-z][A-Za-z_0-9]*)  # identifier
				(?:
					(=)
					(.*)
					)?
				$///)
			[_, neg, ident, eqSign, str] = lMatches
			if nonEmpty(eqSign)
				assert isEmpty(neg), "negation with string value"

				# --- check if str is a valid number
				num = parseFloat(str)
				if Number.isNaN(num)
					# --- TO DO: interpret backslash escapes
					h[ident] = str
				else
					h[ident] = num
			else if neg
				h[ident] = false
			else
				h[ident] = true
		else
			croak "Invalid word #{OL(word)}"
	return h

# ---------------------------------------------------------------------------

export js2uri = (js) =>

	return 'data:text/javascript;charset=utf-8,' \
		+ encodeURIComponent(js)

# ---------------------------------------------------------------------------

export now = () =>

	return global.performance.now()

# ---------------------------------------------------------------------------

export timeit = (func, nReps=100) =>

	t0 = now()
	for i in range(nReps)
		func()
	diff = now() - t0
	return diff / nReps

# ---------------------------------------------------------------------------

export behead = (block) ->

	nlPos = block.indexOf("\n")
	if  (nlPos == -1)
		return [block, '']
	return [
		chomp(block.substring(0, nlPos))
		chomp(block.substring(nlPos+1))
		]

# ---------------------------------------------------------------------------

export isTAML = (block) ->

	[head, rest] = behead(block)
	return (head == '---')

# ---------------------------------------------------------------------------

export fromTAML = (block) ->

	[head, rest] = behead(block)
	assert head.startsWith('---'), "Missing '---'"
	hOptions = {
		skipInvalid: true
		}
	return YAML.parse(untabify(rest, 2), hOptions)

# ---------------------------------------------------------------------------

export toTAML = (ds) ->

	str = YAML.stringify(ds, {
		keepUndef: true
		simpleKeys: true
		})
	return chomp("---\n" + tabify(str))

# ---------------------------------------------------------------------------

export sliceBlock = (block, start=0, end=undef) ->

	lLines = toArray(block)
	if notdefined(end)
		end = lLines.length
	return toBlock(lLines.slice(start, end))

# ---------------------------------------------------------------------------

export sortArrayOfHashes = (lHashes, key) =>

	# --- NOTE: works whether values are strings or numbers
	compareFunc = (a, b) =>
		if a[key] < b[key]
			return -1
		else if a[key] > b[key]
			return 1
		else
			return 0
	lHashes.sort(compareFunc)

	# --- NOTE: array is sorted in place, but sometimes
	#           it's useful if we return a ref to it anyway
	return lHashes

# ---------------------------------------------------------------------------

export sortedArrayOfHashes = (lHashes, key) =>

	# --- NOTE: works whether values are strings or numbers
	compareFunc = (a, b) =>
		if a[key] < b[key]
			return -1
		else if a[key] > b[key]
			return 1
		else
			return 0
	return lHashes.toSorted(compareFunc)

# ---------------------------------------------------------------------------

export cmdArgStr = (lArgs=undef) =>

	if isString(lArgs)
		return lArgs
	if defined(lArgs)
		assert isArray(lArgs), "Not an array: #{OL(lArgs)}"
	else
		lArgs = process.argv.slice(2) || []
	return lArgs.map((str) =>
		if lMatches = str.match(///^
				-          # a dash
				([^=\s]+)  # option name
				=          # equal sign
				(.*)
				$///)
			[_, name, value] = lMatches
			if value.includes(' ')
				return "-#{name}=\"#{value}\""
			else
				return "-#{name}=#{value}"
		else if str.includes(' ')
			return "\"#{str}\""
		else
			return str
		).join(' ')
