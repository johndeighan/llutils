# low-level-build.test.coffee

import {
	undef, defined, notdefined, execCmd,
	} from '@jdeighan/llutils'
import {deleteFilesMatching} from '@jdeighan/llutils/fs'
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

deleteFilesMatching "./test/low-level-build/**/*.js"
bin = "./src/bin/low-level-build.js"
root = "./test/low-level-build"
str = execCmd "node #{bin} -root=#{root}"
matches str, """
	3 *.coffee files compiled
	1 *.cielo file compiled
	1 *.peggy file compiled
	1 *.svelte file compiled
	"""
