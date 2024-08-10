# proj-utils.test.coffee

import {undef} from '@jdeighan/llutils'
import * as lib from '@jdeighan/llutils/proj-utils'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

succeeds () => checkIfInstalled('node')
succeeds () => checkIfInstalled('npm')

setProjType('parcel')
truthy isOfType('parcel')
truthy isOfType('website')

env = new NodeEnv('!echo')
equal env.name(), "@jdeighan/llutils"
equal env.getField('license'), 'MIT'

env.setField 'dummy', 'dummy'
equal env.getField('dummy'), 'dummy'

truthy env.hasDep 'chokidar'
truthy env.hasDevDep 'npm-run-all'

truthy env.isInstalled('chokidar')
truthy env.isInstalled('npm-run-all')
