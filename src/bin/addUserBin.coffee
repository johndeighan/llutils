# addUserBin.coffee

# --- Add a new binary executable file to an existing project

import {nonEmpty} from '@jdeighan/llutils'
import {getArgs} from '@jdeighan/llutils/cmd-args'
import {
	read_pkg_json, addBin, promptForBins,
	} from '@jdeighan/llutils/proj-utils'

# ---------------------------------------------------------------------------
# --- If libs aren't specified on the command line,
#     they are prompted for

{_: lBins} = getArgs()

read_pkg_json()
if nonEmpty(lBins)
	for bin in lBins
		addBin bin
else
	promptForBins()
write_pkg_json()

