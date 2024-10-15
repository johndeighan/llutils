# llutils.coffee

import YAML from 'yaml'
module = await import('deep-equal')
deepEqual = module.default
import pathLib from 'node:path'

`export const undef = void 0`

# ---------------------------------------------------------------------------

export dclone = (x) =>

	return structuredClone(x)

# ---------------------------------------------------------------------------

export identityFunc = (x) =>

	return x

# ---------------------------------------------------------------------------

export assert = (cond, msg) =>

	if isArray(cond)
		for bool in cond
			assert bool, msg
	else if !cond
		if isString(msg)
			throw new Error(untabify(msg))
		else
			throw msg
	return true

# ---------------------------------------------------------------------------

export croak = (msg) =>

	throw new Error(untabify(msg))
	return true

# ---------------------------------------------------------------------------
#    tabify - convert leading spaces to TAB characters
#             if numSpaces is not defined, then the first line
#             that contains at least one space sets it

export tabify = (str, hOptions={}) =>

	{numSpaces, strict} = getOptions hOptions, {
		numSpaces: undef
		strict: true
		}
	lLines = []
	for str in blockToArray(str)
		[prefix, theRest] = splitPrefix(str)
		prefixLen = prefix.length
		if prefixLen == 0
			lLines.push theRest
		else
			if strict
				assert (prefix.indexOf('\t') == -1), "unexpected TAB"
			if (numSpaces == undef)
				numSpaces = substrCount(prefix, ' ')
			spaces = ' '.repeat(numSpaces)
			prefix = prefix.replaceAll(spaces, "\t")
			lLines.push "#{prefix}#{theRest}"
	return arrayToBlock(lLines)

# ---------------------------------------------------------------------------
#    untabify - convert TAB characters to spaces

export untabify = (str, hOptions={}) =>

	{numSpaces, strict} = getOptions hOptions, {
		numSpaces: 3
		strict: true
		}
	assert isInteger(numSpaces), "bad numSpaces: #{OL(numSpaces)}"
	spaces = ' '.repeat(numSpaces)
	lLines = []
	for str in blockToArray(str)
		[prefix, theRest] = splitPrefix(str)
		prefixLen = prefix.length
		if prefixLen == 0
			lLines.push theRest
		else
			if strict
				assert (prefix.indexOf(' ') == -1), "unexpected space char"
			prefix = prefix.replaceAll("\t", spaces)
			lLines.push "#{prefix}#{theRest}"
	return arrayToBlock(lLines)

# ---------------------------------------------------------------------------
#   escapeStr - escape newlines, carriage return, TAB chars, etc.
# --- NOTE: We can't use OL() inside here since it uses escapeStr()

hEscNL = {
	"\r": '←'
	"\n": '↓'
	"\t": '→'
	" ": '˳'
	}
hEscNoNL = {
	"\r": '←'
	"\t": '→'
	" ": '˳'
	}

# ---------------------------------------------------------------------------

export escapeStr = (str, hOptions={}) =>
	#     Valid options:
	#        hEsc    - hash {<ch>: <replacement>, ...}
	#        offset  - indicate position of offset
	#        poschar - char to use to indicate position

	assert isString(str), "not a string: #{typeof str}"
	{hEsc, offset, poschar} = getOptions hOptions, {
		hEsc: hEscNL
		offset: undef
		poschar: '┊'
		}

	if isString(hEsc)
		switch hEsc
			when 'esc'
				hReplace = hEscNL
			when 'escNoNL'
				hReplace = hEscNoNL
			else
				hReplace = {}
	else
		hReplace = hEsc
	assert isHash(hReplace), "not a hash"

	lParts = []
	i = 0
	for ch from str
		if defined(offset)
			if (i == offset)
				lParts.push poschar
		result = hReplace[ch]
		if defined(result)
			lParts.push result
		else
			lParts.push ch
		i += 1
	if (offset == str.length)
		lParts.push poschar
	return lParts.join('')

