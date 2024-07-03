# dump.coffee

import {
	undef, defined, notdefined, getOptions, OL, log,
	centered, toTAML, isString, escapeBlock, Block,
	assert, croak, stripCR, toArray, toBlock, rpad,
	} from '@jdeighan/llutils'
import {toNICE} from '@jdeighan/llutils/to-nice'

# ---------------------------------------------------------------------------

export DUMP = (item, label=undef, hOptions={}) =>

	hOptions = getOptions hOptions, {
		esc: false
		width: 50
		dynamic: true
		oneLine: true
		format: undef    # --- can be 'JSON', 'TAML', 'NICE'
		sortKeys: undef
		echo: true
		nocr: true
		asArray: false
		}

	{esc, width, dynamic, oneLine, format,
		sortKeys, echo, nocr, asArray
		} = hOptions

	if defined(label)
		label = label.replaceAll('_',' ')

	if oneLine
		if nocr && isString(item)
			item = stripCR(item)
		str = OL(item, {esc})
		if defined(label)
			longStr = "#{label} = #{str}"
		else
			longStr = str
		if (longStr.length <= width)
			if echo
				console.log longStr
			if asArray
				return [longStr]
			else
				return longStr

	# --- Create a Block object
	block = new Block()

	if defined(format)
		switch format
			when 'JSON'
				block.add JSON.stringify(item, undef, 3)
			when 'TAML'
				block.add toTAML(item)
			when 'NICE'
				block.add toNICE(item, {sortKeys})
			else
				croak "Bad format: #{OL(format)}"
	else
		if isString(item)
			if esc
				for line in toArray(item)
					block.add escapeStr(line)
			else
				for line in toArray(item)
					block.add line
		else
			block.add toNICE(item)

	if dynamic
		width = block.maxLen + 4

	if defined(format)
		if defined(label)
			block.prepend centered("#{label} (as #{format})", width, 'char=-')
		else
			block.prepend centered("(as #{format})", width, 'char=-')
	else
		if defined(label)
			block.prepend centered(label, width, 'char=-')
		else
			block.prepend '-'.repeat(width)

	block.add '-'.repeat(width)

	if asArray
		return block.lLines
	else
		return block.getBlock()

# ---------------------------------------------------------------------------

ul = '┌'
ur = '┐'
ll = '└'
lr = '┘'
vbar = '│'
hbar = '─'

# ---------------------------------------------------------------------------

export BOX = (item, label=undef, hOptions={}) =>

	debugger
	hOptions = getOptions hOptions, {
		echo: true
		asArray: false
		width: 50
		}

	{echo, asArray, width} = hOptions

	hOptions = Object.assign({}, hOptions, {
		echo: false
		oneLine: false
		asArray: true
		})

	lLines = DUMP item, label, hOptions
	numLines = lLines.length
	lNewLines = for line,i in lLines
		if (i == 0)
			width = line.length
			ul + line.substring(0, line.length-2).replaceAll('-',hbar) + ur
		else if (i == numLines-1)
			ll + line.substring(0, line.length-2).replaceAll('-',hbar) + lr
		else
			"#{vbar} #{rpad(line, width-4)} #{vbar}"
	if echo
		for line in lNewLines
			console.log line
	if asArray
		return lNewLines
	else
		return toBlock(lNewLines)
