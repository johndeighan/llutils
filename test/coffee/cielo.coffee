# cielo.coffee

import {
	undef, defined, notdefined, getOptions, OL,
	assert, gen2block, isString,
	} from '@jdeighan/llutils'
import {indented, splitLine} from '@jdeighan/llutils/indent'
import {
	barf, isFile, withExt, readTextFile,
	} from '@jdeighan/llutils/fs'
import {brew, cieloPreProcess} from '@jdeighan/llutils/file-processor'
import {LineFetcher} from '@jdeighan/llutils/fetcher'
import {replaceHereDocs} from '@jdeighan/llutils/heredoc'

# ---------------------------------------------------------------------------

export func = (code, hMetaData={}) ->

	assert isString(code), "code: #{OL(code)}"
	hMetaData.preprocess = cieloPreProcess
	return brew code, hMetaData