# ---------------------------------------------------------------------------
#   escapeBlock
#      - remove carriage returns
#      - escape spaces, TAB chars

export escapeBlock = (block) =>

	return escapeStr(block, 'hEsc=escNoNL')

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

	myReplacer = (key, value) =>
		if (value == undef)
			return '«undef»'
		type = typeof value
		switch type
			when 'symbol'
				return '«Symbol»'
			when 'bigint'
				return "«BigInt #{value.toString()}»"
			when 'function'
				if value.toString().startsWith('class')
					tag = 'Class'
				else
					tag = 'Function'
				if defined(value.name)
					return "«#{tag} #{value.name}»"
				else
					return "«#{tag}»"
			when 'string'
				# --- NOTE: JSON.stringify will add quote chars
				if esc
					return escapeStr(value)
				else
					return value
			when 'object'
				if value instanceof RegExp
					return "«RegExp #{value.toString()}»"
				if defined(value) && (typeof value.then == 'function')
					return "«Promise»"
				else
					return value
			else
				return value

	result = JSON.stringify(obj, myReplacer)

	# --- Because JSON.stringify adds quote marks,
	#     we remove them when using .
	return result \
		.replaceAll('"«','«') \
		.replaceAll('»"','»')

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
	return result \
		.replaceAll('"«','«') \
		.replaceAll('»"','»')

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

export inRange = (i, n) ->

	assert isInteger(i), "Not an integer: i = #{OL(i)}"
	assert isInteger(n), "Not an integer: n = #{OL(n)}"
	return (i >= 0) && (i < n)

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
		return hOptions[name]

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

export cleanHash = (h) =>

	# --- modifies h in place, but also returns h
	for key in keys(h)
		if isEmpty(h[key])
			delete h[key]
	return h

# ---------------------------------------------------------------------------

export CWS = (str) =>

	assert isString(str), "CWS(): parameter not a string"
	return str.trim().replace(/\s+/sg, ' ')

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

	if notdefined(h)
		return false
	assert isHash(h) || isClassInstance(h), "h is #{h}"
	assert isString(key), "key is #{key}"
	return h.hasOwnProperty(key)

# ---------------------------------------------------------------------------
# --- item can be a hash or array

export removeKeys = (item, lKeys) =>

	assert isArray(lKeys), "not an array"
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

log_level = 0

export LOG_indent = () =>

	log_level += 1
	return

# ---------------------------------------------------------------------------

export LOG_undent = () =>

	log_level -= 1
	return

# ---------------------------------------------------------------------------

export LOG = (item, hOptions={}) =>

	{depth} = getOptions hOptions, {
		depth: null
		}
	if (log_level > 0)
		item = "\t".repeat(log_level) + item
	if isString(item)
		console.log untabify(item, '!strict')
	else
		console.dir item, {depth}

# ---------------------------------------------------------------------------

export splitPrefix = (line) =>

	assert isString(line), "non-string: #{typeof line}"
	lMatches = line.match(/^(\s*)(.*)$/)
	return [lMatches[1], lMatches[2]]

# ---------------------------------------------------------------------------

