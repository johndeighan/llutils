# op-dumper.test.coffee

import {undef} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/op-dumper'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

succeeds () ->
	dumper = new OpDumper()
