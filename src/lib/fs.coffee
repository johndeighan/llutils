# fs.coffee

import pathLib from 'node:path'
import urlLib from 'url'
import fs from 'node:fs'
import {globSync as glob} from 'glob'
import NReadLines from 'n-readlines'
import {temporaryFile} from 'tempy'

import {
	undef, defined, notdefined, words, OL, keys, hasKey,
	assert, croak, arrayToBlock, getOptions, sliceBlock,
	isString, isHash, gen2block, toTAML,
	} from '@jdeighan/llutils'
import {
	isMetaDataStart, convertMetaData,
	} from '@jdeighan/llutils/metadata'

export lStatFields = words(
	'dev ino mode nlink uid gid rdev size blksize blocks',
	'atimeMs mtimeMs ctimeMs birthtimeMs',
	'atime mtime ctime birthtime',
	)

lDirs = []

# ---------------------------------------------------------------------------

export pushCWD = (dir) =>

	lDirs.push process.cwd()
	process.chdir(dir)
	return

# ---------------------------------------------------------------------------

export popCWD = () =>

	assert (lDirs.length > 0), "directory stack is empty"
	dir = lDirs.pop()
	process.chdir(dir)
	return

# ---------------------------------------------------------------------------

export isProjRoot = (dir='.', hOptions={}) =>

	{strict} = getOptions hOptions, {
		strict: false
		}

	filePath = "#{dir}/package.json"
	if !isFile(filePath)
		return false

	if !strict
		return true

	lExpectedFiles = [
		'README.md'
		'.gitignore'
		]

	for name in lExpectedFiles
		filePath = "#{dir}/#{name}"
		if !isFile(filePath)
			return false

	lExpectedDirs = [
		'node_modules'
		'.git'
		'src'
		'src/lib'
		'src/bin'
		'test'
		]
	for name in lExpectedDirs
		dirPath = "#{dir}/#{name}"
		if !isDir(dirPath)
			return false

	return true

# ---------------------------------------------------------------------------
# All file/directory operations should operate from memory
#    and can therefore be synchronous
# Relies on the fact that modern OS's keep directory
#    information in memory
# ---------------------------------------------------------------------------
#     convert \ to /
# --- convert "C:..." to "c:..."

export normalize = (path) =>

	path = path.replaceAll '\\', '/'
	if (path.charAt(1) == ':')
		return path.charAt(0).toLowerCase() + path.substring(1)
	else
		return path

# ---------------------------------------------------------------------------
# --- Should be called like: myself(import.meta.url)
#     returns full path of current file

export myself = (url) =>

	path = urlLib.fileURLToPath url
	return normalize path

# ---------------------------------------------------------------------------

export mkpath = (lParts...) =>

	fullPath = pathLib.resolve lParts...
	return normalize fullPath

# ---------------------------------------------------------------------------

export relpath = (lParts...) =>

	fullPath = pathLib.resolve lParts...
	return normalize pathLib.relative('', fullPath)

# ---------------------------------------------------------------------------

export fileDir = (filePath) =>

	h = pathLib.parse(filePath)
	return h.dir

# ---------------------------------------------------------------------------
# --- returned hash has keys:
#
#  dev: 2114,
#  ino: 48064969,
#  mode: 33188,
#  nlink: 1,
#  uid: 85,
#  gid: 100,
#  rdev: 0,
#  size: 527,
#  blksize: 4096,
#  blocks: 8,
#  atimeMs: 1318289051000.1,
#  mtimeMs: 1318289051000.1,
#  ctimeMs: 1318289051000.1,
#  birthtimeMs: 1318289051000.1,
#  atime: Mon, 10 Oct 2011 23:24:11 GMT,
#  mtime: Mon, 10 Oct 2011 23:24:11 GMT,
#  ctime: Mon, 10 Oct 2011 23:24:11 GMT,
#  birthtime: Mon, 10 Oct 2011 23:24:11 GMT

export getFileStats = (path) =>

	return fs.lstatSync(path)

# ---------------------------------------------------------------------------

export isDir = (dirPath) =>

	if ! fs.existsSync(dirPath)
		return false
	try
		return getFileStats(dirPath).isDirectory()
	catch
		return false

# ---------------------------------------------------------------------------

export clearDir = (dirPath) =>

	try
		hOptions = {withFileTypes: true, recursive: true}
		for ent in fs.readdirSync(dirPath, hOptions)
			subEnt = mkpath(ent.path, ent.name)
			if ent.isFile()
				fs.rmSync subEnt
			else if ent.isDirectory()
				clearDir subEnt
	catch err
	return

# ---------------------------------------------------------------------------

export mkDir = (dirPath, hOptions={}) =>

	try
		fs.mkdirSync dirPath
		return true
	catch err
		if (err.code == 'EEXIST')
			if hOptions.clear
				clearDir dirPath
			return false
		else
			throw err

