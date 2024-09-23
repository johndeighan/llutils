# low-level-build.config.coffee

import {undef, defined} from '@jdeighan/llutils'
import {procCoffee} from '@jdeighan/llutils/coffee'
import {procCielo} from '@jdeighan/llutils/cielo'
import {procSvelte} from '@jdeighan/llutils/svelte'
import {procPeggy} from '@jdeighan/llutils/peggy'
import {procDot} from '@jdeighan/llutils/lldot'

# ---------------------------------------------------------------------------
# --- func must be:
#        (code, hMetaData, filePath)
#     returning code or
#        { code, lUses, sourceMap, hOtherFiles }

export hConfig = {
	'echo': true

	'.coffee': { func: procCoffee, outExt: '.js' }
	'.cielo':  { func: procCielo,  outExt: '.js' }
	'.peggy':  { func: procPeggy,  outExt: '.js' }
	'.svelte': { func: procSvelte, outExt: '.js' }
	'.dot':    { func: procDot,    outExt: '.png'}
	}
