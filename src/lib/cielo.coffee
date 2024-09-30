# cielo.coffee

import {
	undef, defined, notdefined, getOptions,
	assert, croak,
	} from '@jdeighan/llutils'
import {indented, splitLine} from '@jdeighan/llutils/indent'
import {procCoffee} from '@jdeighan/llutils/llcoffee'
import {LineFetcher} from '@jdeighan/llutils/fetcher'
import {replaceHereDocs} from '@jdeighan/llutils/heredoc'

# ---------------------------------------------------------------------------

export procCielo = (code, hMetaData={}, filePath=undef) ->

	coffeeCode = cieloPreProcess(code, hMetaData, filePath)
	return procCoffee coffeeCode, hMetaData, filePath

# ---------------------------------------------------------------------------

export cieloPreProcess = (code, hMetaData={}, filePath=undef) =>

	{debug} = getOptions hMetaData, {
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

