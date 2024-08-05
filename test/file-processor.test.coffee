# file-processor.test.coffee

import {undef} from '@jdeighan/llutils'
import {deleteFilesMatching} from '@jdeighan/llutils/fs'
import {brew} from '@jdeighan/llutils/llcoffee'
import {peggify} from '@jdeighan/llutils/peggy'
import {cieloPreProcess} from '@jdeighan/llutils/cielo'
import {sveltify} from '@jdeighan/llutils/svelte-utils'

import * as lib from '@jdeighan/llutils/file-processor'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

deleteFilesMatching "./test/file-processor/**/*.js"
deleteFilesMatching "./test/file-processor/**/*.map"

hOptions = {
	echo: false
	}

nCoffee = procFiles "./test/file-processor/**/*.coffee", '.js', brew, hOptions
equal nCoffee, 3

nPeggy = procFiles "./test/file-processor/**/*.peggy", '.js', peggify, hOptions
equal nPeggy, 1

nCielo = procFiles "./test/file-processor/**/*.cielo", '.js', [cieloPreProcess, brew], hOptions
equal nCielo, 1

nSvelte = procFiles "./test/file-processor/**/*.svelte", '.js', sveltify, hOptions
equal nCielo, 1
