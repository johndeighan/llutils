# coffee.coffee

import fs from 'fs'
import {compile} from 'coffeescript'

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
import {brew} from '@jdeighan/llutils/file-processor'

export {brew}

# ---------------------------------------------------------------------------

export toAST = (coffeeCode, hOptions={}) =>

	{minimal} = getOptions hOptions, {
		minimal: false
		}

	hAST = compile(coffeeCode, {ast: true})
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