# ---------------------------------------------------------------------------

export isFile = (filePath) =>

	if ! fs.existsSync(filePath)
		return false
	try
		return getFileStats(filePath).isFile()
	catch
		return false

# ---------------------------------------------------------------------------

export touch = (filePath) =>

	fd = fs.openSync(filePath, 'a')
	fs.closeSync(fd)
	return

# ---------------------------------------------------------------------------
# --- returns one of:
#        'missing'  - does not exist
#        'dir'      - is a directory
#        'file'     - is a file
#        'unknown'  - exists, but not a file or directory

export pathType = (fullPath) =>

	assert isString(fullPath), "not a string"
	if fs.existsSync fullPath
		if isFile fullPath
			return 'file'
		else if isDir fullPath
			return 'dir'
		else
			return 'unknown'
	else
		return 'missing'

# ---------------------------------------------------------------------------

export parsePath = (path) =>
	# --- NOTE: path may be a file URL, e.g. import.meta.url
	#           path may be a relative path

	assert isString(path), "path is type #{typeof path}"

	if path.match(/^file\:\/\//)
		path = normalize urlLib.fileURLToPath(path)
	else
		# --- handles relative paths
		path = normalize pathLib.resolve(path)
	type = pathType path

	{root, dir, base, name, ext} = pathLib.parse(path)
	if lMatches = name.match(///
			\.
			([A-Za-z_]+)
			$///)
		purpose = lMatches[1]
	else
		purpose = undef
	hFile = {
		path
		filePath: path
		type
		root
		dir
		base
		fileName: base   # my preferred name
		name             # use this for directory name
		stub: name       # my preferred name
		ext
		purpose
		}
	if isFile(path)
		Object.assign hFile, getFileStats(path)
	return hFile

# ---------------------------------------------------------------------------

export parentDir = (path) =>

	hParsed = parsePath(path)
	return hParsed.dir

# ---------------------------------------------------------------------------

export parallelPath = (path, name="temp") =>

	fullPath = mkpath(path)  # make full path with '/' as separator
	{dir, fileName} = parsePath fullPath
	if (lMatches = dir.match(///^
			(.*)
			\/         # separator
			[^\/]+     # final dir name
			$///))
		[_, subpath] = lMatches
		return "#{subpath}/#{name}/#{fileName}"
	else
		croak "Can't get parallelPath for '#{path}'"

# ---------------------------------------------------------------------------

export subPath = (path, name="temp") =>

	fullPath = mkpath(path)  # make full path with '/' as separator
	{dir, fileName} = parsePath fullPath
	return "#{dir}/#{name}/#{fileName}"

# ---------------------------------------------------------------------------
#   slurp - read a file into a string

export slurp = (filePath, hOptions={}) =>

	{numLines, start} = getOptions hOptions, {
		numLines: undef
		start: 0
		}

	assert isString(filePath, 'nonEmpty'), "empty path"
	filePath = mkpath(filePath)
	assert isFile(filePath), "No such file: #{OL(filePath)}"
	block = fs.readFileSync(filePath, 'utf8') \
			.toString() \
			.replaceAll('\r', '')
	if defined(numLines)
		return sliceBlock(block, numLines, 0)
	else if (start > 0)
		return sliceBlock(block, numLines, 0)
	else
		return block

# ---------------------------------------------------------------------------
#   barf - write a string to a file
#          will ensure that all necessary directories exist

export barf = (contents, filePath) =>

	mkDirsForFile(filePath)
	fs.writeFileSync(filePath, contents)
	return

# ---------------------------------------------------------------------------

export pathSubDirs = (filePath) =>

	{root, dir} = pathLib.parse(filePath)
	return {
		root
		lParts: dir.slice(root.length).split(/[\\\/]/)
		}

# ---------------------------------------------------------------------------

export mkDirsForFile = (filePath) =>

	{root, lParts} = pathSubDirs(filePath)
	dir = root
	for part in lParts
		dir += "/#{part}"
		if ! isDir(dir)
			mkDir(dir)
	return

# ---------------------------------------------------------------------------
# --- yield hFile with keys:
#        path, filePath
#        type
#        root
#        dir
#        base, fileName
#        name, stub
#        ext
#        purpose
#     ...plus stat fields

export globFiles = (pattern='*', hGlobOptions={}) ->

	hGlobOptions = getOptions hGlobOptions, {
		withFileTypes: true
		stat: true
		}

	for ent in glob(pattern, hGlobOptions)
		filePath = mkpath(ent.fullpath())
		{root, dir, base, name, ext} = pathLib.parse(filePath)
		if lMatches = name.match(///
				\.
				([A-Za-z_]+)
				$///)
			purpose = lMatches[1]
		else
			purpose = undef
		if ent.isDirectory()
			type = 'dir'
		else if ent.isFile()
			type = 'file'
		else
			type = 'unknown'
		hFile = {
			filePath
			path: filePath
			relPath: relpath(filePath)
			type
			root
			dir
			base
			fileName: base
			name
			stub: name
			ext
			purpose
			}
		for key in lStatFields
			hFile[key] = ent[key]
		yield hFile
	return

# ---------------------------------------------------------------------------

export allFilesMatching = (pattern='*', hOptions={}) ->
	# --- yields hFile with keys:
	#        path, filePath,
	#        type, root, dir, base, fileName,
	#        name, stub, ext, purpose
	#        (if eager) hMetaData, lLines
	# --- Valid options:
	#        hGlobOptions - options to pass to glob
	#        fileFilter - return path iff fileFilter(filePath) returns true
	#        eager - read the file and add keys hMetaData, lLines
	# --- Valid glob options:
	#        ignore - glob pattern for files to ignore
	#        dot - include dot files/directories (default: false)
	#        cwd - change working directory

	{hGlobOptions, fileFilter} = getOptions(hOptions, {
		hGlobOptions: {
			ignore: "node_modules/**"
			}
		fileFilter: (h) =>
			{filePath: path} = h
			return isFile(path) && ! path.match(/\bnode_modules\b/i)
		})

	for h from globFiles(pattern, hGlobOptions)
		if fileFilter(h)
			yield h
	return

# ---------------------------------------------------------------------------
# --- fileFilter, if defined, gets (filePath)

export deleteFilesMatching = (pattern, hOptions={}) =>

	hOptions = getOptions hOptions, {
		fileFilter: undef
		}

	assert (pattern != '*'), "Can't delete files matching '*'"
	for {relPath} from allFilesMatching(pattern, hOptions)
		fs.rmSync relPath
	return

# ---------------------------------------------------------------------------

export allLinesIn = (filePath, filterFunc=undef) ->

	assert isFile(filePath), "No such file: #{OL(filePath)}"
	nReader = new NReadLines(filePath)
	loop
		buffer = nReader.next()
		if (buffer == false)
			return
		result = buffer.toString().replaceAll('\r', '')
		yield result

# ---------------------------------------------------------------------------

export fileExt = (filePath) =>

	if lMatches = filePath.match(/\.[^\.]+$/)
		return lMatches[0]
	else
		return ''

# ---------------------------------------------------------------------------

export withExt = (filePath, newExt) =>

	if newExt.indexOf('.') != 0
		newExt = '.' + newExt

	if lMatches = filePath.match(/^(.*)\.[^\.]+$/)
		[_, pre] = lMatches
		return pre + newExt
	throw new Error("Bad path: '#{filePath}'")

# ---------------------------------------------------------------------------

export newerDestFileExists = (srcPath, lDestPaths...) =>

	for destPath in lDestPaths
		if ! fs.existsSync(destPath)
			return false
		srcModTime = fs.statSync(srcPath).mtimeMs
		destModTime = fs.statSync(destPath).mtimeMs
		if (destModTime < srcModTime)
			return false
	return true

# ---------------------------------------------------------------------------

export readTextFile = (filePath, hOptions={}) =>
	# --- returns {hMetaData, reader, nLines}
	#        and possibly contents

	{eager} = getOptions hOptions, {
		eager: false
		}

	assert isFile(filePath), "No such file: #{filePath}"
	nReader = new NReadLines(filePath)
	getLine = () =>
		buffer = nReader.next()
		if (buffer == false)
			nReader = undef   # prevent further reads
			return undef
		return buffer.toString().replaceAll('\r', '')

	# --- we need to get the first line to check if
	#     there's metadata. But if there is not,
	#     we need to return it by the reader

	firstLine = getLine()
	if notdefined(firstLine)
		return {
			hMetaData: undef
			reader: () -> return undef
			nLines: 0
			}
	lMetaLines = undef
	hMetaData = undef

	# --- Get metadata if present
	if isMetaDataStart(firstLine)
		lMetaLines = []
		line = getLine()
		while line && (line != firstLine)
			lMetaLines.push line
			line = getLine()
		block = arrayToBlock(lMetaLines)
		hMetaData = convertMetaData(firstLine, block)

	# --- generator that allows reading contents
	reader = () ->
		if notdefined(lMetaLines)
			yield firstLine
		line = getLine()
		while defined(line)
			yield line
			line = getLine()
		return

	# --- number of lines in file
	nLines = if defined(lMetaLines)
		lMetaLines.length + 2
	else
		0

	if eager
		contents = gen2block(reader)
		assert defined(contents), "readTextFile(): undef contents"
		return {
			hMetaData
			contents
			nLines
			}
	else
		return {
			hMetaData
			reader
			nLines
			}

# ---------------------------------------------------------------------------

export class TextFileWriter

	constructor: (@filePath=undef) ->

		if !@filePath
			@filePath = temporaryFile()
		@writer = fs.createWriteStream(@filePath, {flags: 'w'})

	write: (str) ->

		@writer.write str
		return

	writeln: (str) ->

		@writer.write "#{str}\n"
		return

	close: (filePath=undef) ->

		@writer.end(() => fs.renameSync(@filePath, filePath))
		@writer = undef
		return

# ---------------------------------------------------------------------------

export insertLinesAfter = (filePath, regexp, lLines) =>

	if isString(lLines)
		lLines = [lLines]

	written = false
	{reader, hMetaData} = readTextFile(filePath)
	writer = new TextFileWriter()
	if defined(hMetaData)
		writer.writeln toTAML(hMetaData)
		writer.writeln('---')
	for input from reader()
		writer.writeln input
		if !written && input.match(regexp)
			for line in lLines
				writer.writeln line
			written = true
	writer.close filePath
	return

# ---------------------------------------------------------------------------
#    Get path to parent directory of a directory

export getParentDir = (dir) =>

	hParts = pathLib.parse(dir)
	if (hParts.dir == hParts.root)
		return undef
	return mkpath(pathLib.resolve(dir, '..'))

# ---------------------------------------------------------------------------
#    Get all subdirectories of a directory
#       don't return hidden or system subdirectories
#    Return value is just a name, not full paths

export getSubDirs = (dir) =>

	assert isDir(dir), "not a directory: #{OL(dir)}"

	doInclude = (d) ->
		if ! d.isDirectory()
			return false
		dirName = d.name
		if dir in ['$Recycle.Bin', '$WinREAgent']
			return false
		if (dirName.indexOf('.') == 0)
			return false
		return true

	hOptions = {
		withFileTypes: true
		recursive: false
		}
	return fs.readdirSync(dir, hOptions) \
			.filter(doInclude) \
			.map((d) -> d.name) \
			.sort()

# ---------------------------------------------------------------------------
# searches downward. Returns a single path or undef

export pathTo = (fileName, hOptions={}) =>

	{dir} = getOptions hOptions, {
		dir: undef
		}
	if defined(dir)
		assert isDir(dir), "Not a directory: #{OL(dir)}"
	else
		dir = process.cwd()

	# --- first check if the file is in dir

	filePath = mkpath(dir, fileName)
	if isFile(filePath)
		return filePath

	# --- Search all directories in this directory
	#     getSubDirs() returns dirs sorted alphabetically

	for subdir in getSubDirs(dir)
		filePath = pathTo fileName, {dir: mkpath(dir, subdir)}
		if defined(filePath)
			return filePath
	return undef

# ---------------------------------------------------------------------------
# searches upward. Yields multiple files

export allPathsTo = (fileName, hOptions={}) ->

	{dir} = getOptions hOptions, {
		dir: undef
		}
	if defined(dir)
		assert isDir(dir), "Not a directory: #{OL(dir)}"
	else
		dir = process.cwd()

	# --- first check if the file is in dir
	filePath = mkpath(dir, fileName)
	if isFile(filePath)
		yield filePath

	while defined(dir = getParentDir(dir))
		filePath = mkpath(dir, fileName)
		if isFile(filePath)
			yield filePath
	return

# ---------------------------------------------------------------------------
#   slurpJSON - read a file into a hash

export slurpJSON = (filePath) =>

	return JSON.parse(slurp(filePath))

# ---------------------------------------------------------------------------
#   slurpPkgJSON - read './package.json' into a hash

export slurpPkgJSON = (filePath='./package.json') =>

	return slurpJSON(filePath)

# ---------------------------------------------------------------------------
#   barfJSON - write a string to a file

export barfJSON = (hJson, filePath) =>

	assert isHash(hJson), "Not a hash: #{OL(hJson)}"
	for key in keys(hJson)
		if notdefined(hJson[key])
			delete hJson[key]
	str = JSON.stringify(hJson, null, "\t")
	barf(str, filePath)
	return

# ---------------------------------------------------------------------------
#   barfPkgJSON - write package.json file

lFields = words('name version type license author description',
                'exports bin scripts keywords devDependencies dependencies'
                )

export barfPkgJSON = (hJson, filePath='./package.json') =>

	assert isHash(hJson), "Not a hash: #{OL(hJson)}"

	# --- Create a new hash with keys in a particular order
	hJson2 = {}

	for key in lFields
		if hasKey(hJson, key)
			hJson2[key] = hJson[key]

	for key in keys(hJson)
		if ! hasKey(hJson2, key)
			hJson2[key] = hJson[key]

	barfJSON hJson2, filePath
	return
