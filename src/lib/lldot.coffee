# lldot.coffee

import {
	undef, defined, OL, assert, croak,
	} from '@jdeighan/llutils'
import {execCmd} from '@jdeighan/llutils/exec-utils'
import {isFile, withExt, readTextFile} from '@jdeighan/llutils/fs'

# ---------------------------------------------------------------------------

export procDot = (code, hMetaData={}, filePath=undef) ->

	assert defined(filePath), "filePath must be defined"
	execCmd "dot -Tpng #{filePath} >#{withExt(filePath, '.png')}"
	return {
		created: true
		}

# ---------------------------------------------------------------------------

export procDotFile = (filePath) ->

	assert isFile(filePath), "No such file: #{OL(filePath)}"
	{hMetaData, contents} = readTextFile(filePath, 'eager')
	return procDot(contents, hMetaData, filePath)

