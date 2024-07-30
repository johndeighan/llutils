# shebangify.coffee

import {assert} from '@jdeighan/llutils'
import {
	isProjRoot, allFilesMatching, readTextFile, slurp, barf,
	} from '@jdeighan/llutils/fs'

shebang = "#!/usr/bin/env node"

# ---------------------------------------------------------------------------

assert isProjRoot('.', 'strict'), "Not in package root dir"

for {relPath} from allFilesMatching('**/src/bin/*.js')
	contents = slurp relPath
	if !contents.match(/^\#\!/)
		console.log relPath
		barf shebang + "\n" + contents, relPath
