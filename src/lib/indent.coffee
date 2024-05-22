# indent.coffee

import {
	undef, defined, notdefined, pass, rtrim, OL,
	blockToArray, arrayToBlock,
	assert, croak, countChars,
	isString, isArray, isHash, isInteger,
	} from '@jdeighan/llutils'

export oneIndent = undef

# ---------------------------------------------------------------------------

export resetOneIndent = (val=undef) =>

	if defined(val)
		assert (val == '\t') || val.match(/^ +$/), "Bad oneIndent"
		oneIndent = val
	else
		oneIndent = undef
	return

# ---------------------------------------------------------------------------
#   indentLevel - determine indent level of a string
#                 it's OK if the string is ONLY indentation

export indentLevel = (line) =>

	assert isString(line), "not a string: #{OL(line)}"

	# --- This will always match, and it's greedy
	[prefix] = line.match(/^\s*/)

	if (prefix.length == 0)
		return 0

	# --- Check if we're using TABs or spaces
	numTABs = countChars(prefix, "\t")
	numSpaces = countChars(prefix, " ")
	if (numTABs > 0) && (numSpaces > 0)
		croak "Invalid mix of TABs and spaces"

	# --- oneIndent must be one of:
	#        undef
	#        a single TAB character
	#        some number of space characters

	# --- Set variables oneIndent & level
	switch oneIndent
		when undef
			if (numTABs > 0)
				level = numTABs
				oneIndent = "\t"
			else
				level = 1
				oneIndent = ' '.repeat(numSpaces)
		when "\t"
			assert (numSpaces == 0), "Expecting TABs, found spaces"
			level = numTABs
		else
			# --- using some number of spaces
			assert (numTABs == 0), "Expecting spaces, found TABs"
			assert (numSpaces % oneIndent.length == 0), "Invalid num spaces"
			level = numSpaces / oneIndent.length

	return level

# ---------------------------------------------------------------------------
#   splitLine - separate a line into [level, line]

export splitLine = (line) =>

	[_, prefix, str] = line.match(/^(\s*)(.*)$/)
	return [indentLevel(prefix), str.trim()]

# ---------------------------------------------------------------------------
#   indented - add indentation to each string in a block or array
#            - returns the same type as input, i.e. array or string

export indented = (input, level=1) =>

	assert isInteger(level, {min:0}), "Invalid level: #{OL(level)}"
	if (level == 0)
		return input
	if notdefined(oneIndent)
		oneIndent = "\t"
	toAdd = oneIndent.repeat(level)

	# --- input must be either a string or array of strings
	if isArray(input)
		lLines = input
	else if isString(input)
		lLines = blockToArray(input)
	else
		croak "invalid input: #{OL(input)}"

	# --- NOTE: don't add indentation to empty lines
	lNewLines = []
	lNewLines = for line in lLines
		line = rtrim(line)
		if (line == '')
			''
		else
			"#{toAdd}#{line}"

	if isArray(input)
		return lNewLines
	else
		return arrayToBlock(lNewLines)

# ---------------------------------------------------------------------------
#   undented - string with 1st line indentation removed for each line
#            - returns same type as input, i.e. either string or array

export undented = (input) =>

	# --- input must be either a string or array of strings
	if isString(input)
		lLines = blockToArray(input)
	else if isArray(input)
		lLines = input
	else
		croak "invalid input: #{OL(input)}"

	# --- NOTE: leave empty lines empty
	toRemove = undef
	nToRemove = undef
	lNewLines = for line in lLines
		line = rtrim(line)
		if (line == '')
			''
		else if notdefined(toRemove)
			[_, prefix, rest] = line.match(/^(\s*)(.*)$/)
			if (prefix.length == 0)
				line
			else
				toRemove = prefix
				nToRemove = prefix.length
				rest
		else
			assert (line.indexOf(toRemove)==0),
				"can't remove #{OL(toRemove)} from #{OL(line)}"
			line.substr(nToRemove)

	if isString(input)
		return arrayToBlock(lNewLines)
	else
		return lNewLines
