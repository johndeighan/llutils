# map-source-line.coffee

import {undef, OL} from '@jdeighan/llutils'
import {mapLineNum} from '@jdeighan/llutils/source-map'
import {getArgs} from '@jdeighan/llutils/cmd-args'

hArgs = getArgs {
	_: {
		exactly: 2
		}
	}
[filePath, lineNum] = hArgs._
console.log "filePath = #{OL(filePath)}"
console.log "lineNum = #{OL(lineNum)}"
