# llpeggify.coffee
#
# --- Part of build process, can't use getArgs()

import {globSync} from 'glob'
import {undef, defined, OL} from '@jdeighan/llutils'
import {
	allFilesMatching, withExt, newerDestFileExists,
	} from '@jdeighan/llutils/fs'
import {peggify} from '@jdeighan/llutils/peggy'
import {procFiles} from '@jdeighan/llutils/file-processor'

# ---------------------------------------------------------------------------

procFiles '**/*.peggy', peggify, '.js'
