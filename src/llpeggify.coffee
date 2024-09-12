# llpeggify.coffee
#
# --- Part of build process, can't use getArgs()
#     Processes all *.peggy files where there
#        isn't a corresponding more recent *.js file

import {
	withExt, allFilesMatching, newerDestFileExists,
	} from '@jdeighan/llutils/fs'
import {procOneFile} from '@jdeighan/llutils/file-processor'

# ---------------------------------------------------------------------------

fileFilter = ({filePath}) =>

	destFile = withExt(filePath, '.js')
	return ! newerDestFileExists(filePath, destFile)

for {relPath} from allFilesMatching("**/*.peggy", {fileFilter})
	procOneFile relPath
