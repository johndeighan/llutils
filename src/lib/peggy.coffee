# peggy.coffee

import pathLib from 'node:path'
import {pathToFileURL} from 'node:url'
import peggy from 'peggy'

import {
	undef, defined, notdefined, gen2block, hasKey, isEmpty, nonEmpty,
	isString, isHash, isArray, isFunction, isInteger,
	blockToArray, arrayToBlock, escapeStr, getOptions,
	assert, croak, OL, js2uri, ML, keys, pass, eq,
	} from '@jdeighan/llutils'
import {DUMP} from '@jdeighan/llutils/dump'
import {
	indentLevel, indented, undented,
	} from '@jdeighan/llutils/indent'
import {
	readTextFile, barf, fileExt, withExt, isFile, myself,
	normalize, mkpath, fileDir,
	} from '@jdeighan/llutils/fs'
import {brew} from '@jdeighan/llutils/coffee'
import {PLLFetcher} from '@jdeighan/llutils/fetcher'
import {SectionMap} from '@jdeighan/llutils/section-map'

# --- code converter is applied to each code block in a peggy file
#     using type: 'javascript' allows you to use indentation syntax
#        for everything but the code blocks
hCodeConverters = {
	coffee: brew
	javascript: (js) => return {js, sourceMap: undef}
	}

# ---------------------------------------------------------------------------
# --- ASYNC !!!

export getParser = (filePath, hOptions={}) =>

	{debug} = getOptions hOptions, {
		debug: false
		}

	fullPath = mkpath(filePath)
	if debug
		console.log "PEGGY file = #{OL(fullPath)}"
	assert isFile(fullPath), "No such file: #{OL(filePath)}"
	assert (fileExt(fullPath)=='.peggy'), "Not a peggy file: #{OL(filePath)}"

	{jsFilePath} = peggifyFile(fullPath)
	if debug
		console.log "JS file = #{OL(jsFilePath)}"

	# --- h has keys StartRules, SyntaxError, parse
	h = await import(pathToFileURL(jsFilePath))
	assert isFunction(h.parse), "Bad return from import"

	return (str, hOptions={}) =>
		# --- Valid options:
		#        start - what is the start rule (usually first rule)
		#        tracer - 'none','peggy','default'

		{start, tracer} = getOptions hOptions, {
			start: undef     #     name of start rule
			tracer: 'none'   # --- can be none/peggy/default/a function
			}

		hParseOptions = {}
		if defined(start)
			hParseOptions.startRule = start
		switch tracer
			when 'none'
				hParseOptions.tracer = new Tracer()
			when 'peggy'
				pass()
			when 'default'
				hParseOptions.tracer = new MyTracer()
			else
				assert isFunction(tracer), "tracer not a function"
				hParseOptions.tracer = tracer

		return h.parse(str, hParseOptions)

# ---------------------------------------------------------------------------
#    code - a block
#    hMetaData
#       - 'type' (usually 'coffee')
#       - 'trace' (default: true)

export peggify = (code, hMetaData={}, filePath=undef) =>

	assert isString(code), "code not a string: #{typeof code}"

	# --- type determines which preprocessor to use, if any
	{type, debug, trace} = getOptions hMetaData, {
		type: 'coffee'
		debug: false
		trace: true
		}

	if debug
		console.log "peggify() #{OL(filePath)}"

	# --- preprocess code if required
	if defined(type)
		if debug
			console.log "TYPE: #{OL(type)}"
		assert isFunction(hCodeConverters[type]), "Bad type #{type}"
		peggyCode = PreProcessPeggy(code, hMetaData)
		if defined(filePath) && debug
			filePath = "./test/temp.txt"
			barf peggyCode, filePath
			console.log "Preprocessed code saved to #{OL(filePath)}"
	else
		peggyCode = code

	js = peggy.generate(peggyCode, {
		allowedStartRules: ['*']
		format: 'es'
		output: 'source'  # --- return a string of JS
		trace
		})
	return {
		js
		sourceMap: undef
		peggyCode
		}

# ---------------------------------------------------------------------------

export peggifyFile = (filePath) =>

	{hMetaData, reader} = readTextFile(filePath)
	code = gen2block(reader)
	{js, sourceMap} = peggify code, hMetaData, filePath
	jsFilePath = withExt(filePath, '.js')
	barf js, jsFilePath
	if defined(sourceMap)
		sourceMapFilePath = withExt(filePath, '.js.map')
		barf sourceMap, sourceMapFilePath
	return {
		jsFilePath
		sourceMapFilePath
		}

# ---------------------------------------------------------------------------

