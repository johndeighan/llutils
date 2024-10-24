# low-level-build.coffee
#
# --- Designed to run in ANY project that installs @jdeighan/llutils

import chokidar from 'chokidar'    # --- for file watching

import {
	undef, defined, notdefined, assert, hasKey, keys,
	isEmpty, nonEmpty, add_s, OL, gen2block, tla,
	} from '@jdeighan/llutils'
import {getArgs} from '@jdeighan/llutils/cmd-args'
import {
	isProjRoot, barf, barfPkgJSON, slurpPkgJSON, mkpath,
	fileExt, withExt, allFilesMatching, readTextFile,
	} from '@jdeighan/llutils/fs'
import {
	procFiles, procOneFile, removeOutFile,
	} from '@jdeighan/llutils/file-processor'

echo = true
doLog = (str) =>
	if echo
		console.log str
	return

shebang = "#!/usr/bin/env node"

# ---------------------------------------------------------------------------
# Usage:   node src/bin/low-level-build.js

# ---------------------------------------------------------------------------
# 1. Make sure we're in a project root directory

debugger
assert isProjRoot('.', 'strict'), "Not in package root dir"

{
	_: lNonOptions
	q: quiet
	f: force
	d: debug
	w: watch
	root
	} = getArgs {
	_: {
		min: 0
		max: 1
		}
	q: {type: 'boolean'}
	f: {type: 'boolean'}
	d: {type: 'boolean'}
	w: {type: 'boolean'}
	root: {type: 'string'}
	}

if defined(root)
	if root.endsWith('/')
		root = root.substring(0, root.length-1)
else
	root = '.'
if quiet
	echo = false

# ---------------------------------------------------------------------------
# Process all files

pattern = "#{root}/{*.*,**/*.*}"
{lProcessed, hUses} = await procFiles(pattern, {force, debug})

for filePath in keys(hUses)
	for usedFile in hUses[filePath]
		if lProcessed.includes usedFile
			if ! lProcessed.includes filePath
				console.log "ALSO PROCESS: #{OL(filePath)}"
				procOneFile filePath
				lProcessed.push filePath

# --- log number of files processed
hFiles = {}
for file in lProcessed
	ext = fileExt file
	if hasKey(hFiles, ext)
		hFiles[ext].push file
	else
		hFiles[ext] = [file]

for ext in keys(hFiles).sort()
	n = hFiles[ext].length
	console.log "#{n} *#{ext} file#{add_s(n)} compiled"

# ---------------------------------------------------------------------------

hBin = {}    # --- keys to add in package.json / bin

# ---------------------------------------------------------------------------
# 4. For every *.js file in the 'src/bin' directory
#       - add a shebang line if not present
#       - save <stub>: <jsPath> in hBin
#       - if has a tla, save <tla>: <jsPath> in hBin

for {relPath, stub} from allFilesMatching('./src/bin/**/*.js')
	{reader} = readTextFile relPath
	firstLine = reader().next().value
	if !firstLine.match(/^\#\!/)
		contents = shebang + "\n" + gen2block(reader)
		barf contents, relPath
	hBin[stub] = relPath
	if defined(short_name = tla(stub))
		hBin[short_name] = relPath

if nonEmpty(hBin)
	hJson = slurpPkgJSON()
	if ! hasKey(hJson, 'bin')
		doLog "   - add key 'bin'"
		hJson.bin = {}
	for key,value of hBin
		if (hJson.bin[key] != value)
			doLog "   - add bin/#{key} = #{value}"
			hJson.bin[key] = value
	barfPkgJSON hJson

# --- watch for file changes

if watch
	console.log "watching for file changes..."
	glob = "**/*.{coffee,peggy,svelte}"
	hOptions = {
		persistent: true
		ignoreInitial: true
		awaitWriteFinish: {
			stabilityThreshold: 1000,
			pollInterval: 100
			}
		}
	chokidar.watch(glob, hOptions).on 'all', (eventType, path) =>
		if filePath.match(/\bnode_modules\b/)
			return
		filePath = mkpath(path)
		switch eventType
			when 'add','change'
				procOneFile filePath
			when 'unlink'
				removeOutFile filePath
