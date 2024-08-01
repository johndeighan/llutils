# addUserBin.coffee

# --- Add a new binary executable file to an existing project

import {isEmpty} from '@jdeighan/llutils'
import {getArgs} from '@jdeighan/llutils/cmd-args'
import {promptForNames} from '@jdeighan/llutils/proj-utils'
import {NodeEnv} from '@jdeighan/llutils/node-env'

# ---------------------------------------------------------------------------
# --- If libs aren't specified on the command line,
#     they are prompted for

{_: lLibs} = getArgs()

node = new NodeEnv()
if isEmpty(lLibs)
	lLibs = await promptForNames('New binary name (Enter to end)')

for lib in lLibs
	node.addUserBin lib
node.write_pkg_json()
