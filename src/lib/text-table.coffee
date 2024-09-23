# text-table.coffee

import {sprintf} from 'sprintf-js'

import {
	undef, defined, notdefined, getOptions, words, OL,
	toBlock, isEmpty, nonEmpty, rtrim,
	isString, isNumber, isInteger, isArray,
	isFunction, range, hasKey, untabify, padString,
	assert, croak,
	} from '@jdeighan/llutils'
import {toNICE} from '@jdeighan/llutils/to-nice'

# ---------------------------------------------------------------------------

export class TextTable

	constructor: (formatStr, hOptions={}) ->
		# --- Valid options:
		#        decPlaces - used for numbers with no % style format
		#                    default: 2
		#        parseNumbers - string data that looks like a number
		#                       is treated as a number, default: false

		@hOptions = getOptions hOptions, {
			decPlaces: 2
			parseNumbers: false
			}

		# --- sets @numCols, @lColAligns, @lColFormats
		@parseFormatString formatStr, hOptions

		# --- Items in @lRows must be a hash w/key 'opcode'
		@lRows = []
		@lColWidths = new Array(@numCols).fill(0)
		@totalWidth = undef
		@closed = false

		# --- Accumulate totals and subtotals
		#     When a subtotal row is added, subtotals are reset to 0
		@lColTotals    = new Array(@numCols).fill(undef)
		@lColSubTotals = new Array(@numCols).fill(undef)

	# ..........................................................

	parseFormatString: (formatStr, hOptions) ->

		assert defined(formatStr), "missing format string"

		lWords = words(formatStr)
		@numCols = lWords.length

		@lColAligns  = new Array(@numCols)
		@lColFormats = new Array(@numCols)

		for word,colNum in lWords
			if (lMatches = word.match(/^(l|c|r)(\%\S+)?$/))
				[_, align, fmt] = lMatches
				alignWord = switch align
					when 'l' then 'left'
					when 'c' then 'center'
					when 'r' then 'right'
					else undef
				assert defined(alignWord), "Bad format string: #{OL(formatStr)}"
				@lColAligns[colNum] = alignWord
				@lColFormats[colNum] = fmt       # may be undef
			else
				croak "Bad format string: #{OL(formatStr)}"
		return

	# ..........................................................

	resetSubTotals: () ->

		@lColSubTotals.fill(undef)
		return

	# ..........................................................

	alignItem: (item, colNum) ->

		assert @closed, "table not closed"
		assert isString(item), "Not a string: #{OL(item)}"
		if (item.length == width)
			return item
		align = @lColAligns[colNum]
		assert ['left','center','right'].includes(align), \
				"Bad align parm: #{OL(align)}"
		width = @lColWidths[colNum]
		return alignString(item, width, align)

	# ..........................................................

	formatItem: (item, colNum) ->

		if notdefined(item)
			return ''
		fmt = @lColFormats[colNum]
		if defined(fmt)
			return sprintf(fmt, item)
		else if isString(item)
			return item
		else if isNumber(item)
			return item.toFixed(@hOptions.decPlaces)
		else
			return OL(item)

	# ..........................................................

	dumpInternals: () ->

		LOGVALUE 'totalWidth', @totalWidth
		LOGVALUE 'numCols:', @numCols
		LOGVALUE 'lColWidths:', @lColWidths
		LOGVALUE 'lColAligns', @lColAligns
		LOGVALUE 'lColFormats:', @lColFormats
		if nonEmpty(@lColTotals)
			LOGVALUE 'lColTotals:', @lColTotals
		if nonEmpty(@lColSubTotals)
			LOGVALUE 'lColSubTotals:', @lColSubTotals
		if nonEmpty(@lRows)
			LOGVALUE 'lRows:', @lRows
		return

	# ..........................................................
	# --- adjust column to width at least minWidth

	adjust: (colNum, minWidth) ->

		if (minWidth > @lColWidths[colNum])
			@lColWidths[colNum] = minWidth
		return

	# ..........................................................

	adjustColWidths: (lRow) ->

		for item,colNum in lRow
			if isString(item)
				@adjust colNum, item.length
			else if isArray(item)
				for str in item
					@adjust colNum, str.length
		return

	# ..........................................................

	accum: (num, colNum) ->

		assert isNumber(num), "Not a number: #{OL(num)}"

		if defined(@lColTotals[colNum])
			@lColTotals[colNum] += num
		else
			@lColTotals[colNum] = num

		if defined(@lColSubTotals[colNum])
			@lColSubTotals[colNum] += num
		else
			@lColSubTotals[colNum] = num

		return

	# ..........................................................

	labels: (lRow) ->

		assert ! @closed, "table is closed"
		assert isArray(lRow), "Not an array: #{OL(lRow)}"
		assert (lRow.length == @numCols),
				"bad length: lRow = #{OL(lRow)}"
		@adjustColWidths lRow
		hRow = {
			opcode: 'labels'
			lRow
			}
		@lRows.push hRow
		return

	# ..........................................................

	data: (lRow) ->

		assert ! @closed, "table is closed"
		assert isArray(lRow), "Not an array: #{OL(lRow)}"
		assert (lRow.length == @numCols), "lRow = #{OL(lRow)}"
		lRow = lRow.map (item, colNum) =>
			if notdefined(item)
				return ''
			else if isString(item)
				if @hOptions.parseNumbers && item.match(///^
						\d+         # one or more digits
						(\.\d*)?    # optional decimal part
						([Ee]\d+)?  # optional exponent
						$///)
					num = parseFloat(item)
					@accum num, colNum
					formatted = @formatItem(num, colNum)
					return formatted
				else
					return item
			else if isNumber(item)
				@accum item, colNum
				formatted = @formatItem(item, colNum)
				return formatted
			else
				formatted = @formatItem(num, colNum)
				return formatted
		@adjustColWidths lRow
		@lRows.push {
			opcode: 'data'
			lRow
			}
		return

	# ..........................................................

	sep: (ch='-') ->

		assert ! @closed, "table is closed"
		assert (ch.length == 1), "Non-char arg"
		@lRows.push {
			opcode: 'sep'
			ch
			}
		return

	# ..........................................................

	fullsep: (ch='-') ->

		assert ! @closed, "table is closed"
		assert (ch.length == 1), "Non-char arg"
		@lRows.push {
			opcode: 'fullsep'
			ch
			}
		return

	# ..........................................................

	title: (title, align='center') ->

		assert ! @closed, "table is closed"
		assert isString(title, 'nonempty'), "Bad title: '@{title}'"
		assert ['left','center','right'].includes(align),
			"Bad align: #{OL(align)}"
		@lRows.push {
			opcode: 'title'
			title
			align
			}
		return

	# ..........................................................

	totals: () ->

		assert ! @closed, "table is closed"
		lRow = @lColTotals.map (item, colNum) =>
			return @formatItem(item, colNum)
		@adjustColWidths lRow
		@lRows.push {
			opcode: 'totals'
			lRow
			}
		return

	# ..........................................................

	subtotals: () ->

		assert ! @closed, "table is closed"
		lRow = @lColSubTotals.map (item, colNum) =>
			return @formatItem(item, colNum)
		@resetSubTotals()
		@adjustColWidths lRow
		@lRows.push {
			opcode: 'subtotals'
			lRow
			}
		return

	# ..........................................................

	close: () ->

		# --- Allow multiple calls to close()
		if @closed
			return

		# --- We can now compute some other stuff
		@totalWidth = @lColWidths.reduce(
			(acc, n) => acc+n,
			0) + (@numCols - 1)

		# --- Go through @lRows, updating 'sep' entries
		for h in @lRows
			if (h.opcode == 'sep')
				h.lRow = @lColWidths.map((w) =>
					h.ch.repeat(w))

		@closed = true
		return

	# ..........................................................

	asString: (hOptions={}) ->

		@close()

		{hide} = getOptions hOptions, {
			hide: ''
			}

		if isEmpty(hide)
			width = @totalWidth
			lHide = []
		else
			if isInteger(hide)
				lHide = [hide]
			else
				lHide = hide.split(',').map((s) => parseInt(s))

			# --- We have to compute width
			width = 0
			for w,i in @lColWidths
				if ! lHide.includes(i)
					width += w+1
			width -= 1

		# --- Map each item in @lRows to a string
		lLines = @lRows.map (hRow) =>
			{opcode, title, lRow, ch, align} = hRow
			if defined(lRow)
				numCols = 0
				hColWidth = {}
				hColAlign = {}
				lRow = lRow.filter((elem, index) =>
					if lHide.includes(index)
						return false
					else
						hColWidth[numCols] = @lColWidths[index]
						hColAlign[numCols] = @lColAligns[index]
						++numCols
						return true
					)
			switch opcode
				when 'title'
					return padString(title, width, align)
				when 'sep'
					return lRow.join(' ')
				when 'fullsep'
					return ch.repeat(width)
				when 'labels'
					# --- labels are always center aligned
					return lRow.map((item, colNum) =>
						w = hColWidth[colNum]
						a = hColAlign[colNum]
						return padString(item, w, 'center')
						).join(' ')
				when 'data','totals','subtotals'
					return lRow.map((item, colNum) =>
						w = hColWidth[colNum]
						a = hColAlign[colNum]
						return padString(item, w, a)
						).join(' ')


		table = toBlock(lLines.map((line) => rtrim(line)))
		return table
