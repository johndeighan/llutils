# add-user-element.coffee

# --- Add a new binary executable file to an existing project

import {isEmpty} from '@jdeighan/llutils'
import {getArgs} from '@jdeighan/llutils/cmd-args'
import {promptForNames} from '@jdeighan/llutils/proj-utils'
import {NodeEnv} from '@jdeighan/llutils/node-env'

# ---------------------------------------------------------------------------
# --- If elements aren't specified on the command line,
#     they are prompted for

{_: lElems} = getArgs()

node = new NodeEnv()
if isEmpty(lElems)
	lElems = await promptForNames('New element name (Enter to end)')

for elem in lElems
	node.addUserElement elem
node.write_pkg_json()
