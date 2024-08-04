# llpeggify.coffee
#
# --- Part of build process, can't use getArgs()

import {globSync} from 'glob'
import {undef, defined, OL, execCmd} from '@jdeighan/llutils'
import {
	allFilesMatching, withExt, newerDestFileExists,
	} from '@jdeighan/llutils/fs'
import {peggifyFile} from '@jdeighan/llutils/peggy'

# ---------------------------------------------------------------------------

fileName = process.argv[2]     # --- normally not specified

fileFilter = ({filePath}) =>
	if filePath.match(/node_modules/i)
		return false
	jsFile = withExt(filePath, '.js')
	return ! newerDestFileExists(filePath, jsFile)

for {relPath} from allFilesMatching('**/*.peggy', {fileFilter})
	if defined(fileName) && !relPath.endsWith(fileName)
		continue
	try
		console.log "llpeggify #{relPath}"
		peggifyFile relPath
	catch err
		console.log "in #{relPath}: #{err.message}"
