# llpeggify.coffee
#
# --- Part of build process, can't use getArgs()

import {globSync} from 'glob'
import {execCmd} from '@jdeighan/llutils'
import {peggifyFile} from '@jdeighan/llutils/peggy'

# ---------------------------------------------------------------------------

# --- Returns array of relative file paths
lPeggyFiles = globSync('**/*.{pegjs,peggy}', {
	ignore: 'node_modules/**'
	})

for filePath in lPeggyFiles
	try
		peggifyFile filePath
	catch err
		console.log "in #{filePath}: #{err.message}"
