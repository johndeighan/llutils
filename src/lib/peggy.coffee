# peggy.coffee

import {pathToFileURL} from 'node:url'
import peggy from 'peggy'
import eq from 'deep-equal'
import fs from 'node:fs'

import {
	undef, defined, notdefined, gen2block, hasKey,
	isEmpty, nonEmpty, lpad, toBlock,
	isString, isHash, isArray, isFunction, isInteger,
	blockToArray, arrayToBlock, escapeStr, getOptions,
	assert, croak, OL, LOG, js2uri, ML, keys, pass,
	matchPos, splitStr, rpad, zpad, words,
	} from '@jdeighan/llutils'
import {TextTable} from '@jdeighan/llutils/text-table'
import {DUMP, BOX} from '@jdeighan/llutils/dump'
import {
	indentLevel, indented, undented,
	} from '@jdeighan/llutils/indent'
import {
	readTextFile, barf, slurp, fileExt, withExt,
	isFile, normalize, mkpath, relpath, fileDir,
	} from '@jdeighan/llutils/fs'
import {procCoffee} from '@jdeighan/llutils/llcoffee'
import {PLLFetcher} from '@jdeighan/llutils/fetcher'
import {SectionMap} from '@jdeighan/llutils/section-map'

assert isFunction(procCoffee),
		"procCoffee is not a function: #{OL(procCoffee)}"

# --- code converter is applied to each code block in a peggy file
#     using type: 'javascript' allows you to use indentation syntax
#        for everything but the code blocks

hCodeConverters = {
	coffee: procCoffee
	}

sep = '# ' + '-'.repeat(62)

# ---------------------------------------------------------------------------
# --- ASYNC !!!

export getParser = (filePath, hOptions={}) =>

	{debug} = getOptions hOptions, {
		debug: false
		}

	if debug
		console.log "PEGGY file = #{OL(filePath)}"
	assert isFile(filePath), "No such file: #{OL(filePath)}"
	assert (fileExt(filePath)=='.peggy'), "Not a peggy file: #{OL(filePath)}"

	# --- writes files *.js, possibly *.map
	procPeggyFile filePath

	jsFilePath = withExt(filePath, '.js')
	if debug
		console.log "JS file = #{OL(jsFilePath)}"

	# --- h has keys StartRules, SyntaxError, parse
	h = await import(pathToFileURL(jsFilePath))
	assert isFunction(h.parse), "Bad return from import"

	return (str, hOptions={}) =>
		# --- Valid options:
		#        start - what is the start rule (usually first rule)
		#        tracer - 'none','peggy','default' or function

		{start, tracer} = getOptions hOptions, {
			start: undef     #     name of start rule
			tracer: 'none'   # --- can be none/peggy/default/a function
			}

		hParseOptions = {}
		if defined(start)
			hParseOptions.startRule = start
		switch tracer
			when 'none','peggy','default'
				hParseOptions.tracer = getTracer(tracer)
			else
				assert isFunction(tracer), "tracer not a function"
				hParseOptions.tracer = tracer

		return h.parse(str, hParseOptions)

# ---------------------------------------------------------------------------
# --- Only creates the parser as a *.js file

