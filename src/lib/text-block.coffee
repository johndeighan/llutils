# text-block.coffee

import {
	undef, defined, notdefined, getOptions,
	toBlock, toArray, rpad, escapeStr,
	assert, croak, untabify, isString, OL, pass, centered,
	} from '@jdeighan/llutils'

# ---------------------------------------------------------------------------

export class TextBlock

	constructor: (hOptions={}) ->

		@hOptions = getOptions hOptions, {
			untabify: true
			}
		@maxLen = 0
		@lLines = []

	getLines: () -> return @lLines
	getBlock: () -> return toBlock(@lLines)

	# ..........................................................

	append: (block) ->

		assert isString(block), "Not a string: #{OL(block)}"
		for str in toArray(block)
			if @hOptions.untabify
				str = untabify(str, '!strict')
			if (str.length > @maxLen)
				@maxLen = str.length
			@lLines.push str
		return

	# ..........................................................

	prepend: (block) ->

		assert isString(block), "Not a string: #{OL(block)}"
		for str in toArray(block).reverse()
			if (str.length > @maxLen)
				@maxLen = str.length
			@lLines.unshift str
		return

# ---------------------------------------------------------------------------

export class TextBlockList

	constructor: (hOptions={}) ->

		hOptions = getOptions hOptions, {
			esc: false
			}
		@esc = hOptions.esc   # --- escape each string?

		@lLabels = []
		@lBlocks = []
		@maxLen = 0
		@maxLabelLen = 0

	# ..........................................................

	numBlocks: () ->

		assert (@lLabels.length == @lBlocks.length),
				"num blocks <> num labels"
		return @lBlocks.length

	# ..........................................................

	addBlock: (label, str=undef) ->

		assert isString(label), "Not a string: #{OL(label)}"
		assert (label.length > 0), "Zero length label"
		if (label.length > @maxLabelLen)
			@maxLabelLen = label.length
		@lLabels.push label

		block = new TextBlock()
		if defined(str)
			block.append str
			if (block.maxLen > @maxLen)
				@maxLen = block.maxLen
		@lBlocks.push block

		return

	# ..........................................................

	curBlock: () ->

		assert (@numBlocks > 0), "No blocks exist"
		return @lBlocks.at(-1)

	# ..........................................................

	append: (str) ->

		block = @curBlock()
		if @esc
			block.append escapeStr(str, 'hEsc=escNoNL')
		else
			block.append str
		if (block.maxLen > @maxLen)
			@maxLen = block.maxLen
		return

	# ..........................................................

	prepend: (str) ->

		block = @curBlock()
		if @esc
			block.prepend escapeStr(str, 'hEsc=escNoNL')
		else
			block.prepend str
		if (block.maxLen > @maxLen)
			@maxLen = block.maxLen
		return

	# ..........................................................

	asString: (hOptions={}) ->

		lLines = @asArray(hOptions)
		return toBlock(lLines)

	# ..........................................................

	asArray: (hOptions={}) ->

		{format, minWidth} = getOptions hOptions, {
			format: 'dashes'    # or 'box'
			minWidth: 40
			}

		width = @maxLen
		if (width < @maxLabelLen + 8)
			width = @maxLabelLen + 8
		if (width < minWidth)
			width = minWidth

		lLines = []   # --- build lines
		switch format

			when 'box'
				ul = '┌'
				ur = '┐'
				ll = '└'
				lr = '┘'
				vbar = '│'
				hbar = '─'
				lconn = '├'
				rconn = '┤'
				for block,i in @lBlocks
					if (i == 0)
						lLines.push ul + hbar + centered(@lLabels[i], width, {char: hbar}) + hbar + ur
					else
						lLines.push lconn + hbar + centered(@lLabels[i], width, {char: hbar}) + hbar + rconn
					for line in block.getLines()
						lLines.push vbar + ' ' + rpad(line, width) + ' ' + vbar
				lLines.push ll + hbar.repeat(width+2) + lr

			else
				for block,i in @lBlocks
					lLines.push centered(@lLabels[i], width, 'char=-')
					for line in block.getLines()
						lLines.push line
				lLines.push '-'.repeat(width)
		return lLines
