# file-processor.coffee

import {compile as compileCoffee} from 'coffeescript'
import {compile as compileSvelte} from 'svelte/compiler'

import {
	undef, defined, notdefined, getOptions, OL, LOG,
	isString, isFunction, isArray, isHash,
	assert, croak, keys, hasKey, nonEmpty, gen2block,
	} from '@jdeighan/llutils'
import {splitLine, indented} from '@jdeighan/llutils/indent'
import {
	isProjRoot, isFile, allFiles, barf, slurp,
	fileExt, withExt, mkpath, relpath,
	allFilesMatching, readTextFile, newerDestFileExists,
	} from '@jdeighan/llutils/fs'
import {LineFetcher} from '@jdeighan/llutils/fetcher'
import {replaceHereDocs} from '@jdeighan/llutils/heredoc'
import {hConfig} from '@jdeighan/llutils/config'

# ---------------------------------------------------------------------------
# --- processes all files with file ext in hConfig
#     unprocessed, but matching files are
#        checked for files they use

export procFiles = (pattern="./{*.*,**/*.*}", hOptions={}) =>

	{debug, force} = getOptions hOptions, {
		debug: false
		force: false
		}
	if hConfig.force
		force = true

	# --- accumulate over all files
	lProcessed = []
	hUses = {}        # --- { <file>: [<used file>, ...], ...}

	# --- set in filter (filter needs meta data, so save results)
	hMetaData = undef   # --- set for all matching files
	contents = undef    #     set only for files that are processed

	# --- fileFilter is called for every matching file, changed or not
	#     we need to check meta data for every matching file
	#     so, we update lProcessed and hUses here

	fileFilter = ({filePath}) =>

		ext = fileExt filePath

		# --- If we're not processing file, simply return false
		if !hasKey(hConfig, ext)
			return false
		if force
			return true
		outExt = hConfig[ext].outExt
		destFile = withExt(filePath, outExt)
		return ! newerDestFileExists(filePath, destFile)

	for {relPath} from allFilesMatching(pattern, {fileFilter})
		{processed, lUses} = procOneFile relPath, hOptions
		lProcessed.push relPath
		if nonEmpty(lUses)
			hUses[relPath] = lUses

	return {
		lProcessed
		hUses
		}

# ---------------------------------------------------------------------------
# --- func must have the following signature:
#        params: (code, hMetaData, filePath)
#        return value:
#           either a string (e.g. code)
#           or a hash with keys:
#              code
#              sourceMap (optional)
#              lUses - an array, possibly empty
# ---------------------------------------------------------------------------

export procOneFile = (filePath, hOptions={}) =>

	ext = fileExt filePath
	[func, outExt] = extractConfig(hConfig, ext)
	if !defined(func, outExt)
		return {
			processed: false
			lUses: []
			}

	assert isFunction(func), "Bad config: #{OL(hConfig)}"
	assert isString(outExt) && outExt.startsWith('.'),
			"Bad config: #{OL(hConfig)}"

	{debug, logOnly, echo} = getOptions hOptions, {
		debug: false
		logOnly: false
		echo: true
		}

	relPath = relpath filePath
	if echo || logOnly
		LOG relPath
	if logOnly
		return {
			processed: false
			lUses: []
			}

	# --- get file contents, including meta data
	{hMetaData, contents} = readTextFile(filePath, 'eager')
	assert isString(contents), "contents not a string: #{OL(contents)}"
	assert nonEmpty(contents), "empty contents: #{OL(contents)}"

	lUses = []
	sourceMap = undef

	hResult = func contents, hMetaData, relPath, hOptions
	assert isHash(hResult), "result not a hash: #{OL(hResult)}"
	{code, sourceMap, hOtherFiles, lUses} = hResult

	# --- Write out main output file
	assert isString(code), "code not a string: #{OL(code)}"
	assert nonEmpty(code), "empty code: #{OL(code)}"
	barf code, withExt(relPath, outExt)

	# --- Write out final source map
	if defined(sourceMap)
		barf sourceMap, withExt(relPath, "#{outExt}.map")

	# --- Write out other files
	if defined(hOtherFiles)
		for ext in keys(hOtherFiles)
			barf hOtherFiles[ext], withExt(relPath, ext)

	return {
		processed: true
		lUses
		}

# ---------------------------------------------------------------------------

export extractConfig = (hConfig, ext) ->

	h = hConfig[ext]
	if defined(h) && isHash(h)
		return [h.func, h.outExt]
	else
		return [undef, undef]

# ---------------------------------------------------------------------------
