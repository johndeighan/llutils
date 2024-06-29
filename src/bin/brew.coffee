# brew.coffee
#
# --- designed to be a TextPad tool

import {defined, assert} from '@jdeighan/llutils'
import {DUMP} from '@jdeighan/llutils/dump'
import {slurp} from '@jdeighan/llutils/fs'
import {brew} from '@jdeighan/llutils/coffee'

# ---------------------------------------------------------------------------

filepath = process.argv[2]
option = process.argv[3]
code = slurp filepath
DUMP code, filepath
if defined(option) && (option == 'debug')
	{orgCode, preprocCode, js} = brew code, {}, {debug: true}
else
	{orgCode, preprocCode, js} = brew code
assert (orgCode == code), "Bad org code"
if defined(preprocCode)
	DUMP preprocCode, 'PreProcessed code'
DUMP js, 'JavaScript'
