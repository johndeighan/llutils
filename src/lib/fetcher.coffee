# fetcher.coffee

import {
	undef, defined, notdefined, OL, escapeStr, DUMP,
	blockToArray, arrayToBlock, getOptions,
	assert, croak, isEmpty, nonEmpty,
	} from '@jdeighan/llutils'
import {
	indentLevel, indented, undented, splitLine,
	} from '@jdeighan/llutils/indent'

# ---------------------------------------------------------------------------
# --- extract string => transform string => filter => return

export class LineFetcher

	constructor: (@block, hOptions={}) ->

		{debug: @debug} = getOptions hOptions, {
			debug: false
			}
		@curPos = 0
		@buffer = undef

	# ..........................................................

	EOF: () ->

		if (@curPos == -1)
			return true
		@fillBuffer()
		return (@curPos == -1) && notdefined(@buffer)

	# ..........................................................

	moreLines: () ->

		return defined(@peek())

	# ..........................................................

	transform: (str) ->

		return str.replaceAll("\r", "")

	# ..........................................................

	filter: (str) ->

		return true

	# ..........................................................
	# --- extract the next string, advancing @curPos
	#     transform string and return result

	extract: () ->

		assert (@curPos >= 0), "extract() when EOF"
		nlPos = @block.indexOf("\n", @curPos)
		if (nlPos == -1)
			str = @block.substring(@curPos)
			@curPos = -1
		else
			str = @block.substring(@curPos, nlPos)
			@curPos = nlPos + 1
		return @transform(str)

	# ..........................................................

	fillBuffer: () ->

		while (@curPos >= 0) && notdefined(@buffer)
			str = @extract()
			if @filter(str)
				@buffer = str
		return

	# ..........................................................

	peek: () ->

		if notdefined(@buffer)
			@fillBuffer()
		return @buffer     # will be undef if at EOF

	# ..........................................................

	fetch: () ->

		item = @peek()
		@buffer = undef
		return item

	# ..........................................................

	skip: () ->

		@fetch()
		return

	# ..........................................................

	dbg: (str, block=undef) ->

		if !@debug then return
		console.log str
		if defined(block)
			console.log block
		return

	# ..........................................................

	dump: (label='BLOCK') ->

		DUMP @block, label
		return

# ---------------------------------------------------------------------------
# --- Returns pairs, e.g. [3, 'abc']

export class PLLFetcher extends LineFetcher

	transform: (line) ->

		return splitLine(line)

	# ..........................................................

	filter: ([level, str]) ->

		return (level > 0) || nonEmpty(str)

	# ..........................................................

	peekLevel: () ->

		result = @peek()
		if notdefined(result)
			return -1
		return result[0]

	# ..........................................................

	getBlock: (level) ->

		lLines = []
		while (@peekLevel() >= level)
			[lvl, str] = @fetch()
			lLines.push indented(str, lvl-level)
		return lLines.join("\n")
