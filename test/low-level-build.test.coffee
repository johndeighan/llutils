# low-level-build.test.coffee

import {
	undef, defined, notdefined,
	} from '@jdeighan/llutils'
import {execCmd} from '@jdeighan/llutils/exec-utils'
import {deleteFilesMatching} from '@jdeighan/llutils/fs'
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

root = "./test/low-level-build"

# ---------------------------------------------------------------------------

deleteFilesMatching "#{root}/**/*.js"
bin = "./src/bin/low-level-build.js"
str = execCmd "node #{bin} -root=#{root}"
matches str, """
	1 *.cielo file compiled
	3 *.coffee files compiled
	1 *.peggy file compiled
	1 *.svelte file compiled
	"""

fileExists "#{root}/test.js", """
	// test.coffee
	console.log("testing");
	"""

fileExists "#{root}/testme.js", """
	// testme.cielo
	console.log("testing");
	"""

fileExists "#{root}/lang.js"
fileCompiles "#{root}/lang.js"

fileExists "#{root}/card.js"
fileCompiles "#{root}/card.js"
