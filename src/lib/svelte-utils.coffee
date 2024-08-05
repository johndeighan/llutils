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

	elem = hMetaData.customElement
	if isString(elem, 'nonempty')
		checkCustomElemName(elem)
		hMetaData.customElement = true
		str = "<svelte:options customElement=#{OL(elem)}/>"
		code = str + "\n" + code
	return compile code, hMetaData

# ---------------------------------------------------------------------------

export sveltifyFile = (filePath, hOptions={}) =>

	hOptions = getOptions hOptions

	assert (fileExt(filePath) == '.svelte'), "Not a svelte file"
	{hMetaData, contents} = readTextFile filePath, 'eager'
	hMetaData.filename = hMetaData.filePath
	delete hMetaData.filePath
	Object.assign hMetaData, hOptions
	{js} = sveltify contents, hMetaData
	barf js.code, withExt(filePath, '.js')

# ---------------------------------------------------------------------------

checkCustomElemName = (name) =>

	assert (name.length > 0), "empty name: #{OL(name)}"
	assert (name.indexOf('-') > 0), "Bad custom elem name: #{OL(name)}"
	return true