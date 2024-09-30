# llcoffee.coffee

import {compile} from 'coffeescript'

import {
	undef, defined, OL, isString, getOptions, removeKeys, words,
	assert, croak, isEmpty, nonEmpty, blockToArray,
	} from '@jdeighan/llutils'
import {
	isFile, readTextFile,
	} from '@jdeighan/llutils/fs'
import {NodeWalker} from '@jdeighan/llutils/node-walker'

# ---------------------------------------------------------------------------

export analyzeCoffee = (code, hMetaData) ->

	return {
		hMetaData
		contents: code
		lDependencies: getCoffeeDependencies(code)
		}

# ---------------------------------------------------------------------------

export analyzeCoffeeFile = (filePath) ->

	# --- get file contents, including meta data
	{hMetaData, contents} = readTextFile(filePath, 'eager')
	return analyzeCoffee(contents, hMetaData)

# ---------------------------------------------------------------------------

export getCoffeeDependencies = (code) =>

	lDependencies = []

	class ImportWalker extends NodeWalker
		visit: (hNode) ->
			super hNode
			if (hNode.type == 'ImportDeclaration')
				source = hNode.source.value
				lDependencies.push source

	walker = new ImportWalker()
	walker.walk(toAST(code))

	return lDependencies

# ---------------------------------------------------------------------------

export procCoffee = (contents, hMetaData={}, filePath=undef, hOptions={}) ->

	# --- meta data can be used to add a shebang line
	#     if true, use "#!/usr/bin/env node"
	#     else use value of shebang key

	# --- filePath is used to check for a source map
	#     without it, no source map is produced

	assert isString(contents), "Not a string: #{OL(contents)}"
	assert nonEmpty(contents), "Empty contents: #{OL(contents)}"
	{debug} = getOptions hOptions, {
		debug: false
		}
	{shebang} = getOptions hMetaData, {
		shebang: undef
		}

	if defined(filePath)
		{js: code, v3SourceMap} = compile contents, {
			sourceMap: true
			bare: true
			header: false
			filename: filePath
			}
	else
		code = compile contents, {
			bare: true
			header: false
			}
		v3SourceMap = undef

	assert defined(code), "No JS generated"
	code = code.trim()

	if defined(shebang)
		if isString(shebang)
			code = "#{shebang}\n#{code}"
		else
			code = "#!/usr/bin/env node\n#{code}"

	return {
		code
		sourceMap: v3SourceMap
		}

# ---------------------------------------------------------------------------

export procCoffeeFile = (filePath, hOptions={}) ->

	assert isFile(filePath), "No such file: #{OL(filePath)}"
	{hMetaData, contents} = readTextFile(filePath, 'eager')
	return procCoffee(contents, hMetaData, filePath, hOptions)

# ---------------------------------------------------------------------------

export toAST = (code, hOptions={}) =>

	{minimal} = getOptions hOptions, {
		minimal: false
		}

	hAST = compile(code, {ast: true})
	if minimal
		removeExtraASTKeys hAST
	return hAST

# ---------------------------------------------------------------------------

export toASTFile = (code, filePath, hOptions={}) ->

	hAST = toAST(code, hOptions)
	barf JSON.stringify(hAST, null, "\t"), filePath
	return

# ---------------------------------------------------------------------------

export removeExtraASTKeys = (hAST) =>

	removeKeys hAST, words(
		'loc range extra start end',
		'directives comments tokens',
		)
	return hAST

# ---------------------------------------------------------------------------