export procPeggy = (contents, hMetaData={}, filePath=undef, hOptions={}) =>

	assert isString(contents), "contents not a string: #{OL(contents)}"
	assert nonEmpty(contents), "empty contents: #{OL(contents)}"

	{debug, trace, opDumper, byteCodeWriter, dumpAST,
		} = getOptions hOptions, {
			debug: false
			trace: true
			opDumper: false
			byteCodeWriter: false
			dumpAST: false
			}

	# --- type determines which preprocessor to use, if any
	#        e.g. 'coffee'
	{type, allowedStartRules, include,
		} = getOptions hMetaData, {
		type: undef    # --- no preprocessing
		allowedStartRules: ['*']
		include: undef
		}

	# --- debug can be set to 'preprocess' or 'allcode'
	debugPreProcess = debugAllCode = false
	if (debug == 'preprocess')
		debug = debugPreProcess = true
	else if (debug == 'allcode') || (debug == true)
		debug = debugAllCode = true

	if debug
		if type
			console.log "procPeggy #{OL(filePath)} as #{type}"
		else
			console.log "procPeggy #{OL(filePath)}"

	# --- preprocess contents if required
	if defined(type)
		assert isFunction(hCodeConverters[type]), "Bad type #{type}"
		peggyCode = PreProcessPeggy(contents, hMetaData, hOptions)
		if defined(filePath)
			barf peggyCode, withExt(filePath, ".peggy.txt")
	else
		peggyCode = contents

	# --- set lUses to an array of included files
	if isString(include)
		lUses = [include]
	else if isArray(include)
		lUses = include
	else
		lUses = []

	# --- build list of all inputs
	lInputs = [
		{source: filePath, text: peggyCode}
		]
	for filePath in lUses
		{hMetaData: hMeta, contents: str} = readTextFile(filePath, 'eager')
		lInputs.push {
			source: filePath
			text: PreProcessPeggy(str, hMeta)
			}

	if debug
		console.log "INPUTS:"
		allCode = ''
		for {source, text} in lInputs
			console.log "   SOURCE: #{OL(source)}"
			console.log "   TEXT: #{escapeStr(text).substring(0, 40)}"
			allCode += text
		if debugAllCode
			DUMP allCode, 'ALL CODE'

	hOptions = {
		allowedStartRules
		format: 'es'
		trace
		}

	if opDumper
		opDumper = hOptions.opDumper = new OpDumper()

	if byteCodeWriter
		byteCodeWriter = hOptions.byteCodeWriter = new ByteCodeWriter()

	if dumpAST
		hOptions.dumpAST = withExt(filePath, '.ast.txt')

	try
		if defined(filePath)
			hOptions.grammarSource = filePath
			hOptions.output = 'source-and-map'

			sourceNode = peggy.generate(lInputs, hOptions)

			hOtherFiles = {}
			if opDumper
				hOtherFiles['.ops.txt'] = opDumper.getBlock()

			if byteCodeWriter
				hOtherFiles['.bytecodes.txt'] = byteCodeWriter.getBlock()

			{code: jsCode, map} = sourceNode.toStringWithSourceMap()
			assert isString(jsCode), "jsCode = #{OL(jsCode)}"
			sourceMap = map.toString()
			assert isString(sourceMap), "sourceMap = #{OL(sourceMap)}"
			hResult = {
				code: jsCode
				sourceMap: map.toString()
				hOtherFiles
				lUses
				}
			return hResult
		else
			hOptions.output = 'source'
			jsCode = peggy.generate(lInputs, hOptions)
			return {
				code: jsCode
				hOtherFiles
				lUses
				}
	catch err
		# --- If file was preprocessed, and text version hasn't
		#     already been saved, save it now
		if defined(filePath) && defined(type) && ! debug
			barf peggyCode, withExt(filePath, ".peggy.txt")
		throw err

# ---------------------------------------------------------------------------

export procPeggyFile = (filePath, hOptions={}) =>

	assert (fileExt(filePath) == '.peggy'), "Not a peggy file"
	assert isFile(filePath), "No such file: #{OL(filePath)}"
	{hMetaData, contents} = readTextFile(filePath, 'eager')
	return procPeggy contents, hMetaData, filePath, hOptions

# ---------------------------------------------------------------------------

export getSource = (filePath) =>

	{hMetaData, contents} = readTextFile(filePath, 'eager')
	peggyCode = PreProcessPeggy(contents, hMetaData)

	return {
		source: filePath,
		text: peggyCode
		}

# ---------------------------------------------------------------------------

