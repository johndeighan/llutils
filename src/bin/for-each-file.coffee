# for-each-file.coffee

# --- Using option -debug prevents any execution
#        In that case, option -cmd is not required
#        but if provided, allows output of command
#        that would be executed

import {
	undef, defined, notdefined, OL, stripCR,
	isString, sortArrayOfHashes, assert, croak, LOG,
	} from '@jdeighan/llutils'
import {execCmdAsync} from '@jdeighan/llutils/exec-utils'
import {DUMP} from '@jdeighan/llutils/dump'
import {getArgs} from '@jdeighan/llutils/cmd-args'
import {
	isFile, mkpath, allFilesMatching, relpath,
	} from '@jdeighan/llutils/fs'

# ---------------------------------------------------------------------------
# --- Usage:
#    for-each-file <glob>... -cmd="coffee -cmb --no-header <file>"

hCmdArgs = getArgs {
	_: {
		min: 1   # --- file paths or globs
		}
	cmd: {
		type: 'string'   # --- '<file>' will be replaced with file path
		}
	d: {type: 'boolean'}
	}

{_: lGlobs, cmd: cmdStr, d: debug} = hCmdArgs

if defined(cmdStr)
	assert (cmdStr.indexOf('<file>') != -1),
			"missing '<file>' in cmd string #{OL(cmdStr)}"

# --- An array of {filePath, cmd, output, err}
lFileRecs = []
sep = '-'.repeat(40)

# ---------------------------------------------------------------------------

handleFile = (filePath) =>

	assert isFile(filePath), "Not a file: #{OL(filePath)}"

	hRec = {
		filePath
		}
	if defined(cmdStr)
		hRec.cmd = cmdStr.replaceAll('<file>', filePath)
		if ! debug
			try
				# --- execCmdAsync() returns a promise
				hRec.promise = execCmdAsync(hRec.cmd)

			catch err
				LOG "ERROR: #{err.message}"
				hRec.err = err
	lFileRecs.push hRec
	return

# ---------------------------------------------------------------------------

handleGlob = (glob) =>

	for hFile from allFilesMatching(glob)
		handleFile(hFile.filePath)
	return

# ---------------------------------------------------------------------------

genOutput = () =>

	# --- Sort alphabetically by filePath
	for hRec in sortArrayOfHashes(lFileRecs, 'filePath')
		{cmd, filePath, promise, err} = hRec
		relPath = relpath(filePath)
		if debug
			if defined(cmd)
				LOG "CMD: #{OL(cmd)}"
			else
				LOG "FILE: #{OL(filePath)}"
		else
			if err
				LOG err.message
			else
				try
					{stdout, stderr} = await promise
					if defined(stdout)
						assert isString(stdout), "not a string: #{OL(stdout)}"
						DUMP stdout, "#{relPath}"
					if defined(stderr)
						assert isString(stderr), "not a string: #{OL(stderr)}"
						if (stderr.length > 0)
							DUMP stderr, "STDERR #{relPath}"
				catch err
					LOG err.message
	return

# ---------------------------------------------------------------------------
# --- Usage:
#    for-each-file <glob>... -cmd="coffee -cm <file>"

if debug
	LOG "DEBUGGING ON in for-each-file"
	DUMP hCmdArgs, 'hCmdArgs'

assert defined(debug) || defined(cmdStr),
		"-cmd option required unless debugging or listing"

# --- Cycle through all globs/file paths
#     NOTE: any item that contains '*' or '?' is a glob

for str in lGlobs
	if str.includes('*') || str.includes('?')
		handleGlob(str)
	else
		handleFile(mkpath(str))

genOutput()
