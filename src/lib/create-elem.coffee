# create-elem.coffee

import {compile} from 'svelte/compiler'

import {
	undef, defined, notdefined, getOptions, assert,
	} from '@jdeighan/llutils'
import {
	readTextFile, barf, fileExt, withExt, isFile,
	} from '@jdeighan/llutils/fs'

# ---------------------------------------------------------------------------

export createElem = (contents, hOptions={}) =>

	return compile contents, hOptions

# ---------------------------------------------------------------------------

export createElemFile = (filePath, hOptions={}) =>

	hOptions = getOptions hOptions

	assert (fileExt(filePath) == '.svelte'), "Not a svelte file"
	{hMetaData, contents} = readTextFile filePath, 'eager'
	hMetaData.filename = hMetaData.filePath
	delete hMetaData.filePath
	Object.assign hMetaData, hOptions
	{js} = createElem(contents, hMetaData)
	barf js.code, withExt(filePath, '.js')
