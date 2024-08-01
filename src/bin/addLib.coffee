# addLib.coffee

# --- Add a new library file to an existing project

import {
	undef, defined, notdefined,
	} from '@jdeighan/llutils'
import {getArgs} from '@jdeighan/llutils/cmd-args'
import {
	read_pkg_json, addLib, promptForLibs,
	} from '@jdeighan/llutils/proj-utils'

# ---------------------------------------------------------------------------
# --- If libs aren't specified on the command line,
#     they are prompted for

{_: lLibs} = getArgs()

read_pkg_json()
if nonEmpty(lLibs)
	for lib in lLibs
		addLib lib
else
	promptForLibs()
write_pkg_json()

