# token.test.coffee

import {undef} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/token'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

equal parseToken("true"), {
	type: 'boolean'
	value: true
	}

equal parseToken("13"), {
	type: 'integer'
	value: 13
	}
