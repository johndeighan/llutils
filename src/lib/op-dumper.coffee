# op-dumper.coffee

import fs from 'node:fs'
import {
	undef, defined, notdefined, isString, getOptions,
	assert, croak, range, centered, lpad, toBlock,
	} from '@jdeighan/llutils'
import {indented, undented} from '@jdeighan/llutils/indent'
import {DUMP, BOX} from '@jdeighan/llutils/dump'

# --------------------------------------------------------------------------

export class OpDumper

	constructor: (hOptions={}) ->

		{ignore} = getOptions hOptions, {
			ignore: [37, 38, 39, 40]
			}
		@lIgnore = ignore
		@level = 0
		@lLines = []

	# ..........................................................

	setStack: (stack) ->

		@stack = stack
		return

	# ..........................................................

	incLevel: () -> @level += 1
	decLevel: () -> @level -= 1

	# ..........................................................

	out: (str) ->
		@lLines.push "  ".repeat(@level) + str
		return

	# ..........................................................

	outOp: (index, op) ->

		if !@lIgnore.includes(op)
			@out "OP[#{lpad(index,2)}]: #{lpad(op,2)} #{@getName(op)}"

	# ..........................................................

	outBC: (lByteCodes) ->

		# --- For now, don't output anything
		return

		@out 'OPCODES: ' \
			+ lByteCodes \
				.filter((x) => !@lIgnore.includes(x)) \
				.map((x) => x.toString()) \
				.join(' ');
		return

	# ..........................................................

	outCode: (lLines, label) ->

		lLines = BOX toBlock(lLines), label, {
			echo: false
			asArray: true
			}
		for line in lLines
			@out line
		return

	# ..........................................................

	getBlock: () ->

		return @lLines.join("\n")

	# ..........................................................

	writeTo: (filePath) ->

		console.log "Writing opcodes to #{filePath}"
		fs.writeFileSync(filePath, @getBlock())
		return

	# ..........................................................

	getName: (op) ->

		switch op
			when  0 then return 'PUSH'
			when 35 then return 'PUSH_EMPTY_STRING'
			when  1 then return 'PUSH_UNDEFINED'
			when  2 then return 'PUSH_NULL'
			when  3 then return 'PUSH_FAILED'
			when  4 then return 'PUSH_EMPTY_ARRAY'
			when  5 then return 'PUSH_CURR_POS'
			when  6 then return 'POP'
			when  7 then return 'POP_CURR_POS'
			when  8 then return 'POP_N'
			when  9 then return 'NIP'
			when 10 then return 'APPEND'
			when 11 then return 'WRAP'
			when 12 then return 'TEXT'
			when 36 then return 'PLUCK'

			# ---  Conditions and Loops

			when 13 then return 'IF'
			when 14 then return 'IF_ERROR'
			when 15 then return 'IF_NOT_ERROR'
			when 30 then return 'IF_LT'
			when 31 then return 'IF_GE'
			when 32 then return 'IF_LT_DYNAMIC'
			when 33 then return 'IF_GE_DYNAMIC'
			when 16 then return 'WHILE_NOT_ERROR'

			# ---  Matching

			when 17 then return 'MATCH_ANY'
			when 18 then return 'MATCH_STRING'
			when 19 then return 'MATCH_STRING_IC'
			when 20 then return 'MATCH_CHAR_CLASS'
			when 20 then return 'MATCH_REGEXP'
			when 21 then return 'ACCEPT_N'
			when 22 then return 'ACCEPT_STRING'
			when 23 then return 'FAIL'

			# ---  Calls

			when 24 then return 'LOAD_SAVED_POS'
			when 25 then return 'UPDATE_SAVED_POS'
			when 26 then return 'CALL'

			# ---  Rules

			when 27 then return 'RULE'
			when 41 then return 'LIBRARY_RULE'

			# ---  Failure Reporting

			when 28 then return 'SILENT_FAILS_ON'
			when 29 then return 'SILENT_FAILS_OFF'

			when 37 then return 'SOURCE_MAP_PUSH'
			when 38 then return 'SOURCE_MAP_POP'
			when 39 then return 'SOURCE_MAP_LABEL_PUSH'
			when 40 then return 'SOURCE_MAP_LABEL_POP'

			else return '<UNKNOWN>'
