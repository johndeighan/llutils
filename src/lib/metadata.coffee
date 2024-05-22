# metadata.coffee

import YAML from 'yaml'

import {
	undef, defined, notdefined, isString, untabify, assert,
	} from '@jdeighan/llutils'

hMetaDataTypes = {
	'---': (block) =>
		hOptions = {
			skipInvalid: true
			}
		return YAML.parse(untabify(block, 2), hOptions)
	}

# ---------------------------------------------------------------------------

export addMetaDataType = (start, converter) =>

	assert isString(start), "Not a string: #{typeof start}"
	assert (start.length == 3), "Bad 'start' key: #{start}"
	assert (start[1] == start[0]) && (start[2] == start[0]),
		"Bad 'start' key: #{start}"

	assert (typeof converter == 'function'), "Non-function converter"
	hMetaDataTypes[start] = converter
	return

# ---------------------------------------------------------------------------

export isMetaDataStart = (str) =>

	return defined(hMetaDataTypes[str])

# ---------------------------------------------------------------------------
# --- block does NOT contain the metadata start line

export convertMetaData = (firstLine, block) =>

	assert isMetaDataStart(firstLine), "Bad metadata"
	converter = hMetaDataTypes[firstLine]
	return converter(block)
