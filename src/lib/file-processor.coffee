# file-processor.coffee

import {compile as compileCoffee} from 'coffeescript'
import {compile as compileSvelte} from 'svelte/compiler'

import {
	undef, defined, notdefined, getOptions, OL, LOG,
	isString, isFunction, isArray, isHash,
	assert, croak, keys, hasKey, nonEmpty, gen2block,
	} from '@jdeighan/llutils'
import {execCmd} from '@jdeighan/llutils/exec-utils'
import {
	isProjRoot, isFile, allFiles, barf, slurp,
	fileExt, withExt, mkpath, relpath,
	allFilesMatching, readTextFile, newerDestFileExists,
	} from '@jdeighan/llutils/fs'
import {getConfig} from '@jdeighan/llutils/config'

hConfig = getConfig()

# ---------------------------------------------------------------------------

export removeOutFile = (filePath) =>

	ext = fileExt(filePath)
	{outExt} = hConfig[ext]
	if defined(outExt)
		execCmd "rm #{withExt(filePath, outExt)}"
	return

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
		{processed, lUses} = await procOneFile relPath, hOptions
		lProcessed.push relPath
		if nonEmpty(lUses)
			hUses[relPath] = lUses

	return {
		lProcessed
		hUses
		}

# ---------------------------------------------------------------------------
# --- strFunc must have the following signature:
#        params: (code, hMetaData, filePath)
#        return value:
#           either a string (e.g. code)
#           or a hash with keys:
#              code
#              sourceMap (optional)
#              lUses - an array, possibly empty
#     strFunc may be ASYNC!!!
# ---------------------------------------------------------------------------

export procOneFile = (filePath, hOptions={}) =>

	assert isFile(filePath), "No such file: #{OL(filePath)}"
	{strFunc, fileFunc, outExt} = hConfig[fileExt(filePath)]
	if notdefined(outExt)
		return {
			processed: false
			lUses: []
			}

	assert isString(outExt) && outExt.startsWith('.'),
			"Bad config: #{OL(hConfig)}"
	assert isFunction(strFunc) || isFunction(fileFunc),
		"neither strFunc or fileFunc is a function"

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

	if isFunction(fileFunc)
		hResult = await fileFunc filePath, hOptions
		assert isHash(hResult), "result not a hash (1): #{OL(hResult)}"
	else
		# --- get file contents, including meta data
		{hMetaData, contents} = readTextFile(filePath, 'eager')
		assert isString(contents), "contents not a string: #{OL(contents)}"
		assert nonEmpty(contents), "empty contents: #{OL(contents)}"
		hResult = await strFunc contents, hMetaData, relPath, hOptions
		assert isHash(hResult), "result not a hash (2): #{OL(hResult)}"
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
		lUses: lUses || {}
		}

# ---------------------------------------------------------------------------
