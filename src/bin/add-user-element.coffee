# add-user-element.coffee

# --- Add a new binary executable file to an existing project

import {isEmpty} from '@jdeighan/llutils'
import {getArgs} from '@jdeighan/llutils/cmd-args'
import {
	promptForNames, importCustomElement,
	} from '@jdeighan/llutils/proj-utils'
import {NodeEnv} from '@jdeighan/llutils/node-env'

# ---------------------------------------------------------------------------
# --- If elements aren't specified on the command line,
#     they are prompted for

{_: lElems} = getArgs {
	_: {
		min: 0
		max: Infinity
		}
	}

nodeEnv = new NodeEnv()
if isEmpty(lElems)
	lElems = await promptForNames(
		'New element name (Enter to end)',
		((name) =>
			if (name.indexOf('-') == -1)
				return "name must contain a hyphen"
			else
				return undef
			)
		)

for elem in lElems
	nodeEnv.addUserElement elem
	importCustomElement(elem)
nodeEnv.write_pkg_json()
