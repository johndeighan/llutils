# fetcher.coffee

import {
	undef, defined, notdefined, OL, escapeStr, DUMP,
	blockToArray, arrayToBlock, getOptions,
	} from '@jdeighan/llutils'
import {indentLevel, undented} from '@jdeighan/llutils/indent'

# ---------------------------------------------------------------------------

export class Fetcher

	constructor: (block, hOptions={}) ->

		{filterFunc, debug} = getOptions hOptions, {
			filterFunc: undef
			debug: false
			}

		@lLines = blockToArray(block)
		if defined(filterFunc)
			@lLines = @lLines.filter(filterFunc)
		@debug = debug

	# ..........................................................

	numLines: () ->

		return @lLines.length

	# ..........................................................

	dump: (label='BLOCK') ->

		DUMP @lLines, label

	# ..........................................................

	dbg: (str, block=undef) ->

		if !@debug then return
		console.log str
		if defined(block)
			console.log block
		return

	# ..........................................................

	moreLines: () ->

		result = (@lLines.length > 0)
		@dbg "MORE_LINES => #{OL(result)}"
		return result

	# ..........................................................

	next: () ->

		if (@lLines.length == 0)
			@dbg "NEXT => undef"
			return undef
		else
			@dbg "NEXT => #{escapeStr(@lLines[0])}"
			return @lLines[0]

	# ..........................................................

	nextLevel: () ->

		if (@next() == undef)
			level = 0
		else
			level = indentLevel(@lLines[0])
		@dbg "NEXT LEVEL => #{OL(level)}"
		return level

	# ..........................................................

	get: () ->

		line = @lLines.shift()
		@dbg "GET => #{escapeStr(line)}"
		return line

	# ..........................................................

	skip: () ->

		@lLines.shift()
		@dbg "SKIP =>"
		return

	# ..........................................................
	# --- returns undented block

	getBlock: (minLevel) ->

		lBlockLines = while (@nextLevel() >= minLevel)
			@get()
		if (lBlockLines.length == 0)
			@dbg "GET BLOCK (#{minLevel}) => undef"
			return undef
		else
			block = arrayToBlock(undented(lBlockLines))
			@dbg "GET BLOCK (#{minLevel}) =>", block
			return block
