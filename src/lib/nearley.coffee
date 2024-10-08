# nearley.coffee

import nearley  from 'nearley'
import compile  from "nearley/lib/compile.js"
import generate from "nearley/lib/generate.js"
import nearleyGrammar from "nearley/lib/nearley-language-bootstrapped.js"
import {pathToFileURL} from 'node:url'
import {temporaryFile as tempFile} from 'tempy'

import {procCoffee} from '@jdeighan/llutils/llcoffee'
import {
	undef, defined, notdefined, nonEmpty, OL, LOG, getOptions,
	isString, isArray, isFunction, isHash,
	assert, croak, untabify, tabify, escapeStr,
	} from '@jdeighan/llutils'
import {
	isFile, fileExt, withExt, readTextFile,
	slurp, barf, barfDebugFile, mkpath,
	} from '@jdeighan/llutils/fs'
import {checkJS} from '@jdeighan/llutils/exec-utils'

# ---------------------------------------------------------------------------

export fixNearlyJs = (jsCode) =>

	# --- remove the function wrapper and lame attempt to export
	jsCode = jsCode.replace(/\(\s*function\s*\(\s*\)\s*{/, '')
	ifpos = jsCode.indexOf('if (typeof module')
	assert (ifpos > 10), "pos not found"
	jsCode = jsCode.substring(0, ifpos).trim()

	# --- Next, add export statement
	return jsCode + "\nexport {grammar};"

# ---------------------------------------------------------------------------

getParserObj = (grammar=nearleyGrammar) =>

	return new nearley.Parser(grammar)

# ---------------------------------------------------------------------------

export parseInput = (parserObj, code, filePath=undef, hOptions={}) =>

	{debug, allowAmbiguous} = getOptions hOptions, {
		debug: false
		allowAmbiguous: false
		}

	assert isString(code), "Not a string: #{OL(code)}"
	parserObj.feed(code)
	lResults = parserObj.results
	if defined(filePath)
		from = OL(filePath)
	else
		from = escapeStr(code).substring(0, 24) + '...'
	assert nonEmpty(lResults), "Error in grammar: #{from}"
	if !allowAmbiguous
		assert (lResults.length == 1), "Ambiguous grammar in #{from}"
	return lResults[0]

# ---------------------------------------------------------------------------
# --- ASYNC !

export getNearleyParser = (code, filePath=undef, hOptions={}) =>

	{debug, streaming} = getOptions hOptions, {
		debug: false
		streaming: false
		}

	if defined(filePath)
		assert isFile(filePath), "No such file: #{OL(filePath)}"
		assert (fileExt(filePath)=='.ne'), "Not a nearley file: #{OL(filePath)}"

	if notdefined(code)
		assert isFile(filePath), "No such file: #{OL(filePath)}"
		code = slurp filePath
	coreParserObj = new nearley.Parser(nearleyGrammar)
	ast = parseInput(coreParserObj, code, filePath, 'allowAmbiguous')

	# --- Compile the AST into a set of rules
	setOfRules = compile(ast, {})

	# --- Generate JavaScript code from the rules
	js = generate(setOfRules, "grammar")

	if defined(filePath)
		jsPath = withExt(filePath, '.js')
	else
		jsPath = tempFile {extension: '.js'}
	if debug
		LOG "Writing JS to #{OL(jsPath)}"
	barf js, jsPath
	grammar = await import(pathToFileURL(jsPath))
	parserObj = new nearley.Parser(grammar.default)
	if streaming
		return parserObj
	return ((input) =>
		return parseInput parserObj, input, filePath, hOptions
		)

# ---------------------------------------------------------------------------

export isNearleyBuiltin = (path) =>

	assert isString(path), "not a string: #{OL(path)}"
	return (path.indexOf('/') == -1)

# ---------------------------------------------------------------------------
# --- Only creates the parser as JavaScript code
#     Returns { code, sourceMap, hOtherFiles, lUses }

export procNearley = (contents, hMetaData={}, filePath=undef, hOptions={}) =>

	nearleyParser = getParserObj()
	assert isString(contents), "contents not a string: #{OL(contents)}"
	assert nonEmpty(contents), "empty contents: #{OL(contents)}"

	# --- nearley's CoffeeScript processing doesn't play well
	#     with TAB characters, even though CoffeeScript allows them
	contents = untabify(contents)

	{type, include} = getOptions hMetaData, {
		type: undef     # --- undef, 'js' or 'coffee'
		include: undef  #     include file(s)
		}

	{debug} = getOptions hOptions, {
		debug: false
		}

	# --- set lUses to an array of included files
	if isString(include)
		lUses = [include]
	else if isArray(include)
		lUses = include
	else
		lUses = []

	lParts = []
	for path in lUses
		if isNearleyBuiltin(path)
			lParts.push "@builtin \"#{path}\""
		else
			lParts.push "@include \"#{path}\""

	if (type == 'coffee')
		lParts.push "@preprocessor coffee"
	lParts.push contents
	nearleyCode = lParts.join("\n")
	if debug
		barfDebugFile nearleyCode, filePath, 'patched'

	# --- Parse the grammar source into an AST
	#     NOTE: nearlyGrammar is imported
	nearleyParser.feed(nearleyCode)
	lResults = nearleyParser.results
	if (lResults.length == 0)
		croak "Bad grammar: #{OL(contents)}"
	else if (lResults.length > 1)
		croak "Ambiguous grammar: #{OL(contents)}"
	lAST = lResults[0]
	if debug
		text = JSON.stringify(lAST, null, 3)
		barfDebugFile text, filePath, 'ast'

	# --- Compile the AST into a set of rules
	grammarObj = compile(lAST, {})

	if (type == 'coffee') || defined(contents.match(/\@preprocessor\s+coffee/))
		try
			# --- Generate CoffeeScript code from the rules
			coffeeCode = generate(grammarObj, "grammar")
			if debug
				barfDebugFile coffeeCode, filePath, 'coffee'
			jsCode = procCoffee(coffeeCode).code
		catch err
			if defined(filePath)
				LOG "ERROR in #{OL(filePath)}: #{err.message}"
			else
				LOG "ERROR in string: #{err.message}"
	else
		# --- Generate JavaScript code from the rules
		jsCode = generate(grammarObj, "grammar")

	if debug
		barfDebugFile jsCode, filePath, 'unfixed'
	jsCode = fixNearlyJs(jsCode)
	if defined(filePath)
		jsFilePath = withExt(filePath, '.js')
	else
		jsFilePath = tempFile {extension: '.js'}
	barf jsCode, jsFilePath
#	checkJS jsFilePath
	return {
		code: jsCode
		lUses
		}

# ---------------------------------------------------------------------------

export procNearleyFile = (filePath, hOptions={}) =>

	assert (fileExt(filePath) == '.ne'), "Not a nearley file"
	assert isFile(filePath), "No such file: #{OL(filePath)}"
	{hMetaData, contents} = readTextFile(filePath, 'eager')
	return procNearley contents, hMetaData, filePath, hOptions
