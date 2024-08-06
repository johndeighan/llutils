# svelte-utils.coffee

import {compile} from 'svelte/compiler'

import {
	undef, defined, notdefined, getOptions, assert,
	nonEmpty, OL, isString,
	} from '@jdeighan/llutils'
import {
	readTextFile, barf, fileExt, withExt, isFile,
	} from '@jdeighan/llutils/fs'

# ---------------------------------------------------------------------------

export sveltify = (code, hMetaData={}) =>

	hMetaData.filename = hMetaData.filePath
	delete hMetaData.filePath
	elem = hMetaData.customElement
	if isString(elem, 'nonempty')
		checkCustomElemName(elem)
		hMetaData.customElement = true
		str = "<svelte:options customElement=#{OL(elem)}/>"
		code = str + "\n" + code
	hResult = compile code, hMetaData
#	console.dir hResult
	hResult.code = hResult.js.code
	return hResult

# ---------------------------------------------------------------------------

checkCustomElemName = (name) =>

	assert (name.length > 0), "empty name: #{OL(name)}"
	assert (name.indexOf('-') > 0), "Bad custom elem name: #{OL(name)}"
	return true
