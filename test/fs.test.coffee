# fs.test.coffee

import {
	undef, gen2array, gen2block,
	} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/fs'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

equal normalize("C:\\temp"), "c:/temp"
equal mkpath('.', 'test'), "c:/Users/johnd/llutils/test"
equal mkpath('C:\\temp', 'work'), "c:/temp/work"
equal relpath(".", "temp"), "temp"

(() =>
	dir = "c:/Users/johnd/llutils/test/fs"

	truthy isDir(dir)
	truthy isDir(mkpath(dir, 'dir'))
	truthy isFile(mkpath(dir, 'test.txt'))
	like getFileStats("./test/fs/test.txt"), {
			size: 35
			}
	equal pathType(mkpath(dir, 'dir')), 'dir'
	equal pathType(mkpath(dir, 'test.txt')), 'file'
	equal pathType(mkpath(dir, 'nowhere.txt')), 'missing'
	)()

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
