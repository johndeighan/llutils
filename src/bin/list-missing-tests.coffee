# list-missing-tests.coffee

import {
	undef, defined, notdefined,
	assert,
	} from '@jdeighan/llutils'
import {
	isProjRoot, mkpath, isFile, slurp, barf, allFilesMatching,
	} from '@jdeighan/llutils/fs'

# ---------------------------------------------------------------------------
# 1. Make sure we're in a project root directory

assert isProjRoot('.', 'strict'), "Not in package root dir"

for {stub} from allFilesMatching('./src/lib/**/*.{coffee,peggy}')
	filePath = "./test/#{stub}.test.coffee"
	if !isFile(filePath)
		console.log "LIB: #{filePath}"

for {stub} from allFilesMatching('./src/bin/**/*.coffee')
	filePath = "./test/#{stub}.test.coffee"
	if !isFile(filePath)
		console.log "BIN: #{filePath}"