export substrCount = (str, char) =>

	return (str.match(///#{char}///g)||[]).length

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

	{char, numBuffer} = getOptions hOptions, {
		char: ' '
		numBuffer: 2
		}

	if !isString(text)
		text = text.toString()
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

	if ! isString(block)
		return false
	[head, rest] = behead(block)
	return (head == '---')

# ---------------------------------------------------------------------------

export fromTAML = (block) ->

	[head, rest] = behead(block)
	assert head.startsWith('---'), "Missing '---'"
	hOptions = {
		skipInvalid: true
		}
	return YAML.parse(untabify(rest, {numSpaces:2}), hOptions)

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

export cmdScriptName = () =>

	stub = pathLib.parse(process.argv[1]).name
	short = tla(stub)
	return short || stub

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

# ---------------------------------------------------------------------------
# --- generate a 3 letter acronym if file stub is <str>-<str>-<str>

export tla = (stub) =>

	if lMatches = stub.match(///^
			([a-z])(?:[a-z]*)
			\-
			([a-z])(?:[a-z]*)
			\-
			([a-z])(?:[a-z]*)
			$///)
		[_, a, b, c] = lMatches
		return a + b + c
	else
		return undef

# ---------------------------------------------------------------------------

export rpad = (str, len, ch=' ') =>

	assert (ch.length == 1), "Not a char"
	if notdefined(str)
		return ch.repeat(len)
	if !isString(str)
		str = str.toString()
	extra = len - str.length
	if (extra < 0) then extra = 0
	return str + ch.repeat(extra)

# ---------------------------------------------------------------------------

export lpad = (str, len, ch=' ') =>

	assert (ch.length == 1), "Not a char"
	if notdefined(str)
		return ch.repeat(len)
	if !isString(str)
		str = str.toString()
	extra = len - str.length
	if (extra < 0) then extra = 0
	return ch.repeat(extra) + str

# ---------------------------------------------------------------------------

export padString = (str, width, align) ->

	switch align
		when 'left' then return rpad(str, width)
		when 'center' then return centered(str, width)
		when 'right' then return lpad(str, width)

# ---------------------------------------------------------------------------

export zpad = (n, len) =>

	nStr = n.toString()
	return lpad(nStr, len, '0')

# ---------------------------------------------------------------------------

export findOneOf = (str, lSubStrings, pos=0) =>

	assert isString(str), "not a string: #{OL(str)}"
	assert isArray(lSubStrings), "Not an array: #{OL(lSubStrings)}"
	assert (lSubStrings.length > 0), "lSubStrings is empty array"
	loc = -1
	for substr in lSubStrings
		i = str.indexOf(substr, pos)
		if (i >= 0)
			# --- found
			if (loc == -1) || (i < loc)
				loc = i
	return loc

# ---------------------------------------------------------------------------

export matchPos = (str, pos=0) =>

	startCh = str[pos]
	endCh = switch startCh
		when '(' then ')'
		when '[' then ']'
		when '{' then '}'
		else croak "Invalid startCh: #{OL(startCh)}"
	count = 1
	pos += 1
	loc = findOneOf(str, [startCh, endCh], pos)
	while (loc != -1) && (count > 0)
		if (str[loc] == startCh)
			count += 1
		else if (str[loc] == endCh)
			count -= 1
		pos = loc
		loc = findOneOf(str, [startCh, endCh], pos+1)
	assert (pos >= 0) \
			&& (pos < str.length) \
			&& (str[pos] == endCh) \
			&& (count == 0),
			"No matching #{endCh} found"
	return pos

# ---------------------------------------------------------------------------
# --- func will receive (str)
#     should return [extractedStr, newpos]
#        newpos must be > pos
#        extractedStr may be undef

export splitStr = (str, splitFunc) =>

	lParts = []
	pos = 0
	while (pos < str.length)
		[extractedStr, inc] = splitFunc(str.substring(pos))
		assert (inc > 0), "inc = #{inc}"
		pos += inc
		if defined(extractedStr)
			lParts.push extractedStr
	return lParts

# ---------------------------------------------------------------------------

export setsAreEqual = (a, b) =>

	assert (a instanceof Set), "a is not a set"
	assert (b instanceof Set), "b is not a set"
	return (a.size == b.size) \
		&& [...a].every((val) => b.has(val))

# ---------------------------------------------------------------------------

export allCombos = (lArrayOfArrays) ->

	if (lArrayOfArrays.length == 0)
		return []
	if (lArrayOfArrays.length == 1)
		return lArrayOfArrays[0].map((x) => [x])
	lResults = []
	for item in lArrayOfArrays[0]
		for lSubArray in allCombos(lArrayOfArrays.slice(1))
			lResults.push [item, lSubArray...]
	return lResults

# ---------------------------------------------------------------------------
# --- ASYNC !

export sleep = (sec) =>

	await new Promise((r) => setTimeout(r, 1000 * sec))
	return
