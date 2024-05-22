# Section.coffee

import {
	undef, defined, toBlock, assert, croak, OL,
	isArray, isEmpty, isFunction, isInteger,
	} from '@jdeighan/llutils'
import {indented} from '@jdeighan/llutils/indent'

# ---------------------------------------------------------------------------

export class Section

	constructor: (@name, @converter=undef) ->
		# --- name can be undef or empty

		@lLines = []
		if defined(@converter)
			assert isFunction(@converter),
					"bad converter in section #{OL(@name)}"

	# ..........................................................

	isEmpty: () ->

		return (@lLines.length == 0)

	# ..........................................................

	nonEmpty: () ->

		return (@lLines.length > 0)

	# ..........................................................

	add: (lLines...) ->

		if isInteger(lLines[0])
			level = lLines[0]
			for line,i in lLines
				if (i > 0)
					@lLines.push indented(line, level)
		else
			for line in lLines
				@lLines.push line
		return

	# ..........................................................

	prepend: (lLines...) ->

		if isInteger(lLines[0])
			level = lLines[0]
			for line,i in lLines.toReversed()
				if (i < lLines.length-1)
					@lLines.unshift indented(line, level)
		else
			for line in lLines.toReversed()
				@lLines.unshift line
		return

	# ..........................................................

	getParts: () ->

		return @lLines

	# ..........................................................

	getBlock: () ->

		if (@lLines.length == 0)
			return undef
		block = toBlock(@lLines)
		if defined(@converter)
			block = @converter block
		return block