export analyzePeggyFile = (filePath) =>

	assert isFile(filePath), "No such file: #{OL(filePath)}"
	{hMetaData, contents} = readTextFile(filePath, 'eager')
	hResults = {}
	if hasKey(hMetaData, 'include')
		include = hMetaData.include
		if isString(include)
			hResults.lUses = [include]
		else if isArray(include)
			hResults.lUses = include
		else
			croak "Bad include key in meta data in #{OL(filePath)}"
	else
		hResults.lUses = []
	return hResults

# ---------------------------------------------------------------------------

export meSplitter = (str) =>

	lMatches = str.match(///^
			(.*?)       # everything before 'DO'
			\b DO \b
			(\s*)
			(.*)        # everything after 'DO' + ws (must start w/ '{')
			$///)

	# --- if no 'DO' in string, return entire string trimmed
	if notdefined(lMatches)
		return [str.trim(), str.length]

	# --- if pre isn't all whitespace, return pre trimmed
	[_, pre, ws, post] = lMatches
	prelen = pre.length
	pre = pre.trim()
	if (pre.length > 0)
		return [pre, prelen]

	# --- Now we know - str contains 'DO'

	# --- Find '{' in post, which must be the 1st char in post
	#     There must be only whitespace between 'DO' and '{'
	blockStart = prelen + 2 + ws.length
	blockEnd = matchPos(str, blockStart)
	assert (str[blockStart] == '{'),
			"Bad blockStart = #{blockStart} in #{OL(str)}"
	assert (str[blockEnd]   == '}'),
			"Bad blockEnd = #{blockEnd} in #{OL(str)}"
	inside = str.substring(blockStart+1, blockEnd)
	if inside.endsWith(';')
		return ["& {#{inside}return true;}", blockEnd+1]
	else
		return ["& {#{inside};return true;}", blockEnd+1]

# ---------------------------------------------------------------------------

export PreProcessPeggy = (code, hMetaData={}, filePath=undef, hOptions={}) =>

	assert isString(code), "not a string: #{typeof code}"
	{type} = getOptions hMetaData, {
		type: 'coffee'
		}
	if notdefined(type)
		return code
	{debug} = getOptions hOptions, {
		debug: false
		}

	src = new PLLFetcher(code)

	if debug
		src.dump 'ALL CODE'

	sm = new SectionMap [
		'header'
		'init'
		'rules'
		], {    # --- converters

		# --- 'header' will be CoffeeScript code
		header: (block) =>
			try
				{code, sourceMap} = hCodeConverters[type](block)

			catch err
				console.log "ERROR: Unable to convert #{OL(type)} code to JS"
				console.log err
				code = ''

			return [
				'{{'
				indented(code)
				'}}'
				].join("\n")

		# --- 'init' section will already be JavaScript
		init: (block) =>
			if nonEmpty(block)
				return """
					{
					#{block}
					}
					"""
			else
				return undef
		}

	headerSection = sm.section('header')
	initSection   = sm.section('init')
	rulesSection  = sm.section('rules')

	if eq(src.peek(), [0, 'GLOBAL'])
		src.skip()
		coffeeCode = src.getBlock(1)
		if nonEmpty(coffeeCode)
			if debug
				DUMP coffeeCode, 'GLOBAL CODE'
			headerSection.add(coffeeCode)

	if eq(src.peek(), [0, 'PER_PARSE'])
		src.skip()
		coffeeCode = src.getBlock(1)
		if nonEmpty(coffeeCode)
			if debug
				DUMP code, 'PER_PARSE CODE'
			headerSection.add("init = () =>")
			headerSection.add(1, coffeeCode)
			initSection.add('init();')

	hRules = {}     # { <ruleName>: <numMatchExpr>, ... }

	# --- Define utility functions

	getMatchExpr = () =>

		# --- Get match expression
		[level, matchExpr] = src.fetch()
		assert (level == 1), "BAD - level not 1"

		# --- Extract names of new variables
		lVars = []
		re = /([A-Za-z_][A-Za-z0-9_-]*)\:/g
		for match from matchExpr.matchAll(re)
			lVars.push match[1]

		return [
			splitStr(matchExpr, meSplitter).join(' ')
			lVars
			]

	while src.moreLines()

		# --- Get rule name - must be left aligned, no whitespace
		[level, name] = src.fetch()
		assert (level == 0), "Next level not 0"
		if debug
			console.log "RULE: #{name}"
		assert name.match(/^[A-Za-z_][A-Za-z0-9_-]*$/),
				"Bad name: #{OL(name)}"
		assert !hasKey(hRules, name), "duplicate rule #{name}"

		rulesSection.add('')
		rulesSection.add(name)
		hRules[name] = 0   # number of options

		while (src.peekLevel() == 1)

			[matchExpr, lVars] = getMatchExpr()
			argStr = lVars.join(', ')

			# --- output the match expression
			ch = if (hRules[name] == 0) then '=' else '/'
			hRules[name] += 1

			rulesSection.add('')
			rulesSection.add(1, "#{ch} #{matchExpr}")

			coffeeCode = src.getBlock(2)
			if nonEmpty(coffeeCode)
				if debug
					DUMP code, 'CODE'
				funcName = "parse__#{name}__#{hRules[name]}"
				headerSection.add(sep)
				headerSection.add('')
				headerSection.add("#{funcName} = (#{argStr}) =>")
				headerSection.add('')
				headerSection.add(1, coffeeCode)

				line = "{ return #{funcName}(#{argStr}); }"
				rulesSection.add(2, line)

	if debug
		sm.dump()

	# --- Get the built code
	peggyCode = sm.getBlock()
	if debug
		DUMP peggyCode, 'PEGGY CODE'
	return peggyCode

# ---------------------------------------------------------------------------
# --- a converter should return {code: jsCode, sourceMap: srcMap}

export addCodeConverter = (name, func) =>

	assert isString(name, {nonEmpty: true}), "Bad name: #{name}"
	assert ! hasKey(hCodeConverters, name),
			"#{name} code converter already exists"
	assert (typeof func == 'function'), "Not a function: #{func}"
	hCodeConverters[name] = func
	return

# ---------------------------------------------------------------------------

export class ByteCodeWriter

	constructor: (hOptions={}) ->

		@lRuleNames = [];
		@hRules = {}

		# --- These are set when the AST is known
		@literals = undef
		@expectations = undef

		# --- options
		@detailed = hOptions.detailed

	# ..........................................................

	setAST: (ast) ->

		assert (ast.type == 'grammar'), "not a grammar"
		assert (ast.rules.length > 0), "no rules"
		@literals = ast.literals
		@expectations = ast.expectations
		return

	# ..........................................................

	add: (ruleName, lOpcodes) ->

		assert (typeof ruleName == 'string'), "not a string"
		assert Array.isArray(lOpcodes), "not an array"
		assert !@hRules[ruleName], "rule #{ruleName} already defined"
		@lRuleNames.push ruleName
		@hRules[ruleName] = lOpcodes
		return

	# ..........................................................

	getOpInfo: (op, pos) ->

		switch op
			when 35 then return ['PUSH_EMPTY_STRING', [],              []]
			when 5  then return ['PUSH_CUR_POS',      [],              []]
			when 1  then return ['PUSH_UNDEFINED',    [],              []]
			when 2  then return ['PUSH_NULL',         [],              []]
			when 3  then return ['PUSH_FAILED',       [],              []]
			when 4  then return ['PUSH_EMPTY_ARRAY',  [],              []]
			when 6  then return ['POP',               [],              []]
			when 7  then return ['POP_CUR_POS',       [],              []]
			when 8  then return ['POP_N',             ['/'],           []]
			when 9  then return ['NIP',               [],              []]
			when 10 then return ['APPEND',            [],              []]
			when 11 then return ['WRAP',              [''],            []]
			when 12 then return ['TEXT',              [],              []]
			when 36 then return ['PLUCK',             ['/','/','/','p'], []]
			when 13 then return ['IF',                [],              ['THEN', 'ELSE']]
			when 14 then return ['IF_ERROR',          [],              ['THEN', 'ELSE']]
			when 15 then return ['IF_NOT_ERROR',      [],              ['THEN', 'ELSE']]
			when 30 then return ['IF_LT',             [],              ['THEN', 'ELSE']]
			when 31 then return ['IF_GE',             [],              ['THEN', 'ELSE']]
			when 32 then return ['IF_LT_DYNAMIC',     [],              ['THEN', 'ELSE']]
			when 33 then return ['IF_GE_DYNAMIC',     [],              ['THEN', 'ELSE']]
			when 16 then return ['WHILE_NOT_ERROR',   [],              ['THEN']]
			when 17 then return ['MATCH_ANY',         [],              ['THEN', 'ELSE']]
			when 18 then return ['MATCH_STRING',      ['/lit'],        ['THEN', 'ELSE']]
			when 19 then return ['MATCH_STRING_IC',   ['/lit'],        ['THEN', 'ELSE']]
			when 20 then return ['MATCH_CHAR_CLASS',  ['/class'],      []]
			when 21 then return ['ACCEPT_N',          ['/num'],        []]
			when 22 then return ['ACCEPT_STRING',     ['/lit'],        []]
			when 23 then return ['FAIL',              ['/expectation'],[]]
			when 24 then return ['LOAD_SAVED_POS',    ['pos/num'],     []]
			when 25 then return ['UPDATE_SAVED_POS',  ['pos/num'],     []]
			when 26 then return ['CALL',              [],              []]
			when 27 then return ['RULE',              ['/rule'],       []]
			when 37 then return ['SOURCE_MAP_PUSH',   [],              []]
			when 38 then return ['SOURCE_MAP_POP',    [],              []]
			when 39 then return ['SOURCE_MAP_LABEL_PUSH', [],              []]
			when 40 then return ['SOURCE_MAP_LABEL_POP',  [],              []]
			else
				return ["OPCODE #{op}", [], []]

	# ..........................................................

	argStr: (arg, infoStr) ->

		if (infoStr == '/')
			return arg.toString()

		[label, type] = infoStr.split('/')

		switch type

			when 'rule'
				if (arg < @lRuleNames.length)
					result = "<#{@lRuleNames[arg]}>"
				else
					result = "<##{arg}>"

			when 'lit'
				result = "'#{@literals[arg]}'"

			when 'num','i'
				result = arg.toString()

			when 'expectation'
				hExpect = @expectations[arg]
				if defined(hExpect)
					{type, value} = hExpect
					switch type
						when 'literal'
							result = "\"#{value}\""
						when 'class'
							result = "[..]"
						when 'any'
							result = '.'
						else
							result = "Unknown expectation type: #{type}"
				else
					result = 'hExpect = undef'
			when 'block'
				if label
					result = "#{label}:#{arg}"
				else
					result = "BLOCK: #{arg}"

			when 'class'
				if label
					result = "#{label}:[#{arg}]"
				else
					result = "CLASS: #{arg}"

			else
				result = "<UNKNOWN>: #{OL(arg)}"

		if @detailed
			return "(#{arg}) #{result}"
		else
			return result

	# ..........................................................

	opStr: (lOpcodes) ->

		debugger
		lLines = []
		pos = 0
		while (pos < lOpcodes.length)
			op = lOpcodes[pos]
			pos += 1

			[name, lArgInfo, lBlockInfo] = @getOpInfo(op, pos)
			numArgs = lArgInfo.length
			if (numArgs == 0)
				if @detailed
					lLines.push "(#{op}) #{name}"
				else
					lLines.push "#{name}"
			else
				lArgs = lOpcodes.slice(pos, pos + numArgs)
				pos += numArgs
				lArgDesc = lArgs.map (arg,i) => @argStr(arg, lArgInfo[i])
				if @detailed
					lLines.push "(#{op}) #{name} #{lArgDesc.join(' ')}"
				else
					lLines.push "#{name} #{lArgDesc.join(' ')}"

			blockBase = pos + lBlockInfo.length
			for label,i in lBlockInfo
				blockLen = lOpcodes[pos]
				pos += 1

				switch label
					when 'ELSE'
						if (blockLen > 0)
							lLines.push 'ELSE'
					when 'THEN'
						pass()
					else
						croak "Bad block label: #{label}"

				lSubOps = lOpcodes.slice(blockBase, blockBase + blockLen)
				lLines.push indented(@opStr(lSubOps))
				blockBase += blockLen
			pos = blockBase
		return lLines.join("\n")

	# ..........................................................

	getBlock: () ->

		lParts = []
		for ruleName in Object.keys(@hRules)
			lParts.push "<#{ruleName}>"
			lOpcodes = @hRules[ruleName]
			block = @opStr(lOpcodes).trimEnd()
			if (block != '')
				lParts.push indented(block)
			lParts.push ''
		return lParts.join("\n").trimEnd()

# --------------------------------------------------------------------------

export class OpDumper

	constructor: (hOptions={}) ->

		{ignore} = getOptions hOptions, {
			ignore: [37, 38, 39, 40]
			}
		@lIgnore = ignore
		@level = 0
		@lLines = []

	# ..........................................................

	setStack: (stack) ->

		@stack = stack
		return

	# ..........................................................

	incLevel: () -> @level += 1
	decLevel: () -> @level -= 1

	# ..........................................................

	out: (str) ->
		@lLines.push "  ".repeat(@level) + str
		return

	# ..........................................................

	outOp: (index, op) ->

		if !@lIgnore.includes(op)
			@out "OP[#{lpad(index,2)}]: #{lpad(op,2)} #{@getName(op)}"

	# ..........................................................

	outBC: (lByteCodes) ->

		# --- For now, don't output anything
		return

		@out 'OPCODES: ' \
			+ lByteCodes \
				.filter((x) => !@lIgnore.includes(x)) \
				.map((x) => x.toString()) \
				.join(' ');
		return

	# ..........................................................

	outCode: (lLines, label) ->

		lLines = BOX toBlock(lLines), label, {
			echo: false
			asArray: true
			}
		for line in lLines
			@out line
		return

	# ..........................................................

	getBlock: () ->

		return @lLines.join("\n")

	# ..........................................................

	getName: (op) ->

		switch op
			when  0 then return 'PUSH'
			when 35 then return 'PUSH_EMPTY_STRING'
			when  1 then return 'PUSH_UNDEFINED'
			when  2 then return 'PUSH_NULL'
			when  3 then return 'PUSH_FAILED'
			when  4 then return 'PUSH_EMPTY_ARRAY'
			when  5 then return 'PUSH_CURR_POS'
			when  6 then return 'POP'
			when  7 then return 'POP_CURR_POS'
			when  8 then return 'POP_N'
			when  9 then return 'NIP'
			when 10 then return 'APPEND'
			when 11 then return 'WRAP'
			when 12 then return 'TEXT'
			when 36 then return 'PLUCK'

			# ---  Conditions and Loops

			when 13 then return 'IF'
			when 14 then return 'IF_ERROR'
			when 15 then return 'IF_NOT_ERROR'
			when 30 then return 'IF_LT'
			when 31 then return 'IF_GE'
			when 32 then return 'IF_LT_DYNAMIC'
			when 33 then return 'IF_GE_DYNAMIC'
			when 16 then return 'WHILE_NOT_ERROR'

			# ---  Matching

			when 17 then return 'MATCH_ANY'
			when 18 then return 'MATCH_STRING'
			when 19 then return 'MATCH_STRING_IC'
			when 20 then return 'MATCH_CHAR_CLASS'
			when 20 then return 'MATCH_REGEXP'
			when 21 then return 'ACCEPT_N'
			when 22 then return 'ACCEPT_STRING'
			when 23 then return 'FAIL'

			# ---  Calls

			when 24 then return 'LOAD_SAVED_POS'
			when 25 then return 'UPDATE_SAVED_POS'
			when 26 then return 'CALL'

			# ---  Rules

			when 27 then return 'RULE'
			when 41 then return 'LIBRARY_RULE'

			# ---  Failure Reporting

			when 28 then return 'SILENT_FAILS_ON'
			when 29 then return 'SILENT_FAILS_OFF'

			when 37 then return 'SOURCE_MAP_PUSH'
			when 38 then return 'SOURCE_MAP_POP'
			when 39 then return 'SOURCE_MAP_LABEL_PUSH'
			when 40 then return 'SOURCE_MAP_LABEL_POP'

			else return '<UNKNOWN>'

# ---------------------------------------------------------------------------

export class BaseTracer

	constructor: (hOptions={}) ->

		h = getOptions hOptions, {
			posType: 'linecol'
			lIgnore: ['_']
			lIgnoreSubs: []
			}
		@hOptions = h
		@posType = h.posType
		@lIgnoreSubs = h.lIgnoreSubs
		@lIgnore = h.lIgnore
		for rule in @lIgnore
			if !@lIgnoreSubs.includes(rule)
				@lIgnoreSubs.push rule
		@lStack = []     # stack of rule names

	# ..........................................................

	traceIt: (hInfo) ->

		{type, rule} = hInfo
		[category, action] = type.split('.')

		# --- NOTE: Any rule name in @lIgnore
		#           will also be in @lIgnoreSubs

		if @lIgnore.includes(rule)
			if (category == 'rule')
				return false

		if (category == 'rule') && \
				((action == 'match') || (action == 'fail'))
			for rule,i in @lStack
				if @lIgnoreSubs.includes(rule) && (i != @lStack.length - 1)
					return false
		else
			for rule in @lStack
				if @lIgnoreSubs.includes(rule)
					return false
		return true

	# ..........................................................

	destroy: () ->

		return

	# ..........................................................

	adjustStack: (hInfo) ->

		{type, rule} = hInfo
		switch type
			when 'rule.enter'
				@lStack.push rule
			when 'rule.fail', 'rule.match'
				@lStack.pop()
		return

	# ..........................................................

	trace: (hInfo) ->

		return

	# ..........................................................

	posStr: (location, posType=undef) ->

		if notdefined(posType)
			posType = @posType
		if notdefined(location) || !isHash(location)
			return rpad('unknown', 12)
		{start: s, end: e} = location
		sl = zpad(s.line)
		sc = zpad(s.column)
		so = zpad(s.offset)
		el = zpad(e.line)
		ec = zpad(e.column)
		eo = zpad(e.offset)
		if (sl == 1) && (el == 1)
			return posStr(location, 'offset')

		switch @posType
			when 'linecol'
				if (so == eo)
					return "#{sl}:#{sc}"
				else
					return "#{sl}:#{sc}-#{el}:#{ec}"
			when 'offset'
				if (so == eo)
					return "#{so}"
				else
					return "#{so}-#{eo}"
			else
				if (so == eo)
					return "#{sl}:#{sc}:#{so}"
				else
					return "#{sl}:#{sc}:#{so}-#{el}:#{ec}:#{eo}"

# ---------------------------------------------------------------------------

export class RawTracer extends BaseTracer

	trace: (hInfo) ->

		@adjustStack(hInfo)
		console.log JSON.stringify(hInfo, null, 3)

# ---------------------------------------------------------------------------

export class DebugTracer extends BaseTracer

	constructor: (hOptions={}) ->

		super(hOptions)
		@tt = new TextTable('l l l l l')
		@tt.fullsep()
		@tt.labels words('type rule result details position')
		@tt.sep()

	trace: (hInfo) ->

		@adjustStack(hInfo)
		{type, rule, result, details, location} = hInfo
		@tt.data [
			type,
			rule,
			JSON.stringify(result),
			details,
			@posStr(location)
			]
		return

	destroy: () ->

		console.log @tt.asString()

# ---------------------------------------------------------------------------

export class AdvancedTracer extends BaseTracer

	traceStr: (hInfo, level=0) ->

		{type, rule, location, result, details} = hInfo

		locStr = @posStr(location)
		startPos = location?.start?.offset
		endPos = location?.end?.offset
		[obj, action] = type.split('.')

		switch action

			when 'enter'

				assert (obj == 'rule'), "obj=#{obj}, act=#{action}"
				pre = "│  ".repeat(level)
				return "#{pre}? #{rule}"

			when 'match'

				if (obj == 'rule')
					pre = "│  ".repeat(level-1) + "└─>"
				else
					pre = "│  ".repeat(level)

				if defined(result)
					if defined(endPos)
						return "#{pre} #{OL(result)} (pos -> #{endPos})"
					else
						return "#{pre} #{OL(result)}"
				else
					if defined(endPos)
						return "#{pre} YES (pos=#{endPos})"
					else
						return "#{pre} YES"

			when 'fail'

				if (obj == 'rule')
					pre = "│  ".repeat(level-1) + "└─> FAIL"
					if defined(location)
						return " #{pre} (at #{locStr})"
					else
						return " #{pre}".trim()
				else
					pre = "│  ".repeat(level-1) + "x  "
					if defined(location)
						return "#{pre} #{obj} #{OL(details)} (at #{locStr})"
					else
						return "#{pre} #{obj}"


			else
				return "UNKNOWN type: #{type}"
		return

	# ..........................................................

	trace: (hInfo) ->

		debugger
		if @traceIt(hInfo)
			result = @traceStr(hInfo, @lStack.length)
			if isString(result)
				console.log result
			else if isArray(result)
				for str in result
					console.log str

		@adjustStack(hInfo)
		return

# ---------------------------------------------------------------------------

export class DetailedTracer extends AdvancedTracer

	constructor: (@input, hOptions={}) ->

		super(hOptions)
		@input = @hOptions.input
		@hVars = @hOptions.hVars

	# ..........................................................

	varStr: () ->

		if isEmpty(@hVars)
			return ''

		lParts = []
		for varname in keys(@hVars)
			value = @hVars[varname]()
			lParts.push "#{varname} = #{OL(value)}"
		if (lParts.length == 0)
			return ''
		else
			return ' (' + lParts.join(',') + ')'

	# ..........................................................

	traceStr: (hInfo, level) ->

		str = super hInfo
		if (hInfo.type != 'rule.fail') || isEmpty(@input)
			return str

		{type, rule, location, result} = hInfo
		if defined(location)
			{offset} = location.start
			return [
				str
				"#{escapeStr(@input, 'esc', {offset})}#{@varStr()}"
				]
		else
			return [
				str
				"#{escapeStr(@input, 'esc')}#{@varStr()}"
				]

# ---------------------------------------------------------------------------
# --- tracer can be:
#        - undef
#        - a string: 'none', 'debug', 'peggy','advanced','detailed'
#        - an object with a function property named 'trace'
#        - a function

export getTracer = (tracer='advanced', hOptions={}) =>

	hOptions = getOptions hOptions, {
		input: undef
		lIgnore: ['_']
		lIgnoreSubs: []
		hVars: {}
		}

	switch (typeof tracer)
		when 'undefined'
			return new BaseTracer(hOptions)
		when 'object'
			if defined(tracer)
				return tracer
			else
				return new BaseTracer(hOptions)
		when 'function'
			return {trace: tracer}
		when 'string'
			[tracer, option] = tracer.split('/')
			if option
				hOptions.posType = option
			switch tracer
				when 'raw'
					return new RawTracer(hOptions)
				when 'debug'
					return new DebugTracer(hOptions)
				when 'advanced'
					return new AdvancedTracer(hOptions)
				when 'detailed'
					return new DetailedTracer(hOptions)
				when 'peggy'
					return undef
				else
					return new BaseTracer(hOptions)
