# exec-utils.test.coffee

import * as lib from '@jdeighan/llutils/exec-utils'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------
#symbol "execCmd(str)"    # --- execute a command

equal execCmd('echo this'), "this\n"
equal execCmd('echo "Hello World" | wc -w'), "2\n"

# ---------------------------------------------------------------------------
#symbol "npmLogLevel()"    # --- get NPM log level

logLevel = npmLogLevel()
truthy (logLevel == 'silent') || (logLevel == 'warn')

# ---------------------------------------------------------------------------
