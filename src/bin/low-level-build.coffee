# low-level-build.coffee
#
# --- Designed to run in ANY project that installs @jdeighan/llutils

import {
	assert, npmLogLevel, nonEmpty, add_s,
	} from '@jdeighan/llutils'
import {
	isProjRoot, fileExt, withExt,
	allFilesMatching, readTextFile, newerDestFilesExist,
	} from '@jdeighan/llutils/fs'
import {brewFile} from '@jdeighan/llutils/coffee'
import {peggifyFile} from '@jdeighan/llutils/peggy'

debugger
hFilesProcessed = {
	coffee: 0
	peggy: 0
	}

echo = (npmLogLevel() != 'silent')
doLog = (str) =>
	if echo
		console.log str
	return

doLog "-- low-level-build --"

# ---------------------------------------------------------------------------
# 1. Make sure we're in a project root directory

assert isProjRoot('.', 'strict'), "Not in package root dir"

if oneFilePath = process.argv[2]
	if (fileExt(oneFilePath) == '.coffee')
		doLog oneFilePath
		brewFile oneFilePath
		hFilesProcessed.coffee += 1
	else if (fileExt(oneFilePath) == '.peggy')
		doLog oneFilePath
		peggifyFile oneFilePath
		hFilesProcessed.peggy += 1
	process.exit()

# ---------------------------------------------------------------------------
# --- A file (either *.coffee or *.peggy) is out of date unless both:
#        - a *.js file exists that's newer than the original file
#        - a *.js.map file exists that's newer than the original file
# --- But ignore files inside node_modules

fileFilter = ({filePath}) =>
	if filePath.match(/node_modules/i)
		return false
	jsFile = withExt(filePath, '.js')
	mapFile = withExt(filePath, '.js.map')
	return ! newerDestFilesExist(filePath, jsFile, mapFile)

# ---------------------------------------------------------------------------
# 2. Search project for *.coffee files and compile them
#    unless newer *.js and *.js.map files exist

for {relPath} from allFilesMatching('**/*.coffee', {fileFilter})
	doLog relPath
	brewFile relPath
	hFilesProcessed.coffee += 1

# ---------------------------------------------------------------------------
# 3. Search src folder for *.peggy files and compile them
#    unless newer *.js and *.js.map files exist OR it needs rebuilding

for {relPath} from allFilesMatching('**/*.{pegjs,peggy}', {fileFilter})
	doLog relPath
	peggifyFile relPath
	hFilesProcessed.peggy += 1

# ---------------------------------------------------------------------------

hBin = {}    # --- keys to add in package.json / bin

# ---------------------------------------------------------------------------
# --- generate a 3 letter acronym if file stub is <str>-<str>-<str>

tla = (stub) =>

	if lMatches = stub.match(///^
			([a-z])(?:[a-z]*)
			\-
			([a-z])(?:[a-z]*)
			\-
			([a-z])(?:[a-z]*)
			$///)
		[_, a, b, c] = lMatches
		return a + b + c
	else
		return undef

# ---------------------------------------------------------------------------
# 4. For every *.coffee file in the 'src/bin' directory that
#       has key "shebang" set:
#       - save <stub>: <jsPath> in hBin
#       - if has a tla, save <tla>: <jsPath> in hBin

for {relPath, stub} from allFilesMatching('./src/bin/**/*.coffee')
	{hMetaData} = readTextFile relPath
	if hMetaData?.shebang
		jsPath = withExt(relPath, '.js')
		hBin[stub] = jsPath
		short_name = tla(stub)
		if defined(short_name)
			hBin[short_name] = jsPath

# ---------------------------------------------------------------------------
# 5. Add sub-keys to key 'bin' in package.json
#    (create if not exists)

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

nCoffee = hFilesProcessed.coffee
if (nCoffee > 0)
	doLog "(#{nCoffee} coffee file#{add_s(nCoffee)} compiled)"

nPeggy = hFilesProcessed.peggy
if (nPeggy > 0)
	doLog "(#{nPeggy} peggy file#{add_s(nPeggy)} compiled)"
