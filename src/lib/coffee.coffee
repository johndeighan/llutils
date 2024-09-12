# coffee.coffee

import fs from 'fs'
import {compile as compileCoffee} from 'coffeescript'

import {
	pass, undef, defined, notdefined, gen2block, words,
	assert, croak, OL, dclone, getOptions, listdiff,
	isString, isArray, isHash, isFunction, keys, removeKeys,
	nonEmpty, cleanHash,
	} from '@jdeighan/llutils'
import {DUMP} from '@jdeighan/llutils/dump'
import {indented, splitLine} from '@jdeighan/llutils/indent'
import {
	barf, withExt, isFile,
	} from '@jdeighan/llutils/fs'
import {LineFetcher} from '@jdeighan/llutils/fetcher'
import {
	ASTWalker, removeExtraASTKeys,
	} from '@jdeighan/llutils/ast-walker'
import {replaceHereDocs} from '@jdeighan/llutils/heredoc'

# ---------------------------------------------------------------------------

export procCoffee = (code, hMetaData={}, filePath=undef) ->

	# --- metadata can be used to add a shebang line
	#     if true, use "#!/usr/bin/env node"
	#     else use value of shebang key

	# --- filePath is used to check for a source map
	#     without it, no source map is produced

	assert defined(code), "code: #{OL(code)}"
	assert isString(code), "Not a string: #{OL(code)}"
	{debug, shebang} = getOptions hMetaData, {
		debug: false
		shebang: undef
		}

	if defined(filePath)
		{js, v3SourceMap} = compileCoffee code, {
			sourceMap: true
			bare: true
			header: false
			filename: filePath
			}
	else
		js = compileCoffee code, {
			bare: true
			header: false
			}
		v3SourceMap = undef

	assert defined(js), "No JS code generated"

	if defined(shebang)
		if isString(shebang)
			js = shebang + "\n" + js.trim()
		else
			js = "#!/usr/bin/env node" + "\n" + js.trim()

	return {
		code: js
		sourceMap: v3SourceMap
		}

# ---------------------------------------------------------------------------

export toAST = (coffeeCode, hOptions={}) =>

	{minimal} = getOptions hOptions, {
		minimal: false
		}

	hAST = compileCoffee(coffeeCode, {ast: true})
	if minimal
		removeExtraASTKeys hAST
	return hAST

# ---------------------------------------------------------------------------

export toASTFile = (code, filePath, hOptions={}) ->

	hAST = toAST(code, hOptions)
	barfAST hAST, filePath
	return

# ---------------------------------------------------------------------------
# --- Valid options:
#        debug - extensive debugging
#        hDumpNode - { <nodeType>: true, ... }

export coffeeInfo = (hAST, hOptions={}) =>

	if isString(hAST)
		hAST = toAST(hAST)
	walker = new ASTWalker()
	walker.walk(hAST, hOptions)

	return {
		hAST
		hImports: walker.getSymbols('detailed-imports')
		lExports: walker.getSymbols('exports')
		lMissing: walker.getSymbols('missing')
		lUnused:  walker.getSymbols('unused')
		lTopLevel: walker.getSymbols('toplevel')
		}

# ---------------------------------------------------------------------------

export basicInfo = (hAST, hOptions={}) =>

	if isString(hAST)
		hAST = toAST(hAST)
	walker = new ASTWalker()
	walker.walk(hAST, hOptions)
	lTopLevelSymbols = walker.getTopLevelSymbols()

	hInfo = {
		hImports:  walker.getSymbols('detailed-imports')
		lExports:  walker.getSymbols('exports')
		lMissing:  walker.getSymbols('missing')
		lUnused:   walker.getSymbols('unused')
		lTopLevel: walker.getSymbols('toplevel')
		}
	return cleanHash(hInfo)
