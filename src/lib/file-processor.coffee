# file-processor.coffee

import {compile as compileCoffee} from 'coffeescript'
import {compile as compileSvelte} from 'svelte/compiler'

import {
	undef, defined, notdefined, getOptions, OL,
	isString, isFunction, isArray, isHash,
	assert, croak, keys,
	} from '@jdeighan/llutils'
import {splitLine, indented} from '@jdeighan/llutils/indent'
import {
	isProjRoot, isFile, barf, slurp,
	fileExt, withExt, mkpath,
	allFilesMatching, readTextFile, newerDestFileExists,
	} from '@jdeighan/llutils/fs'
import {LineFetcher} from '@jdeighan/llutils/fetcher'
import {replaceHereDocs} from '@jdeighan/llutils/heredoc'

# ---------------------------------------------------------------------------
# --- func must have the following signature:
#        params: (code, hMetaData)
#        return value:
#           either a string (e.g. code)
#           or a hash with keys:
#              code
#              sourceMap (optional)
#              hOtherFiles (optional)
#                 { <ext> => <contents>, ... }

export procFiles = (pattern, lFuncs, outExt, hOptions={}) =>

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

		{hMetaData, contents: code} = readTextFile(relPath, 'eager')
		assert defined(code), "procFiles(): undef code"
		if debug
			hMetaData.debug = true

		lSourceMaps = []
		for func in lFuncs
			result = func code, hMetaData
			if isString(result)
				code = result
				lSourceMaps = undef
				hOtherFiles = undef
			else
				assert isHash(result), "result not a string or hash: #{OL(result)}"
				{code, sourceMap, hOtherFiles} = result
				assert isString(code), "code not a string: #{OL(code)}"
				if defined(lSourceMaps) && defined(sourceMap)
					lSourceMaps.push sourceMap
				else
					lSourceMaps = undef
				if defined(hOtherFiles)
					for ext in keys(hOtherFiles)
						barf hOtherFiles[ext], withExt(relPath, ext)

		barf code, withExt(relPath, outExt)
		if defined(lSourceMaps) && (lSourceMaps.length == 1)
			barf lSourceMaps[0], withExt(relPath, "#{outExt}.map")
		numFilesProcessed += 1
	return numFilesProcessed

# ---------------------------------------------------------------------------

export brew = (code, hMetaData={}) ->

	# --- metadata can be used to add a shebang line
	#     if true, use "#!/usr/bin/env node"
	#     else use value of shebang key

	# --- filePath is used to check for a source map
	#     without it, no source map is produced

	assert defined(code), "code: #{OL(code)}"
	assert isString(code), "Not a string: #{OL(code)}"
	{filePath, debug, shebang,
		} = getOptions hMetaData, {
		filePath: undef
		debug: false
		shebang: undef
		}

	if defined(filePath)
		{js, v3SourceMap} = compileCoffee code, {
			sourceMap: true
			bare: true
			header: false
			filename: filePath
			}
	else
		js = compileCoffee code, {
			bare: true
			header: false
			}
		v3SourceMap = undef

	assert defined(js), "No JS code generated"

	if defined(shebang)
		if isString(shebang)
			js = shebang + "\n" + js.trim()
		else
			js = "#!/usr/bin/env node" + "\n" + js.trim()

	return {
		code: js
		sourceMap: v3SourceMap
		}

# ---------------------------------------------------------------------------

export cieloPreProcess = (code, hOptions) =>

	{debug} = getOptions hOptions, {
		debug: false
		}

	if debug
		console.log "IN cieloPreProcess()"
	lLines = []
	src = new LineFetcher(code)
	while src.moreLines()
		[level, str] = splitLine(src.fetch())
		if (level == 0) && (str == '__END__')
			break
		if debug
			console.log "GOT: #{OL(str)} at level #{level}"
		str = replaceHereDocs(level, str, src)
		lLines.push indented(str, level)
	return lLines.join("\n")

# ---------------------------------------------------------------------------

export sveltify = (code, hMetaData={}) =>

	hMetaData.filename = hMetaData.filePath
	delete hMetaData.filePath
	elem = hMetaData.customElement
	if isString(elem, 'nonempty')
		checkCustomElemName(elem)
		hMetaData.customElement = true
		str = "<svelte:options customElement=#{OL(elem)}/>"
		code = str + "\n" + code
	hResult = compileSvelte code, hMetaData
	hResult.code = hResult.js.code
	return hResult

# ---------------------------------------------------------------------------

export checkCustomElemName = (name) =>

	assert (name.length > 0), "empty name: #{OL(name)}"
	assert (name.indexOf('-') > 0), "Bad custom elem name: #{OL(name)}"
	return true

# ---------------------------------------------------------------------------
