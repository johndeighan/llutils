# file-processor.test.coffee

import {undef, isString, assert, OL} from '@jdeighan/llutils'
import {deleteFilesMatching, slurp} from '@jdeighan/llutils/fs'
import {indented} from '@jdeighan/llutils/indent'
import {procPeggy} from '@jdeighan/llutils/peggy'
import {TextBlockList} from '@jdeighan/llutils/text-block'

import * as lib from '@jdeighan/llutils/file-processor'
Object.assign(global, lib)
import * as lib2 from '@jdeighan/llutils/utest'
Object.assign(global, lib2)

# ---------------------------------------------------------------------------

deleteFilesMatching "./test/file-processor/**/*.js"
deleteFilesMatching "./test/file-processor/**/*.map"

hResult = procFiles "./test/file-processor/**/*", '!echo'

## ADD TESTS ##

equal 2+2, 4
