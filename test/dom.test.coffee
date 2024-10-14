# dom.test.coffee

import {
	undef, defined, notdefined, LOG, OL,
	assert, croak,
	} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/dom'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

equal formatXML('<doc><warn>Watch out!</warn></doc>'), """
	<doc>
		<warn>Watch out!</warn>
	</doc>
	"""
