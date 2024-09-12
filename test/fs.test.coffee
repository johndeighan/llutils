# fs.test.coffee

import {
	undef, gen2array, gen2block, sleep,
	} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/fs'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------
#symbol "normalize(path)"

equal normalize("C:\\temp"), "c:/temp"
equal normalize("c:\\temp/to/file.txt"), "c:/temp/to/file.txt"

# ---------------------------------------------------------------------------
#symbol "mkpath(...lParts)"

equal mkpath('.', 'test'), "c:/Users/johnd/llutils/test"
equal mkpath('C:\\temp', 'work'), "c:/temp/work"

# ---------------------------------------------------------------------------
#symbol "samefile(file1, file2)"

truthy samefile(
	"./test/fs.test.coffee",
	"c:/Users/johnd/llutils/test/fs.test.coffee"
	)

# ---------------------------------------------------------------------------
#symbol "relpath(...lParts)"

equal relpath(".", "temp"), "temp"

# ---------------------------------------------------------------------------
#symbol "isDir(dirPath)"

(() =>
	dir = "c:/Users/johnd/llutils/test/fs"

	truthy isDir(dir)
	truthy isDir(mkpath(dir, 'dir'))
	)()

# ---------------------------------------------------------------------------
#symbol "isFile(filePath)"

(() =>
	dir = "c:/Users/johnd/llutils/test/fs"

	truthy isFile(mkpath(dir, 'test.txt'))
	)()

# ---------------------------------------------------------------------------
#symbol "getFileStats(filePath)"

(() =>
	dir = "c:/Users/johnd/llutils/test/fs"

	like getFileStats("./test/fs/test.txt"), {
			size: 35
			}
	)()

# ---------------------------------------------------------------------------
#symbol "pathType(path)"

(() =>
	dir = "c:/Users/johnd/llutils/test/fs"

	equal pathType(mkpath(dir, 'dir')), 'dir'
	equal pathType(mkpath(dir, 'test.txt')), 'file'
	equal pathType(mkpath(dir, 'nowhere.txt')), 'missing'
	)()

# ---------------------------------------------------------------------------
#symbol "parsePath(filePath)"

like parsePath("./test/fs/test.txt"), {
	filePath: "c:/Users/johnd/llutils/test/fs/test.txt"
	size: 35
	}

like parsePath('./test/fs/file.test.txt'), {
	path: 'c:/Users/johnd/llutils/test/fs/file.test.txt'
	filePath: 'c:/Users/johnd/llutils/test/fs/file.test.txt'
	base: 'file.test.txt'
	fileName: 'file.test.txt'
	type: 'file'
	stub: 'file.test'
	ext: '.txt'
	purpose: 'test'
	size: 35
	}

# ---------------------------------------------------------------------------
#symbol "readTextFile(filePath)"

(() =>
	filePath = './test/fs/meta.txt'
	{hMetaData, reader, nLines} = readTextFile(filePath)
	iter = reader()

	equal hMetaData, {
		fName: 'John'
		lName: 'Deighan'
		}
	equal typeof reader, 'function'
	equal nLines, 4

	# --- test the reader
	equal iter.next(), {
		done: false
		value: 'abc'
		}
	equal iter.next(), {
		done: false
		value: 'def'
		}
	equal iter.next(), {
		done: true
		value: undef
		}
	)()

(() =>
	filePath = './test/fs/meta.txt'
	{hMetaData, reader} = readTextFile(filePath)
	equal typeof reader, 'function'

	# --- test the reader
	equal gen2array(reader), [
		'abc'
		'def'
		]
	)()

(() =>
	filePath = './test/fs/meta.txt'
	{hMetaData, reader} = readTextFile(filePath)
	equal typeof reader, 'function'

	# --- test the reader
	equal gen2block(reader), """
		abc
		def
		"""
	)()

# ---------------------------------------------------------------------------
#symbol "pathTo(fileName)"

equal mkpath(pathTo('llutils.coffee')), mkpath("src/lib/llutils.coffee")

# ---------------------------------------------------------------------------
#symbol "allPathsTo(fileName)"

lPaths = Array.from(allPathsTo('.symbols'), (x) => relpath(x))
equal lPaths, ['.symbols', '../.symbols']

# ---------------------------------------------------------------------------
#symbol "TextFileWriter"

(() =>
	writer = new TextFileWriter()
	writer.writeln('abc')
	writer.writeln('def')
	writer.writeln('ghi')
	writer.close('./test/fs/temp123.txt')

	await sleep(2)
	truthy isFile('./test/fs/temp123.txt')
	)()
