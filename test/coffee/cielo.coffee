# cielo.coffee

import {
	undef, defined, notdefined, getOptions, OL,
	assert, gen2block, isString,
	} from '@jdeighan/llutils'
import {indented, splitLine} from '@jdeighan/llutils/indent'
import {
	barf, isFile, withExt, readTextFile,
	} from '@jdeighan/llutils/fs'
import {brew} from '@jdeighan/llutils/llcoffee'
import {LineFetcher} from '@jdeighan/llutils/fetcher'
import {replaceHereDocs} from '@jdeighan/llutils/heredoc'

# ---------------------------------------------------------------------------

export bless = (code, hMetaData={}) ->

	assert isString(code), "code: #{OL(code)}"
	hMetaData.preprocess = cieloPreProcess
	return brew code, hMetaData

# ---------------------------------------------------------------------------

export blessFile = (filePath) ->

	assert isFile(filePath), "No such file: #{filePath}"
	{hMetaData, reader} = readTextFile(filePath)
	code = gen2block(reader)
	{js, sourceMap, preprocCode} = bless code, hMetaData, {filePath}
	if preprocCode
		barf preprocCode, withExt(filePath, '.coffee.txt')
	barf js, withExt(filePath, '.js')
	barf sourceMap, withExt(filePath, '.js.map')
	return {js, sourceMap}

# ---------------------------------------------------------------------------

export cieloPreProcess = (code, hOptions) =>

	{debug} = getOptions hOptions, {
		debug: false
		}

	if debug
		console.log "IN cieloPreProcess()"
	lLines = []
	src = new LineFetcher(code)
	while src.moreLines()
		[level, str] = splitLine(src.fetch())
		if (level == 0) && (str == '__END__')
			break
		if debug
			console.log "GOT: #{OL(str)} at level #{level}"
		str = replaceHereDocs(level, str, src)
		lLines.push indented(str, level)
	return lLines.join("\n")

# ---------------------------------------------------------------------------
