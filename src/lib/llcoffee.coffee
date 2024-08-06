# llcoffee.coffee

import {compile} from 'coffeescript'

import {
	undef, defined, notdefined, assert, croak,
	OL, getOptions, isString, isFunction, gen2block,
	} from '@jdeighan/llutils'
import {DUMP} from '@jdeighan/llutils/dump'
import {
	isFile, readTextFile, barf, withExt,
	} from '@jdeighan/llutils/fs'

# ---------------------------------------------------------------------------

export brew = (code, hMetaData={}) ->

	# --- metadata can be used to add a shebang line
	#     if true, use "#!/usr/bin/env node"
	#     else use value of shebang key

	# --- filePath is used to check for a source map
	#     without it, no source map is produced
	# --- if key preprocess is set, it must be a function
	#     that converts one block of code to another
	#     block of code

	assert defined(code), "code: #{OL(code)}"
	assert isString(code), "Not a string: #{OL(code)}"
	{filePath, preprocess, debug,
		} = getOptions hMetaData, {
		filePath: undef
		preprocess: undef
		debug: false
		}

	if defined(preprocess)
		assert isFunction(preprocess),
				"Not a function: #{OL(preprocess)}"
		if debug
			console.log "pre-processing code"
		preprocCode = preprocess(code, {debug})
		if debug
			DUMP preprocCode, 'PreProcessed code'

	if defined(filePath)
		{js, v3SourceMap} = compile (preprocCode || code), {
			sourceMap: true
			bare: true
			header: false
			filename: filePath
			}
	else
		js = compile (preprocCode || code), {
			bare: true
			header: false
			}
		v3SourceMap = undef

	assert defined(js), "No JS code generated"

	shebang = getShebang(hMetaData)
	if defined(shebang)
		js = shebang + "\n" + js.trim()
	else
		js = js.trim()
	return {
		orgCode: code
		preprocCode
		js
		code: js
		sourceMap: v3SourceMap
		}

# ---------------------------------------------------------------------------

export getShebang = (hMetaData) =>

	shebang = hMetaData.shebang
	if defined(shebang)
		if isString(shebang)
			return shebang
		else if shebang
			return "#!/usr/bin/env node"
	return undef
