# config.test.coffee

import {
	undef, defined, notdefined,
	} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/config'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

succeeds () => getConfig()
