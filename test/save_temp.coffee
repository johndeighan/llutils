# save_temp.coffee

import {undef} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/data-extractor'
Object.assign(global, lib)

# ---------------------------------------------------------------------------

hData = {
	fName: 'John'
	lName: 'Deighan'
	address: {
		street: '1749 Creasy Reynolds Lane'
		city: 'Blacksburg'
		state: 'Virginia'
		zip: 24060
		}
	}

console.dir extract hData, """
	fName
	(address)
		state
	"""

