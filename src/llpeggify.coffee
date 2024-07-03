# llpeggify.coffee
#
# --- Part of build process, can't use getArgs()

import {globSync} from 'glob'
import {undef, defined, OL, execCmd} from '@jdeighan/llutils'
import {
	allFilesMatching, withExt, newerDestFilesExist,
	} from '@jdeighan/llutils/fs'
import {peggifyFile} from '@jdeighan/llutils/peggy'

# ---------------------------------------------------------------------------

debugger
fileName = process.argv[2]     # --- normally not specified

fileFilter = ({filePath}) =>
	if filePath.match(/node_modules/i)
		return false
	jsFile = withExt(filePath, '.js')
	mapFile = withExt(filePath, '.js.map')
	return ! newerDestFilesExist(filePath, jsFile, mapFile)

for {relPath} from allFilesMatching('**/*.{pegjs,peggy}', {fileFilter})
	if defined(fileName) && !relPath.endsWith(fileName)
		continue
	try
		console.log "llpeggify #{relPath}"
		peggifyFile relPath
	catch err
		console.log "in #{relPath}: #{err.message}"
