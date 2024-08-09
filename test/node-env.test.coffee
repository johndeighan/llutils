# node-env.test.coffee

import {
	undef, defined, notdefined,
	} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/node-env'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

env = new NodeEnv()
equal env.name(), "@jdeighan/llutils"
equal env.getField('license'), 'MIT'

env.setField 'dummy', 'dummy'
equal env.getField('dummy'), 'dummy'

truthy env.hasDep 'chokidar'
truthy env.hasDevDep 'npm-run-all'

truthy env.isInstalled('chokidar')
truthy env.isInstalled('npm-run-all')