export PreProcessPeggy = (code, hMetaData) =>

	assert isString(code), "not a string: #{typeof code}"
	{type, debug} = getOptions hMetaData, {
		type: 'coffee'
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
				{js, sourceMap} = hCodeConverters[type](block)

			catch err
				console.log "ERROR: Unable to convert #{OL(type)} code to JS"
				console.log err
				js = ''

			return [
				'{{'

				# --- If we add an import for mkString(), users will get
				#     and error if they also import it. So, instead,
				#     we define our own version, though it's identical
				# indented("import {mkString} from '@jdeighan/llutils';")

				indented(brew("""
					mkString2 = (lItems...) =>

						lStrings = []
						for item in lItems
							if isString(item)
								lStrings.push item
							else if isArray(item)
								lStrings.push mkString(item...)
						return lStrings.join('')
					""").js)

				indented(js)
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

	numFuncs = 0    # used to construct unique function names

	if eq(src.peek(), [0, 'GLOBAL'])
		src.skip()
		coffeeCode = src.getBlock(1)
		if nonEmpty(coffeeCode)
			if debug
				DUMP coffeeCode, 'GLOBAL CODE'
			sm.section('header').add(coffeeCode)

	if eq(src.peek(), [0, 'PER_PARSE'])
		src.skip()
		coffeeCode = src.getBlock(1)
		if nonEmpty(coffeeCode)
			if debug
				DUMP code, 'PER_PARSE CODE'
			sm.section('header').add("init = () =>")
			sm.section('header').add(1, coffeeCode)
			sm.section('init').add('init();')

	hRules = {}     # { <ruleName>: <numMatchExpr>, ... }

	while src.moreLines()

		# --- Get rule name - must be left aligned, no whitespace
		[level, name] = src.fetch()
		assert (level == 0), "Next level not 0"
		if debug
			console.log "RULE: #{name}"
		assert name.match(/^[A-Za-z][A-Za-z0-9_-]*$/),
				"Bad name: #{OL(name)}"
		assert !hasKey(hRules, name), "duplicate rule #{name}"
		sm.section('rules').add(name)
		hRules[name] = 0   # number of options

		while (src.peekLevel() == 1)

			# --- Get match expression
			[level, matchExpr] = src.fetch()
			assert (level == 1), "BAD - level not 1"

			# --- Extract names of new variables
			lVars = []
			hJoin = {}
			re = /([A-Za-z][A-Za-z_-]*)\:(\:)?/g
			for match from matchExpr.matchAll(re)
				[_, str, flag] = match
				lVars.push str
				if flag
					hJoin[str] = true

			strParms = lVars.join(',')
			strArgs = (
				for v in lVars
					if hJoin[v]
						"mkString2(#{v})"
					else
						v
				).join(',')

			# --- output the match expression
			ch = if (hRules[name] == 0) then '=' else '/'
			hRules[name] += 1

			matchExpr = matchExpr.replaceAll('::', ':')
			sm.section('rules').add(1, "#{ch} #{matchExpr}")

			coffeeCode = src.getBlock(2)
			if nonEmpty(coffeeCode)
				if debug
					DUMP code, 'CODE'
				funcName = "func#{numFuncs}"
				numFuncs += 1

				line = "#{funcName} = (#{strParms}) =>"
				sm.section('header').add(line)
				sm.section('header').add(1, coffeeCode)

				line = "{ return #{funcName}(#{strArgs}); }"
				sm.section('rules').add(2, line)

	if debug
		sm.dump()

	# --- Get the built code
	peggyCode = sm.getBlock()
	if debug
		DUMP peggyCode, 'PEGGY CODE'
	return peggyCode

# ---------------------------------------------------------------------------

# --- Tracer object does not log

class Tracer

	trace: ({type, rule, location}) ->
		pass()

class MyTracer extends Tracer

	constructor: () ->
		super()
		@level = 0

	prefix: () ->
		return "|  ".repeat(@level)

	trace: ({type, rule, location, match}) ->
		switch type
			when 'rule.enter'
				console.log "#{@prefix()}? #{rule}"
				@level += 1
			when 'rule.fail'
				@level -= 1;
				console.log "#{@prefix()}NO"
			when 'rule.match'
				@level -= 1
				if defined(match)
					console.log "#{@prefix()}YES - #{OL(match)}"
				else
					console.log "#{@prefix()}YES"
			else
				console.log "UNKNOWN type: #{type}"
		return

# ---------------------------------------------------------------------------

export getTracer = (type) =>

	switch type
		when 'default'
			return new MyTracer()
		when 'peggy'
			return undef
		else
			return new Tracer()

# ---------------------------------------------------------------------------
# --- a converter should return {js: jsCode, sourceMap: srcMap}

export addCodeConverter = (name, func) =>

	assert isString(name, {nonEmpty: true}), "Bad name: #{name}"
	assert ! hasKey(hCodeConverters, name),
			"#{name} code converter already exists"
	assert (typeof func == 'function'), "Not a function: #{func}"
	hCodeConverters[name] = func
	return

# ---------------------------------------------------------------------------
