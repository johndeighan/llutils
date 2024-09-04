# low-level-build.coffee
#
# --- Designed to run in ANY project that installs @jdeighan/llutils

import chokidar from 'chokidar'

import {
	undef, defined, notdefined, assert, hasKey, keys,
	isEmpty, nonEmpty, add_s, OL, gen2block, tla,
	} from '@jdeighan/llutils'
import {execCmd} from '@jdeighan/llutils/exec-utils'
import {getArgs} from '@jdeighan/llutils/cmd-args'
import {
	isProjRoot, barfJSON, barfPkgJSON, isFile, barf,
	slurpJSON, slurpPkgJSON, fileExt, withExt, mkpath,
	allFilesMatching, readTextFile, newerDestFileExists,
	} from '@jdeighan/llutils/fs'
import {peggify} from '@jdeighan/llutils/peggy'
import {
	procFiles, brew, cieloPreProcess, sveltify,
	} from '@jdeighan/llutils/file-processor'
import {hLLBConfig} from '@jdeighan/llutils/llb-config'

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

if notdefined(root)
	root = '.'
if (quiet == true)
	echo = false

# ---------------------------------------------------------------------------
# Process all files

debugger
hNumProcessed = {}    # --- <ext> -> <n>
lExtKeys = keys(hLLBConfig).filter((key) => key.startsWith('.'))
for ext in lExtKeys
	{lFuncs, outExt} = hLLBConfig[ext]
	n = 0

	# --- possible options: force, debug, logOnly, echo
	hNumProcessed[ext] = procFiles "#{root}/**/*#{ext}", lFuncs, outExt, {
		echo
		force
		debug
		logOnly: debug
		}

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

# --- log number of files processed

for ext in keys(hNumProcessed)
	n = hNumProcessed[ext]
	if defined(n) && (n > 0)
		console.log "#{n} *#{ext} file#{add_s(n)} compiled"

# --- watch for file changes

if watch
	console.log "watching for file changes..."
	glob = "**/*.{coffee,peggy,cielo,svelte}"
	hOptions = {
		persistent: true
		ignoreInitial: true
		awaitWriteFinish: {
			stabilityThreshold: 1000,
			pollInterval: 100
			}
		}
	chokidar.watch(glob, hOptions).on 'all', (eventType, path) =>
		if path.match(/node_modules/)
			return
		path = mkpath(path)
		ext = fileExt(path)
		{lFuncs, outExt} = hLLBConfig[ext]
		switch eventType
			when 'add','change'
				procFiles path, lFuncs, outExt
			when 'unlink'
				execCmd "rm #{withExt(path, outExt)}"
