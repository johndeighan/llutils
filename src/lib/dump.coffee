# dump.coffee

import {
	undef, defined, notdefined, getOptions, OL, log,
	centered, toTAML, isString, escapeBlock, toBlock,
	assert, croak, stripCR,
	} from '@jdeighan/llutils'
import {toNICE} from '@jdeighan/llutils/to-nice'

# ---------------------------------------------------------------------------

export DUMP = (item, label='RESULT', hOptions={}) =>

	{esc, width, oneLine, format, sortKeys, echo, nocr,
		} = getOptions hOptions, {
		esc: false
		width: 50
		oneLine: true
		format: undef    # --- can be 'JSON', 'TAML', 'NICE'
		sortKeys: undef
		echo: true
		nocr: true
		}
	label = label.replace('_',' ')

	# --- define an output() function
	lLines = []
	output = (str) =>
		lLines.push str
		if echo
			log str

	if oneLine
		if nocr && isString(item)
			item = stripCR(item)
		str = OL(item, {esc})
		longStr = "#{label} = #{str}"
		if (longStr.length <= width)
			output longStr
			return toBlock(lLines)

	if defined(format)
		output centered("#{label} (as #{format})", width, 'char=-')
	else
		output centered(label, width, 'char=-')

	if defined(format)
		switch format
			when 'JSON'
				output JSON.stringify(item, undef, 3)
			when 'TAML'
				output toTAML(item)
			when 'NICE'
				output toNICE(item, {sortKeys})
			else
				croak "Bad format: #{OL(format)}"
	else if isString(item)
		if esc
			output escapeBlock(item)
		else
			output item
	else
		output toNICE(item)

	output '-'.repeat(width)
	return toBlock(lLines)
