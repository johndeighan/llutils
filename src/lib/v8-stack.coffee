# v8-stack.coffee

import pathLib from 'node:path'
import fs from 'fs'

import {
	undef, defined, notdefined, isEmpty, nonEmpty,
	assert, croak, isInteger, hasKey, OL, getOptions,
	} from '@jdeighan/llutils'
import {
	mkpath, fileExt, withExt,
	} from '@jdeighan/llutils/fs'
import {mapSourcePos} from '@jdeighan/llutils/source-map'
import {toNICE} from '@jdeighan/llutils/to-nice'

export internalDebugging = false

# ---------------------------------------------------------------------------
# Stack Frames have the keys:
#    type - eval | native | constructor | method | function | script
#    filePath
#    fileName
#    ext
#    functionName
#    objTye, methodName - if type == 'method'
#    isAsync - true if an async function/method
#    line
#    column

# ---------------------------------------------------------------------------

export nodeStr = (hNode) =>

	{type, fileName, line, column} = hNode
	return "#{type} at #{fileName}:#{line}:#{column}"

# ---------------------------------------------------------------------------
# --- export only for unit tests

export extractFileName = (filePath) =>

	if lMatches = filePath.match(/// [\/\\] ([^\/\\]+) $///)
		return lMatches[1]
	else
		return filePath

# ---------------------------------------------------------------------------

export getV8Stack = (hOptions={}) =>
	# --- ignores any stack frames from this module
	#     *.js files will be mapped to *.coffee files
	#        if a source map is available

	debug = hOptions.debug || false

	try
		oldLimit = Error.stackTraceLimit
		oldPreparer = Error.prepareStackTrace

		Error.stackTraceLimit = Infinity
		Error.prepareStackTrace = (error, lCallSites) =>
			lFrames = []
			debugger
			for oSite in lCallSites
				fileURL = oSite.getFileName()
				if defined(fileURL)
					hParsed = parseFileURL(fileURL)
					filePath = hParsed.source

				if (typeof filePath == 'string') && (filePath.length > 0)
					# --- Ignore any stack entries from this module
					pos = filePath.indexOf('v8-stack.js')
					if (pos >= 0)
						if debug
							console.log "SKIP: filePath = '#{filePath}'"
						continue

				objType = oSite.getTypeName()
				thisVal = oSite.getThis()
				functionName = oSite.getFunctionName()
				methodName = oSite.getMethodName()
				line = oSite.getLineNumber()
				column = oSite.getColumnNumber()

				# --- Set type
				if oSite.isEval()
					type ='eval'
				else if oSite.isNative()
					type = 'native'
				else if oSite.isConstructor()
					type = 'constructor'
				else if defined(methodName)
					type = 'method'
				else
					type = 'function'

				if debug
					console.log '-'.repeat(40)
					console.log "type = '#{type}'"
					console.log "objType = '#{objType}'"
					console.log "filePath = '#{filePath}'"
					console.log "functionName = '#{functionName}'"
					console.log "methodName = '#{methodName}'"
					console.log "at #{line}:#{column}"

				# --- Ignore this entry and any before it
				if (objType == 'ModuleJob')
					break

				{dir, name: stub, ext} = pathLib.parse(filePath)
				hFrame = {
					type
					filePath
					fileName: extractFileName(filePath)
					dir
					stub
					ext
					functionName
					line
					column
					isAsync: oSite.isAsync()
					}

				if (type == 'method')
					hFrame.objType = objType
					hFrame.methodName = methodName

				# --- If main body of a script, stop here
				if (type == 'function') && notdefined(functionName)
					hFrame.type = 'script'
					delete hFrame.functionName
					if (hFrame.ext == '.js')
						debugger
						mapJStoCoffee(hFrame)
					lFrames.push hFrame
					break

				if (ext == '.js')
					mapJStoCoffee(hFrame)
				lFrames.push hFrame

			return lFrames

		errObj = new Error()
		lStackFrames = errObj.stack
		assert (lStackFrames.length > 0), "lStackFrames is empty!"

		# --- reset to previous values
		Error.stackTraceLimit = oldLimit
		Error.prepareStackTrace = oldPreparer
	catch e
		return []
	return lStackFrames

# ---------------------------------------------------------------------------
# --- hFrame contains keys:
#        filePath
#        ext
#        line
#        column

export mapJStoCoffee = (hFrame) =>

	# --- Attempt to convert to original coffee file
	assert hasKey(hFrame, 'filePath')
	assert hasKey(hFrame, 'fileName')
	assert hasKey(hFrame, 'ext')
	assert hasKey(hFrame, 'line')
	assert hasKey(hFrame, 'column')

	{filePath, ext, line, column} = hFrame
	assert (ext == '.js'), "ext = #{ext}"

	hMapped = mapSourcePos filePath, line, column
	if defined(hMapped)
		# --- successfully mapped
		{source, line, column, name} = hMapped

		hFrame.filePath = withExt(hFrame.filePath, '.coffee')
		hFrame.fileName = withExt(hFrame.fileName, '.coffee')
		hFrame.ext = '.coffee'
		hFrame.line = hMapped.line
		hFrame.column = hMapped.column
		hFrame.source = hMapped.source
	return

# ---------------------------------------------------------------------------

export parseFileURL = (url) =>

	assert defined(url), "url is undef in parseFileURL()"
	lMatches = url.match(///^
			file : \/\/
			(.*)
			$///)
	if defined(lMatches)
		[_, pathStr] = lMatches
		{dir, base:fileName, name:stub, ext} = pathLib.parse(pathStr)
		if defined(dir) && (dir.indexOf('/') == 0)
			dir = dir.substr(1)   # --- strip leading '/'
		return {
			dir
			fileName
			source: "#{dir}/#{fileName}"
			stub
			ext
			}
	else
		lMatches = url.match(///^
				node : internal \/
				(.*)
				$///)
		if defined(lMatches)
			hParsed = {
				source: 'node'
				}
		else
			croak "Invalid file url: '#{url}'"
	return hParsed

# ---------------------------------------------------------------------------

export getMyOutsideCaller = () =>
	# --- Returned object has keys:
	#        type - eval | native | constructor | method | function
	#        functionName
	#        objType, methodName - if a method
	#        line
	#        column
	#        isAsync - if an async function

	try
		lStack = getV8Stack()
	catch err
		console.log "ERROR in getV8Stack(): #{err.message}"
		return undef

	fileName = undef
	for hNode,i in lStack
		if (fileName == undef)
			fileName = hNode.fileName
		else if (hNode.fileName != fileName)
			return hNode
	return undef

# ---------------------------------------------------------------------------

export getMyDirectCaller = () =>
	# --- Returned object has keys:
	#        type - eval | native | constructor | method | function
	#        functionName
	#        objType, methodName - if a method
	#        line
	#        column
	#        isAsync - if an async function

	try
		lStack = getV8Stack()
	catch err
		console.log "ERROR in getV8Stack(): #{err.message}"
		return undef

	return lStack[1]

# ---------------------------------------------------------------------------

export debugV8Stack = (flag=true) =>

	internalDebugging = flag
	return

# ---------------------------------------------------------------------------

export isFile = (filePath) =>

	try
		result = fs.lstatSync(filePath).isFile()
		return result
	catch err
		return false

# ---------------------------------------------------------------------------

export getV8StackStr = (hOptions={}) =>

	lStack = await getV8Stack(hOptions)
	lParts = for hNode in lStack
		nodeStr(hNode)
	return lParts.join("\n")
