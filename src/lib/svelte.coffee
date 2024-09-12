# svelte.coffee

import {compile as compileSvelte} from 'svelte/compiler'

import {
	undef, defined, notdefined, OL,
	isString, isFunction, isArray, isHash,
	assert, croak, keys, hasKey, nonEmpty, gen2block,
	} from '@jdeighan/llutils'

# ---------------------------------------------------------------------------

export procSvelte = (code, hMetaData={}, filePath=undef) =>

	hMetaData.filename = filePath
	elem = hMetaData.customElement
	if isString(elem, 'nonempty')
		checkCustomElemName(elem)
		hMetaData.customElement = true
		str = "<svelte:options customElement=#{OL(elem)}/>"
		code = str + "\n" + code
	hResult = compileSvelte code, hMetaData
	return {
		code: hResult.js.code
		sourceMap: undef
		lUses: []
		hOtherFiles: {}
		}

# ---------------------------------------------------------------------------

export checkCustomElemName = (name) =>

	assert (name.length > 0), "empty name: #{OL(name)}"
	assert (name.indexOf('-') > 0), "Bad custom elem name: #{OL(name)}"
	return true

# ---------------------------------------------------------------------------

