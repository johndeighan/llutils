# llpeggify.coffee
#
# --- Part of build process, can't use getArgs()

import {peggify} from '@jdeighan/llutils/peggy'
import {procFiles} from '@jdeighan/llutils/file-processor'

# ---------------------------------------------------------------------------

procFiles '**/*.peggy', peggify, '.js'
