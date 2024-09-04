# low-level-build.config.coffee

import {
	brew, cieloPreProcess, sveltify,
	} from '@jdeighan/llutils/file-processor'
import {peggify} from '@jdeighan/llutils/peggy'

# ---------------------------------------------------------------------------

export hLLBConfig = {
	'echo': true
	'.coffee': {
		lFuncs: [brew]
		outExt: '.js'
		}
	'.cielo': {
		lFuncs: [cieloPreProcess, brew]
		outExt: '.js'
		}
	'.peggy': {
		lFuncs: [peggify]
		outExt: '.js'
		}
	'.svelte': {
		lFuncs: [sveltify]
		outExt: '.js'
		}
	}
