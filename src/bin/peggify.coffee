# peggify.coffee
#
# --- designed to be a TextPad tool

import {defined, assert} from '@jdeighan/llutils'
import {TextBlockList} from '@jdeighan/llutils/text-block'
import {readTextFile, relpath} from '@jdeighan/llutils/fs'
import {peggify} from '@jdeighan/llutils/peggy'
import {DUMP} from '@jdeighan/llutils/dump'

# ---------------------------------------------------------------------------
# Usage:   node src/bin/peggify.js  *.peggy

filePath = process.argv[2]

{hMetaData, contents} = readTextFile filePath, 'eager'
if (process.argv[3] == 'debug')
	hMetaData.debug = true

blocks = new TextBlockList()
blocks.addBlock relpath(filePath), contents

{orgCode, preprocCode, js} = peggify contents, hMetaData
assert (orgCode == contents), "Bad org code"

if defined(preprocCode) && (preprocCode != orgCode)
	blocks.addBlock 'PreProcessed', preprocCode
blocks.addBlock 'JavaScript', js
console.log blocks.asString()
