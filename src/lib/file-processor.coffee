# file-processor.coffee

import {
	undef, defined, notdefined, getOptions, OL,
	isString, isFunction, isArray, isHash,
	assert,
	} from '@jdeighan/llutils'
import {
	isProjRoot, isFile, barf, slurp,
	fileExt, withExt, mkpath,
	allFilesMatching, readTextFile, newerDestFileExists,
	} from '@jdeighan/llutils/fs'

# ---------------------------------------------------------------------------
# --- func must have the following signature:
#        params: (code, hMetaData)
#        return value:
#           either a string (e.g. code)
#           or a hash with keys:
#              code
#              sourceMap (optional)

export procFiles = (pattern, outExt, lFuncs, hOptions={}) =>

	# --- A file is out of date unless a file exists
	#        with outExt extension
	#        that's newer than the original file
	# --- But ignore files inside node_modules

	if isArray(lFuncs)
		for f in lFuncs
			assert isFunction(f), "not a function: #{OL(f)}"
	else
		assert isFunction(lFuncs), "not a function: #{OL(lFuncs)}"
		lFuncs = [lFuncs]

	assert outExt.startsWith('.'), "Bad out ext: #{OL(outExt)}"

	{force, debug, logOnly, echo} = getOptions hOptions, {
		force: false
		debug: false
		logOnly: false
		echo: true
		}

	fileFilter = ({filePath}) =>
		if filePath.match(/\bnode_modules\b/i)
			return false
		if force
			return true
		destFile = withExt(filePath, outExt)
		return ! newerDestFileExists(filePath, destFile)

	numFilesProcessed = 0
	for {relPath} from allFilesMatching(pattern, {fileFilter})
		if echo || logOnly
			console.log relPath
		if logOnly
			continue

		{hMetaData, contents} = readTextFile(relPath, 'eager')
		assert defined(contents), "procFiles(): undef contents"
		if debug
			hMetaData.debug = true

		lSourceMaps = []
		for func in lFuncs
			result = func contents, hMetaData
			if isString(result)
				contents = result
				lSourceMaps = undef
			else
				assert isHash(result), "result not a string or hash: #{OL(result)}"
				{code, sourceMap} = result
				assert isString(code), "code not a string: #{OL(code)}"
				contents = code
				if defined(lSourceMaps) && defined(sourceMap)
					lSourceMaps.push sourceMap
				else
					lSourceMaps = undef

		barf contents, withExt(relPath, outExt)
		if defined(lSourceMaps) && (lSourceMaps.length == 1)
			barf lSourceMaps[0], withExt(relPath, "#{outExt}.map")
		numFilesProcessed += 1
	return numFilesProcessed
