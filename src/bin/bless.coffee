# bless.coffee
#
# --- designed to be a TextPad tool

import {defined, assert} from '@jdeighan/llutils'
import {TextBlockList} from '@jdeighan/llutils/text-block'
import {readTextFile, relpath} from '@jdeighan/llutils/fs'
import {bless} from '@jdeighan/llutils/cielo'

# ---------------------------------------------------------------------------
# Usage:   node src/bin/bless.js  *.cielo

filePath = process.argv[2]

# --- hMetaData will include key 'filePath'
{hMetaData, contents} = readTextFile filePath, 'eager'
if (process.argv[3] == 'debug')
	hMetaData.debug = true

blocks = new TextBlockList()
blocks.addBlock relpath(filePath), contents

{orgCode, preprocCode, js} = bless contents, hMetaData
assert (orgCode == contents), "Bad org code"

if defined(preprocCode) && (preprocCode != orgCode)
	blocks.addBlock 'PreProcessed', preprocCode
blocks.addBlock 'JavaScript', js
console.log blocks.asString()
